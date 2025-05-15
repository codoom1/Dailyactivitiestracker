// Integration for IndexedDB-only storage approach
// This file extends script.js to work exclusively with the database implementation

// Initialize storage
async function initStorage() {
    try {
        // Check if IndexedDB is supported
        if (!isDatabaseSupported()) {
            alert("Your browser doesn't support IndexedDB. This application requires a modern browser with IndexedDB support.");
            return false;
        }
        
        // Initialize database
        await initDatabase();
        console.log("Database initialized and ready to use");
        return true;
    } catch (error) {
        console.error("Database initialization failed:", error);
        alert("Failed to initialize database: " + error.message + "\nPlease reload the page or try a different browser.");
        return false;
    }
}

// OVERRIDES FOR EXISTING FUNCTIONS

// Override getActivitiesFromStorage to only use database
async function getActivitiesFromStorage() {
    return await getAllActivities();
}

// Override getCustomCategoriesFromStorage
async function getCustomCategoriesFromStorage() {
    return await getAllCategories();
}

// Override saveActivityToStorage
async function saveActivityToStorage(activity) {
    await saveActivity(activity);
}

// Override deleteActivity
async function deleteActivityFromStorage(id) {
    await deleteActivity(id);
}

// Update the loadActivities function to work with async
async function loadActivitiesAsync(date = null) {
    // If no specific date is provided, use the date from the date input
    if (!date) {
        date = document.getElementById('activity-date').value;
    }
    
    // Get activities for the selected date
    const activities = await getActivitiesByDate(date);
    
    const timelineContainer = document.getElementById('timeline-container');
    
    if (activities.length === 0) {
        timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet for this date</p>';
        return;
    }
    
    // Clear the container
    timelineContainer.innerHTML = '';
    
    // Sort activities by time
    activities.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    // Display each activity
    activities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        timelineContainer.appendChild(activityElement);
    });
}

// Export data function for database only
async function exportDataToFile() {
    try {
        const data = await exportDatabaseData();
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create a unique filename based on date
        const exportName = `daily-activities-${new Date().toISOString().split('T')[0]}.json`;
        
        // Create a download link
        const downloadLink = URL.createObjectURL(dataBlob);
        const linkElement = document.createElement('a');
        linkElement.href = downloadLink;
        linkElement.download = exportName;
        linkElement.click();
        
        updateDatabaseStatus("Data exported successfully");
        
        // Clean up
        URL.revokeObjectURL(downloadLink);
    } catch (error) {
        console.error("Error exporting data:", error);
        alert("Failed to export data: " + error.message);
    }
}

