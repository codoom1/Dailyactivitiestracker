// Debug helper functions

// Test database query and visualization
async function testDatabaseAndChart() {
    try {
        console.log("=== DB DIAGNOSTIC TEST ===");
        
        // Test database connection
        console.log("- Testing database connection");
        if (!db) {
            console.error("Database not initialized!");
            return;
        }
        console.log("Database connection OK");
        
        // Test getting all activities
        console.log("- Testing getAllActivities");
        const allActivities = await getAllActivities();
        console.log(`Found ${allActivities.length} total activities`);
        
        // Test today's activities
        const today = new Date();
        const todayStr = formatDateForInput(today);
        console.log(`- Testing today's (${todayStr}) activities`);
        const todayActivities = await getActivitiesByDate(todayStr);
        console.log(`Found ${todayActivities.length} activities for today`);
        
        // Test this week's activities
        console.log("- Testing this week's activities");
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = formatDateForInput(weekStart);
        const weekActivities = await getActivitiesByDateRange(weekStartStr, todayStr);
        console.log(`Found ${weekActivities.length} activities from ${weekStartStr} to ${todayStr}`);
        
        // Test chart rendering
        console.log("- Testing chart rendering");
        await updateChartFromDB();
        console.log("Chart rendering complete");
        
        console.log("=== DIAGNOSTICS COMPLETE ===");
    } catch (error) {
        console.error("Diagnostic test failed:", error);
    }
}

// Function to add a sample activity for today
async function addSampleActivity() {
    try {
        const today = new Date();
        const categories = ['work', 'exercise', 'leisure', 'study', 'food'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Create a sample activity for today
        const activity = {
            id: Date.now().toString(),
            date: formatDateForInput(today),
            time: '12:00',
            duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
            name: `Sample ${randomCategory} activity`,
            category: randomCategory
        };
        
        // Save to database
        await saveActivity(activity);
        console.log(`Added sample ${randomCategory} activity`);
        
        // Update UI
        await dataChangedAsync();
        updateDatabaseStatus("Sample activity added");
        
        // Test chart
        await updateChartFromDB();
    } catch (error) {
        console.error("Error adding sample activity:", error);
    }
}

// Add debug buttons to the UI
function addDebugControls() {
    const container = document.createElement('div');
    container.className = 'debug-controls';
    container.style.padding = '10px';
    container.style.margin = '10px 0';
    container.style.border = '1px dashed #ff0000';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Debug Controls';
    container.appendChild(heading);
    
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Database & Chart';
    testButton.className = 'btn-primary';
    testButton.style.marginRight = '10px';
    testButton.addEventListener('click', testDatabaseAndChart);
    container.appendChild(testButton);
    
    const sampleButton = document.createElement('button');
    sampleButton.textContent = 'Add Sample Activity';
    sampleButton.className = 'btn-primary';
    sampleButton.addEventListener('click', addSampleActivity);
    container.appendChild(sampleButton);
    
    // Add to page after the header
    const header = document.querySelector('header');
    if (header && header.nextElementSibling) {
        header.parentElement.insertBefore(container, header.nextElementSibling);
    }
}

// Call this after page load
document.addEventListener('DOMContentLoaded', () => {
    // Add debug controls after a short delay
    setTimeout(addDebugControls, 1000);
});
