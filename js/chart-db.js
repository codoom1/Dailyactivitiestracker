// Chart functionality for database implementation
// Async versions of chart functions that work with the IndexedDB

// Helper function to format date for input
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Utility function to capitalize first letter
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get color for category
function getCategoryColor(category) {
    if (!category) return '#808080'; // Default gray for undefined
    
    // Try to get the color from CSS custom property
    const computedStyle = getComputedStyle(document.documentElement);
    const categoryColor = computedStyle.getPropertyValue(`--${category}-color`);
    
    if (categoryColor && categoryColor.trim() !== '') {
        return categoryColor.trim();
    }
    
    // Default colors if not defined in CSS
    const defaultColors = {
        'work': '#4a6fa5',
        'exercise': '#45b7d1',
        'leisure': '#98d0a9',
        'study': '#d4a373',
        'food': '#e76f51',
        'social': '#9d4edd',
        'errands': '#ffbd00',
        'sleep': '#7209b7',
        'health': '#40916c'
    };
    
    return defaultColors[category.toLowerCase()] || '#808080';
}

// Update chart with async data retrieval
async function updateChartFromDB() {
    const chartType = document.getElementById('chart-type').value;
    const dateRange = document.getElementById('date-range').value;
    
    console.log(`Updating chart with type: ${chartType}, date range: ${dateRange}`);
    
    // Get activities filtered by date range - using async function
    const activities = await getFilteredActivitiesFromDB(dateRange);
    console.log(`Retrieved ${activities.length} activities for chart`);
    
    if (activities.length === 0) {
        const ctx = document.getElementById('activity-chart');
        if (ctx) {
            ctx.style.display = 'none';
        }
        return;
    }
    
    const ctx = document.getElementById('activity-chart');
    if (ctx) {
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
}

// Get filtered activities from database based on date range
async function getFilteredActivitiesFromDB(dateRange) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = formatDateForInput(today);
    
    if (dateRange === 'today') {
        // Use the database's index for date
        return await getActivitiesByDate(todayStr);
    } else if (dateRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekStartStr = formatDateForInput(weekStart);
        
        console.log(`Getting activities from ${weekStartStr} to ${todayStr}`);
        // Use database's date range query
        return await getActivitiesByDateRange(weekStartStr, todayStr);
    } else if (dateRange === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartStr = formatDateForInput(monthStart);
        
        console.log(`Getting activities from ${monthStartStr} to ${todayStr}`);
        // Use database's date range query
        return await getActivitiesByDateRange(monthStartStr, todayStr);
    } else {
        // All time
        return await getAllActivities();
    }
}

// Prepare data for category-based chart
function prepareCategoryChartData(activities) {
    console.log("Preparing category chart data with", activities.length, "activities");
    // Count activities by category
    const categoryCounts = {};
    activities.forEach(activity => {
        const category = activity.category || 'uncategorized';
        if (categoryCounts[category]) {
            categoryCounts[category]++;
        } else {
            categoryCounts[category] = 1;
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

// Prepare data for time-based chart
function prepareTimeChartData(activities) {
    console.log("Preparing time chart data with", activities.length, "activities");
    // Sum duration by category
    const categoryDurations = {};
    activities.forEach(activity => {
        const category = activity.category || 'uncategorized';
        const duration = parseInt(activity.duration || 0, 10);
        if (categoryDurations[category]) {
            categoryDurations[category] += duration;
        } else {
            categoryDurations[category] = duration;
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

// Prepare data for daily chart
function prepareDailyChartData(activities) {
    console.log("Preparing daily chart data with", activities.length, "activities");
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
