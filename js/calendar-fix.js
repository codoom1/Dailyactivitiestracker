// Additional debugging and fixes for calendar issues

// Function to debug calendar click issues
function debugCalendarClick(dateStr) {
    console.log(`Calendar date clicked: ${dateStr}`);
    
    // Parse date parts to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    
    console.log(`Parsed date parts: Year=${year}, Month=${month}, Day=${day}`);
    
    // Create date with timezone safety
    const safeDate = new Date(year, month - 1, day);
    console.log(`Date created safely: ${safeDate.toISOString()}`);
    
    // Check if the date matches what we expect
    const formattedBack = `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}-${String(safeDate.getDate()).padStart(2, '0')}`;
    console.log(`Formatted back to string: ${formattedBack}`);
    
    if (formattedBack !== dateStr) {
        console.error(`Date mismatch detected! Original: ${dateStr}, After parsing: ${formattedBack}`);
    }
}

// Monkey patch the calendar click handler to include debugging
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the calendar to be generated
    setTimeout(() => {
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            if (!day.classList.contains('empty') && day.dataset.date) {
                // Remove old click handlers by cloning the element
                const newDay = day.cloneNode(true);
                day.parentNode.replaceChild(newDay, day);
                
                // Add new click handler with debugging
                newDay.addEventListener('click', () => {
                    const dateStr = newDay.dataset.date;
                    debugCalendarClick(dateStr);
                    // Call the actual modal function after debugging
                    showActivitiesModal(dateStr);
                });
            }
        });
        console.log('Calendar debugging enabled');
    }, 1000);
});