// Import data function for database only
async function importDataFromFile(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the data
            if (!data.activities || !Array.isArray(data.activities)) {
                alert('Invalid data format - missing activities');
                return;
            }
            
            // Ask for confirmation
            if (confirm('This will replace all your existing activities. Continue?')) {
                await importDatabaseData(data);
                
                // Update UI
                updateDatabaseStatus("Data imported successfully");
                
                // Reload page to refresh all data
                alert('Data imported successfully!');
                window.location.reload();
            }
        } catch (error) {
            console.error("Error importing data:", error);
            alert("Failed to import data: " + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Add custom category
async function addCustomCategoryWithDB() {
    const customCategoryInput = document.getElementById('custom-category');
    const categoryName = customCategoryInput.value.trim().toLowerCase();
    
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }
    
    // Get existing custom categories
    const customCategories = await getCustomCategoriesFromStorage();
    
    // Check if category already exists
    if (categoryName === 'work' || categoryName === 'personal' || 
        categoryName === 'health' || categoryName === 'meals' || 
        categoryName === 'sleep' || categoryName === 'other' ||
        customCategories.includes(categoryName)) {
        alert('This category already exists');
        return;
    }
    
    // Generate a color for the new category
    const categoryColor = generateRandomColor();
    
    // Save to database
    await saveCategory({
        name: categoryName,
        color: categoryColor
    });
    
    // Add to select dropdown
    const categorySelect = document.getElementById('activity-category');
    const option = document.createElement('option');
    option.value = categoryName;
    option.textContent = capitalizeFirstLetter(categoryName);
    categorySelect.appendChild(option);
    
    // Clear input
    customCategoryInput.value = '';
    
    // Add CSS variable for the new category color
    addCategoryColorStyle(categoryName);
    
    updateDatabaseStatus("Category added");
}

// Generate random color for categories
function generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 50; // 50-80%
    const lightness = Math.floor(Math.random() * 20) + 30; // 30-50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Update initApp to initialize our storage
async function initAppWithDB() {
    // Initialize storage before anything else
    const dbInitialized = await initStorage();
    if (!dbInitialized) return;
    
    // Continue with regular initialization
    // Set today's date as the default for the date input
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('activity-date').value = formattedDate;
    
    // Display the current date
    displayCurrentDate();
    
    // Load custom categories first (before loading activities)
    await loadCustomCategoriesAsync();
    
    // Load activities from storage
    await loadActivitiesAsync();
    
    // Add event listeners
    document.getElementById('activity-form').addEventListener('submit', addActivityWithDB);
    document.getElementById('save-data-btn').addEventListener('click', exportDataToFile);
    document.getElementById('load-data').addEventListener('change', importDataFromFile);
    document.getElementById('add-category-btn').addEventListener('click', addCustomCategoryWithDB);
    document.getElementById('chart-type').addEventListener('change', updateChartFromDB);
    document.getElementById('date-range').addEventListener('change', updateChartFromDB);
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('activity-date').addEventListener('change', async function() {
        await loadActivitiesAsync(this.value);
        updateSummary();
    });
    
    // Initialize calendar
    initCalendar();
    
    // Update the summary
    await updateSummaryAsync();
    
    // Make sure the chart canvas is visible
    const chartCanvas = document.getElementById('activity-chart');
    if (chartCanvas) {
        chartCanvas.style.display = 'block';
    }
    
    // Initialize chart with database data
    await updateChartFromDB();
    
    // Setup modal handlers
    setupModalHandlers();
}

// Modified addActivity function
async function addActivityWithDB(e) {
    e.preventDefault();
    
    const dateInput = document.getElementById('activity-date');
    const timeInput = document.getElementById('activity-time');
    const durationInput = document.getElementById('activity-duration');
    const nameInput = document.getElementById('activity-name');
    const categorySelect = document.getElementById('activity-category');
    
    const activity = {
        id: Date.now().toString(),
        date: dateInput.value,
        time: timeInput.value,
        duration: parseInt(durationInput.value, 10),
        name: nameInput.value,
        category: categorySelect.value
    };
    
    // Save to database
    await saveActivityToStorage(activity);
    
    // Clear some form fields but keep date
    nameInput.value = '';
    
    // Clear the timeline container and reload activities
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet</p>';
    
    // Update UI
    console.log("Activity added, updating UI...");
    await dataChangedAsync();
    updateDatabaseStatus("Activity added");
}

// Modified loadCustomCategories function
async function loadCustomCategoriesAsync() {
    const customCategories = await getCustomCategoriesFromStorage();
    const categorySelect = document.getElementById('activity-category');
    
    customCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = capitalizeFirstLetter(category);
        categorySelect.appendChild(option);
        
        // Add CSS variable for the category color
        addCategoryColorStyle(category);
    });
}

// Modified dataChanged function
async function dataChangedAsync() {
    console.log("Data changed - updating UI components");
    // Update the UI
    await loadActivitiesAsync();
    await updateSummaryAsync();
    await updateChartFromDB();
    await updateCalendarIndicatorsAsync();
}

// Bind our new async functions to window
window.initAppWithDB = initAppWithDB;
window.loadActivitiesAsync = loadActivitiesAsync;
window.dataChangedAsync = dataChangedAsync;
