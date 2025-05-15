document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    initApp();
});

function initApp() {
    // Set today's date as the default for the date input
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('activity-date').value = formattedDate;
    
    // Display the current date
    displayCurrentDate();
    
    // Load custom categories first (before loading activities)
    loadCustomCategories();
    
    // Load activities from localStorage
    loadActivities();
    
    // Add event listeners
    document.getElementById('activity-form').addEventListener('submit', addActivity);
    // Legacy export/import functions - keeping for backward compatibility
    if (document.getElementById('export-data-btn')) {
        document.getElementById('export-data-btn').addEventListener('click', exportData);
    }
    if (document.getElementById('import-data')) {
        document.getElementById('import-data').addEventListener('change', importData);
    }
    document.getElementById('add-category-btn').addEventListener('click', addCustomCategory);
    document.getElementById('chart-type').addEventListener('change', updateChart);
    document.getElementById('date-range').addEventListener('change', updateChart);
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('activity-date').addEventListener('change', function() {
        loadActivities(this.value);
        updateSummary();
    });
    
    // Initialize file-based storage functionality
    initFileStorage();
    
    // Initialize calendar
    initCalendar();
    
    // Update the summary
    updateSummary();
    
    // Initialize chart
    updateChart();
    
    // Setup modal events
    setupModal();
}

function displayCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = formattedDate;
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadActivities(date = null) {
    // If no specific date is provided, use the date from the date input
    if (!date) {
        date = document.getElementById('activity-date').value;
    }
    
    const activities = getActivitiesFromStorage();
    const timelineContainer = document.getElementById('timeline-container');
    const emptyTimeline = document.getElementById('empty-timeline');
    
    // Filter activities for the selected date
    const filteredActivities = activities.filter(activity => activity.date === date);
    
    if (filteredActivities.length === 0) {
        timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet for this date</p>';
        return;
    }
    
    // Clear the container
    timelineContainer.innerHTML = '';
    
    // Sort activities by time
    filteredActivities.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    // Display each activity
    filteredActivities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        timelineContainer.appendChild(activityElement);
    });
}

