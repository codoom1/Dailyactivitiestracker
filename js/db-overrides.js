// Database-only modifications for script.js functions

// Override the original updateSummary function to work with async data
async function updateSummaryAsync() {
    // Get current selected date
    const selectedDate = document.getElementById('activity-date').value;
    
    const activities = await getActivitiesByDate(selectedDate);
    
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

// Override the original updateCalendarIndicators function to work with async
async function updateCalendarIndicatorsAsync() {
    const activities = await getAllActivities();
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

// Override to show activities in modal
async function showActivitiesModal(dateStr) {
    console.log(`Getting activities for date: ${dateStr}`);
    const activities = await getActivitiesByDate(dateStr);
    console.log(`Found ${activities.length} activities`);
    
    const modal = document.getElementById('activity-modal');
    const modalDate = document.getElementById('modal-date');
    const modalActivities = document.getElementById('modal-activities');
    
    // Parse date parts to ensure no timezone issues
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    // Create date object with explicit parts (subtract 1 from month since JS months are 0-indexed)
    const dateObj = new Date(year, month - 1, day);
    
    // Format date for display
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    modalDate.textContent = formattedDate;
    modalActivities.innerHTML = '';
    
    if (activities.length === 0) {
        modalActivities.innerHTML = '<p class="empty-message">No activities for this date</p>';
    } else {
        // Sort by time
        activities.sort((a, b) => a.time.localeCompare(b.time));
        
        activities.forEach(activity => {
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

// Override delete activity to work with the database
async function deleteActivityDB(id) {
    // Delete from database
    await deleteActivity(id);
    
    // Clear the timeline container and reload activities
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '<p class="empty-message" id="empty-timeline">No activities added yet</p>';
    
    // Get current selected date
    const currentDate = document.getElementById('activity-date').value;
    
    // Update UI
    await dataChangedAsync();
    updateDatabaseStatus("Activity deleted");
}

// Set up modal event handlers (called once during initialization)
function setupModalHandlers() {
    const modal = document.getElementById('activity-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Remove any existing event listeners
    const newCloseBtn = closeModal.cloneNode(true);
    closeModal.parentNode.replaceChild(newCloseBtn, closeModal);
    
    // Add click event to close button
    newCloseBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        modal.style.display = 'none';
    });
    
    // Add click event to close when clicking outside
    const closeOutside = (e) => {
        if (e.target === modal) {
            console.log('Clicked outside modal');
            modal.style.display = 'none';
        }
    };
    
    // Remove any existing event listener
    window.removeEventListener('click', closeOutside);
    // Add new event listener
    window.addEventListener('click', closeOutside);
}
