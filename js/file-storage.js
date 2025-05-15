// File-based storage functionality for Daily Activity Tracker
// Separate file to keep code organized

// Application configuration
const config = {
    autoSave: false,
    lastSavedTime: null,
    lastSavedFile: null,
    dataVersion: '1.1'
};

// Initialize file storage functionality
function initFileStorage() {
    // Add event listeners for file storage controls
    document.getElementById('save-data-btn').addEventListener('click', saveDataToFile);
    document.getElementById('load-data').addEventListener('change', loadDataFromFile);
    document.getElementById('auto-save-toggle').addEventListener('click', toggleAutoSave);
    
    // Load auto-save preference
    const autoSavePref = localStorage.getItem('autoSave');
    if (autoSavePref !== null) {
        config.autoSave = JSON.parse(autoSavePref);
        updateAutoSaveButton();
    }

    // Check for last saved information
    const lastSavedTime = localStorage.getItem('lastSavedTime');
    if (lastSavedTime) {
        config.lastSavedTime = new Date(lastSavedTime);
        updateLastSavedIndicator();
    }
}

// Save data to a JSON file
function saveDataToFile() {
    try {
        const activities = getActivitiesFromStorage();
        const customCategories = getCustomCategoriesFromStorage();
        
        const data = {
            activities,
            customCategories,
            version: config.dataVersion,
            savedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create a unique filename based on date
        const exportName = `daily-activities-${new Date().toISOString().split('T')[0]}.json`;
        
        // Create a download link
        const downloadLink = URL.createObjectURL(dataBlob);
        const linkElement = document.createElement('a');
        linkElement.href = downloadLink;
        linkElement.download = exportName;
        linkElement.click();
        
        // Update last saved time
        config.lastSavedTime = new Date();
        localStorage.setItem('lastSavedTime', config.lastSavedTime.toISOString());
        
        // Update the UI
        updateLastSavedIndicator();
        
        // Clean up
        URL.revokeObjectURL(downloadLink);
    } catch (error) {
        console.error('Error saving data to file:', error);
        alert('Failed to save data. Error: ' + error.message);
    }
}

// Load data from a JSON file
function loadDataFromFile(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the data
            if (!data.activities || !Array.isArray(data.activities)) {
                alert('Invalid data format - missing activities');
                return;
            }
            
            // Ask for confirmation before overwriting data
            if (confirm('This will replace all your existing activities. Continue?')) {
                // Import activities
                localStorage.setItem('dailyActivities', JSON.stringify(data.activities));
                
                // Import custom categories if present
                if (data.customCategories && Array.isArray(data.customCategories)) {
                    localStorage.setItem('customCategories', JSON.stringify(data.customCategories));
                }
                
                // Record last loaded file info
                config.lastSavedTime = data.savedAt ? new Date(data.savedAt) : new Date();
                localStorage.setItem('lastSavedTime', config.lastSavedTime.toISOString());
                
                // Update the UI to show last saved time
                updateLastSavedIndicator();
                
                // Reload the application with new data
                alert('Data loaded successfully!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error loading data from file:', error);
            alert('Failed to load data. Error: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Toggle auto-save functionality
function toggleAutoSave() {
    config.autoSave = !config.autoSave;
    localStorage.setItem('autoSave', JSON.stringify(config.autoSave));
    updateAutoSaveButton();
    
    // If auto-save is turned on, save the current data
    if (config.autoSave) {
        saveDataToFile();
    }
}

// Update the auto-save button text
function updateAutoSaveButton() {
    const btn = document.getElementById('auto-save-toggle');
    if (config.autoSave) {
        btn.textContent = "Auto Save: On";
        btn.classList.add('active');
    } else {
        btn.textContent = "Auto Save: Off";
        btn.classList.remove('active');
    }
}

// Update the last saved indicator text
function updateLastSavedIndicator() {
    const indicator = document.getElementById('last-saved');
    
    if (config.lastSavedTime) {
        const formattedTime = formatLastSavedTime(config.lastSavedTime);
        indicator.textContent = `Last saved: ${formattedTime}`;
    } else {
        indicator.textContent = 'Not saved yet';
    }
}

// Format the last saved time for display
function formatLastSavedTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Seconds difference
    
    if (diff < 60) {
        return 'Just now';
    } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

// Check if data needs auto-saving
function checkAutoSave() {
    if (config.autoSave) {
        saveDataToFile();
    }
}

// Monitor data changes for auto-save
function dataChanged() {
    // Update the UI first
    loadActivities();
    updateSummary();
    updateChart();
    updateCalendarIndicators();
    
    // If auto-save is enabled, save the data
    if (config.autoSave) {
        saveDataToFile();
    }
}
