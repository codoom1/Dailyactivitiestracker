# Daily Activity Tracker

A modern, offline-capable web application to track and visualize your daily activities and time management.

## Features

- 📝 Add activities with timestamps and durations
- 🏷️ Categorize activities with auto-colored labels (Work, Personal, Health, etc.)
- ⚡ Instant data persistence with IndexedDB
- 📊 Multiple chart types for data visualization
- 📅 Interactive calendar view with activity indicators
- 📈 Daily summary statistics by category
- 📱 Responsive design for desktop and mobile
- 💾 Backup and restore functionality
- 🎨 Custom categories with automatic color assignment
- 🔄 Real-time updates across all views

## Quick Start Guide

1. Access the Application:
   - Open `index.html` in a modern web browser
   - No installation required - works completely offline
   - Supports Chrome, Firefox, Safari, and Edge

2. Add Your First Activity:
   - Click the "Add Activity" form at the top
   - Select or enter the date (defaults to today)
   - Enter the start time
   - Specify duration in minutes
   - Type activity name
   - Choose a category
   - Click "Add" to save

3. View Your Activities:
   - Timeline View: See activities chronologically
   - Calendar View: Click dates to see daily activities
   - Summary View: See time spent per category
   - Charts: Analyze your time usage patterns

4. Using the Calendar:
   - Navigate months with arrow buttons
   - Colored dots indicate activities on specific dates
   - Click any date to see detailed activities
   - Today's date is highlighted
   
5. Working with Charts:
   - Select chart type: Category, Time, or Daily
   - Choose date range: Today, Week, Month, or All Time
   - Charts update automatically when you add/edit activities

6. Data Management:
   - All data is automatically saved to your browser
   - Export Backup: Click "Export Backup" for a JSON file
   - Import Backup: Use "Import Backup" to restore data
   - Recommended: Create periodic backups

## Advanced Features

### Custom Categories
1. Click "Add Category" button
2. Enter category name
3. Color is automatically assigned
4. New category appears in activity form dropdown
5. Use in charts and visualizations

### Data Visualization
- Category Distribution: See activity breakdown by category
- Time Analysis: View time spent on different activities
- Daily Patterns: Track activity frequency by day
- Interactive: Hover for detailed information
- Responsive: Charts adapt to screen size

### Calendar Features
- Month Navigation: Browse past and future months
- Activity Indicators: Colored dots show category presence
- Quick View: Click date for detailed activity list
- Today Highlight: Current date is clearly marked
- Multi-category: Shows all activity types per day

## Data Management

### Automatic Storage (IndexedDB)
- Instant saving of all changes
- Large storage capacity (50MB-1GB)
- Works offline
- No manual saving needed
- Data persists between sessions

### Backup & Restore
1. Creating a Backup:
   - Click "Export Backup" button
   - Choose save location
   - JSON file is downloaded
   
2. Restoring Data:
   - Click "Import Backup"
   - Select your backup file
   - Data is restored instantly
   
3. Best Practices:
   - Create weekly backups
   - Store backups in cloud storage
   - Keep multiple backup files
   - Test restore occasionally

## Technical Details

### Browser Support
- Chrome 83+
- Firefox 79+
- Safari 14+
- Edge 83+
- Requires IndexedDB support

### Technologies
- HTML5 for structure
- CSS3 for styling
- Vanilla JavaScript (ES6+)
- IndexedDB for storage
- Chart.js for visualizations

### Performance
- Optimized for large datasets
- Async/await for smooth operation
- Efficient data indexing
- Minimal dependencies
- Fast load times

## Deployment

### GitHub Pages Deployment
1. Create a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-repository-url
   git push -u origin main
   ```

2. Enable GitHub Pages:
   - Go to your repository's Settings
   - Scroll to "GitHub Pages" section
   - Select "main" branch as source
   - Click Save

3. Access your app:
   - Your app will be available at `https://yourusername.github.io/repository-name`
   - Wait a few minutes for deployment to complete
   
Note: The application works entirely client-side, so it's perfectly suited for GitHub Pages hosting. All data is stored in your browser's IndexedDB, so no server is required.

### Local Development
You can also run the app locally:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```
Then open `http://localhost:8000` in your browser.

## Tips & Tricks

1. Efficient Data Entry:
   - Use tab key to navigate form fields
   - Start typing category to filter dropdown
   - Click calendar to quickly change dates

2. Data Analysis:
   - Use different chart types for different insights
   - Export data regularly for external analysis
   - Compare patterns across weeks/months

3. Productivity:
   - Track regular activities for time patterns
   - Use categories consistently
   - Review summaries weekly for insights

## Troubleshooting

### Common Issues
1. Data not showing up:
   - Check if correct date is selected
   - Refresh the page
   - Verify data in backup file

2. Chart not updating:
   - Switch between chart types
   - Change date range
   - Refresh the page

3. Import/Export issues:
   - Check file format (must be .json)
   - Verify file isn't corrupted
   - Try a different backup file

### Data Recovery
1. If data appears missing:
   - Check different date ranges
   - Import latest backup
   - Clear browser cache and reload

### Getting Help
- Check browser console for errors
- Review documentation
- Ensure browser is up to date
- Clear browser data if needed

## Privacy & Security

- All data stored locally
- No internet connection required
- No data sent to servers
- Regular backups recommended
- Clear browser data to remove all data

## License

This project is open source and available for personal use.