function createActivityElement(activity) {
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${activity.category}`;
    activityItem.dataset.id = activity.id;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'activity-time';
    
    // Include duration information
    const endTime = calculateEndTime(activity.time, activity.duration);
    timeElement.textContent = `${formatTime(activity.time)} - ${formatTime(endTime)} (${activity.duration} mins)`;
    
    const nameElement = document.createElement('div');
    nameElement.className = 'activity-name';
    nameElement.textContent = activity.name;
    
    const categoryElement = document.createElement('span');
    categoryElement.className = `activity-category ${activity.category}`;
    categoryElement.textContent = capitalizeFirstLetter(activity.category);
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.addEventListener('click', () => deleteActivity(activity.id));
    
    activityItem.appendChild(timeElement);
    activityItem.appendChild(nameElement);
    activityItem.appendChild(categoryElement);
    activityItem.appendChild(deleteButton);
    
    return activityItem;
}

function addActivity(e) {
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
    
    // Save to storage
    saveActivityToStorage(activity);
    
    // Clear some form fields but keep date
    nameInput.value = '';
    
    // Clear the timeline container and reload activities
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet</p>';
    
    // Use dataChanged to handle both UI updates and auto-save
    dataChanged();
}

function deleteActivity(id) {
    // Get activities from storage
    let activities = getActivitiesFromStorage();
    
    // Filter out the activity with the given id
    activities = activities.filter(activity => activity.id !== id);
    
    // Save the updated activities
    localStorage.setItem('dailyActivities', JSON.stringify(activities));
    
    // Clear the timeline container and reload activities
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet</p>';
    
    // Get current selected date
    const currentDate = document.getElementById('activity-date').value;
    
    // Use dataChanged to handle both UI updates and auto-save
    dataChanged();
}

function saveActivityToStorage(activity) {
    const activities = getActivitiesFromStorage();
    activities.push(activity);
    localStorage.setItem('dailyActivities', JSON.stringify(activities));
    
    // Check if we should auto-save to file
    checkAutoSave();
}

function getActivitiesFromStorage() {
    const activities = localStorage.getItem('dailyActivities');
    return activities ? JSON.parse(activities) : [];
}

function updateSummary() {
    // Get current selected date
    const selectedDate = document.getElementById('activity-date').value;
    
    const allActivities = getActivitiesFromStorage();
    const activities = allActivities.filter(activity => activity.date === selectedDate);
    
    const summaryContainer = document.getElementById('summary-container');
    
    // Clear the summary container
    summaryContainer.innerHTML = '';
    
    if (activities.length === 0) {
        summaryContainer.innerHTML = '<p class="empty-message">No activities to summarize for this date</p>';
        return;
    }
    
    // Count activities and minutes by category
    const categorySummary = {};
    activities.forEach(activity => {
        if (categorySummary[activity.category]) {
            categorySummary[activity.category].count++;
            categorySummary[activity.category].duration += parseInt(activity.duration || 0);
        } else {
            categorySummary[activity.category] = {
                count: 1,
                duration: parseInt(activity.duration || 0)
            };
        }
    });
    
    // Create a summary card for each category
    for (const category in categorySummary) {
        const card = document.createElement('div');
        card.className = `summary-card ${category}`;
        card.style.backgroundColor = getCategoryColor(category);
        
        const heading = document.createElement('h3');
        heading.textContent = capitalizeFirstLetter(category);
        
        const count = document.createElement('p');
        count.textContent = `${categorySummary[category].count} activities`;
        
        const duration = document.createElement('p');
        const hours = Math.floor(categorySummary[category].duration / 60);
        const minutes = categorySummary[category].duration % 60;
        duration.textContent = hours > 0 ? 
            `${hours}h ${minutes}m` : 
            `${minutes} mins`;
        duration.style.fontSize = '1rem';
        
        card.appendChild(heading);
        card.appendChild(count);
        card.appendChild(duration);
        summaryContainer.appendChild(card);
    }
}

function getCategoryColor(category) {
    const colors = {
        work: 'var(--work-color)',
        personal: 'var(--personal-color)',
        health: 'var(--health-color)',
        meals: 'var(--meals-color)',
        sleep: 'var(--sleep-color)',
        other: 'var(--other-color)'
    };
    
    return colors[category] || colors.other;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Clear all data - for development/testing
function clearAllData() {
    localStorage.removeItem('dailyActivities');
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet</p>';
    updateSummary();
}

// Calculate end time based on start time and duration
function calculateEndTime(timeString, durationMinutes) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    // Add duration
    date.setMinutes(date.getMinutes() + parseInt(durationMinutes));
    
    // Format time as HH:MM
    const endHours = String(date.getHours()).padStart(2, '0');
    const endMinutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
}

// Custom Categories
function addCustomCategory() {
    const customCategoryInput = document.getElementById('custom-category');
    const categoryName = customCategoryInput.value.trim().toLowerCase();
    
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }
    
    // Get existing custom categories
    const customCategories = getCustomCategoriesFromStorage();
    
    // Check if category already exists
    if (categoryName === 'work' || categoryName === 'personal' || 
        categoryName === 'health' || categoryName === 'meals' || 
        categoryName === 'sleep' || categoryName === 'other' ||
        customCategories.includes(categoryName)) {
        alert('This category already exists');
        return;
    }
    
    // Add to storage
    customCategories.push(categoryName);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
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
    
    // Check if we should auto-save to file
    checkAutoSave();
}

function getCustomCategoriesFromStorage() {
    const categories = localStorage.getItem('customCategories');
    return categories ? JSON.parse(categories) : [];
}

function loadCustomCategories() {
    const customCategories = getCustomCategoriesFromStorage();
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

function addCategoryColorStyle(category) {
    // Generate a random color
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 50; // 50-80%
    const lightness = Math.floor(Math.random() * 20) + 30; // 30-50%
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Add to style
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --${category}-color: ${color};
        }
        .activity-item.${category}::before { background-color: var(--${category}-color); }
        .activity-category.${category} { background-color: var(--${category}-color); }
    `;
    document.head.appendChild(style);
}

// Export/Import Data
function exportData() {
    const activities = getActivitiesFromStorage();
    const customCategories = getCustomCategoriesFromStorage();
    
    const data = {
        activities,
        customCategories,
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `daily-activities-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

function importData(event) {
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
                alert('Invalid data format');
                return;
            }
            
            // Ask for confirmation
            if (confirm('This will replace all your existing activities. Continue?')) {
                // Import activities
                localStorage.setItem('dailyActivities', JSON.stringify(data.activities));
                
                // Import custom categories if present
                if (data.customCategories && Array.isArray(data.customCategories)) {
                    localStorage.setItem('customCategories', JSON.stringify(data.customCategories));
                    
                    // Reload page to refresh all data
                    window.location.reload();
                } else {
                    // Just refresh the UI
                    loadActivities();
                    updateSummary();
                    updateChart();
                    initCalendar();
                }
                
                alert('Data imported successfully');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Calendar View
let currentCalendarDate = new Date();

function initCalendar() {
    updateCalendarMonth();
    generateCalendarGrid();
    updateCalendarIndicators();
}

function updateCalendarMonth() {
    const monthYear = currentCalendarDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    document.getElementById('calendar-month').textContent = monthYear;
}

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    updateCalendarMonth();
    generateCalendarGrid();
    updateCalendarIndicators();
}

function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for the first day (0 = Sunday, 6 = Saturday)
    const startDayOfWeek = firstDay.getDay();
    
    // Add day labels
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-day-label';
        dayLabel.textContent = day;
        calendarGrid.appendChild(dayLabel);
    });
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        // Mark today
        if (isCurrentMonth && i === today.getDate()) {
            day.classList.add('today');
        }
        
        // Format the date properly to ensure no timezone issues 
        // Format: YYYY-MM-DD
        const paddedMonth = String(month + 1).padStart(2, '0');
        const paddedDay = String(i).padStart(2, '0');
        const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
        
        day.dataset.date = dateStr;
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        
        const activityIndicator = document.createElement('div');
        activityIndicator.className = 'day-activity-indicator';
        
        day.appendChild(dayNumber);
        day.appendChild(activityIndicator);
        
        // Add click event to show activities for this day with correct data
        day.addEventListener('click', () => {
            // Log for debugging
            console.log(`Clicked on day ${i}, date string: ${dateStr}`);
            showActivitiesModal(dateStr);
        });
        
        calendarGrid.appendChild(day);
    }
}

function updateCalendarIndicators() {
    const activities = getActivitiesFromStorage();
    const calendarDays = document.querySelectorAll('.calendar-day');
    
    // Clear all indicators first
    calendarDays.forEach(day => {
        if (day.classList.contains('empty')) return;
        
        const indicator = day.querySelector('.day-activity-indicator');
        indicator.innerHTML = '';
        day.classList.remove('has-activity');
    });
    
    // Group activities by date and category
    const dateActivities = {};
    activities.forEach(activity => {
        if (!dateActivities[activity.date]) {
            dateActivities[activity.date] = {};
        }
        
        if (!dateActivities[activity.date][activity.category]) {
            dateActivities[activity.date][activity.category] = 0;
        }
        
        dateActivities[activity.date][activity.category]++;
    });
    
    // Add indicators to calendar
    calendarDays.forEach(day => {
        if (day.classList.contains('empty')) return;
        
        const dateStr = day.dataset.date;
        if (!dateActivities[dateStr]) return;
        
        day.classList.add('has-activity');
        
        const indicator = day.querySelector('.day-activity-indicator');
        
        for (const category in dateActivities[dateStr]) {
            const dot = document.createElement('div');
            dot.className = `activity-dot ${category}`;
            dot.style.backgroundColor = getCategoryColor(category);
            indicator.appendChild(dot);
        }
    });
}

// Modal functionality for calendar
function setupModal() {
    const modal = document.getElementById('activity-modal');
    const closeModal = document.querySelector('.close-modal');
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showActivitiesModal(dateStr) {
    const activities = getActivitiesFromStorage();
    const filteredActivities = activities.filter(activity => activity.date === dateStr);
    
    const modal = document.getElementById('activity-modal');
    const modalDate = document.getElementById('modal-date');
    const modalActivities = document.getElementById('modal-activities');
    
    // Format date for display
    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    modalDate.textContent = formattedDate;
    modalActivities.innerHTML = '';
    
    if (filteredActivities.length === 0) {
        modalActivities.innerHTML = '<p class="empty-message">No activities for this date</p>';
    } else {
        // Sort by time
        filteredActivities.sort((a, b) => a.time.localeCompare(b.time));
        
        filteredActivities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = `modal-activity ${activity.category}`;
            
            const timeElement = document.createElement('div');
            timeElement.className = 'modal-activity-time';
            const endTime = calculateEndTime(activity.time, activity.duration);
            timeElement.textContent = `${formatTime(activity.time)} - ${formatTime(endTime)} (${activity.duration} mins)`;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'modal-activity-name';
            nameElement.textContent = activity.name;
            
            const categoryElement = document.createElement('span');
            categoryElement.className = `activity-category ${activity.category}`;
            categoryElement.textContent = capitalizeFirstLetter(activity.category);
            
            activityElement.appendChild(timeElement);
            activityElement.appendChild(nameElement);
            activityElement.appendChild(categoryElement);
            
            modalActivities.appendChild(activityElement);
        });
    }
    
    modal.style.display = 'block';
}

// Charts
function updateChart() {
    const chartType = document.getElementById('chart-type').value;
    const dateRange = document.getElementById('date-range').value;
    
    // Get activities filtered by date range
    const activities = getFilteredActivities(dateRange);
    
    if (activities.length === 0) {
        const ctx = document.getElementById('activity-chart');
        ctx.style.display = 'none';
        return;
    }
    
    const ctx = document.getElementById('activity-chart');
    ctx.style.display = 'block';
    
    // Clear any existing chart
    if (window.activityChart) {
        window.activityChart.destroy();
    }
    
    let chartData;
    let chartOptions;
    
    if (chartType === 'category') {
        chartData = prepareCategoryChartData(activities);
        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Activities by Category'
                }
            }
        };
    } else if (chartType === 'time') {
        chartData = prepareTimeChartData(activities);
        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Time Spent by Category (minutes)'
                }
            }
        };
    } else if (chartType === 'daily') {
        chartData = prepareDailyChartData(activities);
        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Activities by Day'
                }
            }
        };
    }
    
    window.activityChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

function getFilteredActivities(dateRange) {
    const activities = getActivitiesFromStorage();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = formatDateForInput(today);
    
    if (dateRange === 'today') {
        return activities.filter(activity => activity.date === todayStr);
    } else if (dateRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekStartStr = formatDateForInput(weekStart);
        
        return activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= weekStart && activityDate <= today;
        });
    } else if (dateRange === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartStr = formatDateForInput(monthStart);
        
        return activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= monthStart && activityDate <= today;
        });
    } else {
        // All time
        return activities;
    }
}

function prepareCategoryChartData(activities) {
    // Count activities by category
    const categoryCounts = {};
    activities.forEach(activity => {
        if (categoryCounts[activity.category]) {
            categoryCounts[activity.category]++;
        } else {
            categoryCounts[activity.category] = 1;
        }
    });
    
    // Prepare data for chart
    const labels = Object.keys(categoryCounts).map(category => capitalizeFirstLetter(category));
    const data = Object.values(categoryCounts);
    const backgroundColors = Object.keys(categoryCounts).map(category => getCategoryColor(category));
    
    return {
        labels: labels,
        datasets: [{
            label: 'Number of Activities',
            data: data,
            backgroundColor: backgroundColors
        }]
    };
}

function prepareTimeChartData(activities) {
    // Sum duration by category
    const categoryDurations = {};
    activities.forEach(activity => {
        const duration = parseInt(activity.duration || 0, 10);
        if (categoryDurations[activity.category]) {
            categoryDurations[activity.category] += duration;
        } else {
            categoryDurations[activity.category] = duration;
        }
    });
    
    // Prepare data for chart
    const labels = Object.keys(categoryDurations).map(category => capitalizeFirstLetter(category));
    const data = Object.values(categoryDurations);
    const backgroundColors = Object.keys(categoryDurations).map(category => getCategoryColor(category));
    
    return {
        labels: labels,
        datasets: [{
            label: 'Minutes',
            data: data,
            backgroundColor: backgroundColors
        }]
    };
}

function prepareDailyChartData(activities) {
    // Group by date
    const dailyCounts = {};
    activities.forEach(activity => {
        const date = activity.date;
        if (dailyCounts[date]) {
            dailyCounts[date]++;
        } else {
            dailyCounts[date] = 1;
        }
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyCounts).sort();
    
    // Format dates for display
    const labels = sortedDates.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = sortedDates.map(date => dailyCounts[date]);
    
    return {
        labels: labels,
        datasets: [{
            label: 'Number of Activities',
            data: data,
            backgroundColor: 'rgba(74, 111, 165, 0.7)'
        }]
    };
}

// Initialize the app when DOM is loaded
document.getElementById('activity-date').addEventListener('change', function() {
    loadActivities(this.value);
    updateSummary();
});
