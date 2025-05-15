// IndexedDB Storage for Daily Activity Tracker
// Database implementation for reliable local storage

// Database configuration
const DB_CONFIG = {
    name: 'dailyTrackerDB',
    version: 1,
    stores: {
        activities: { keyPath: 'id', indexes: ['date', 'category'] },
        categories: { keyPath: 'name' },
        settings: { keyPath: 'key' }
    }
};

// Database instance
let db = null;

// Initialize the database
function initDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.error("Your browser doesn't support IndexedDB.");
            // Fall back to file-based storage
            resolve(false);
            return;
        }

        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject(event.target.error);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores (tables)
            if (!db.objectStoreNames.contains('activities')) {
                const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
                activitiesStore.createIndex('date', 'date', { unique: false });
                activitiesStore.createIndex('category', 'category', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('categories')) {
                const categoriesStore = db.createObjectStore('categories', { keyPath: 'name' });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Database initialized successfully");
            
            // Migrate data from localStorage if needed
            migrateFromLocalStorage()
                .then(() => {
                    updateDatabaseStatus("Connected to database");
                    resolve(true);
                })
                .catch(error => {
                    console.error("Migration error:", error);
                    resolve(true); // Still consider DB init successful
                });
        };
    });
}

// Update database status indicator in UI
function updateDatabaseStatus(message) {
    const indicator = document.getElementById('db-status');
    if (indicator) {
        indicator.textContent = message;
        indicator.style.display = 'inline';
        
        // Hide the message after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.style.display = 'none';
                indicator.style.opacity = '1';
            }, 500);
        }, 3000);
    }
}

// Migrate existing data from localStorage to IndexedDB
async function migrateFromLocalStorage() {
    if (!db) return;
    
    // Check if we've already migrated
    const migrated = await getSetting('migratedFromLocalStorage');
    if (migrated) return;
    
    // Get data from localStorage
    const activitiesJson = localStorage.getItem('dailyActivities');
    const categoriesJson = localStorage.getItem('customCategories');
    
    // Activities
    if (activitiesJson) {
        const activities = JSON.parse(activitiesJson);
        if (activities && activities.length) {
            // Save all activities to DB
            for (const activity of activities) {
                await saveActivity(activity);
            }
            console.log(`Migrated ${activities.length} activities from localStorage`);
        }
    }
    
    // Categories
    if (categoriesJson) {
        const categories = JSON.parse(categoriesJson);
        if (categories && categories.length) {
            for (const categoryName of categories) {
                await saveCategory({ name: categoryName, color: getCategoryColor(categoryName) });
            }
            console.log(`Migrated ${categories.length} categories from localStorage`);
        }
    }
    
    // Mark as migrated
    await saveSetting('migratedFromLocalStorage', true);
    console.log("Migration from localStorage completed");
}

// Get all activities
function getAllActivities() {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage if database isn't available
            const activitiesJson = localStorage.getItem('dailyActivities');
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            resolve(activities);
            return;
        }

        const transaction = db.transaction(['activities'], 'readonly');
        const store = transaction.objectStore('activities');
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Error getting activities:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Get activities by date
function getActivitiesByDate(date) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage if database isn't available
            const activitiesJson = localStorage.getItem('dailyActivities');
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            const filtered = activities.filter(activity => activity.date === date);
            resolve(filtered);
            return;
        }

        const transaction = db.transaction(['activities'], 'readonly');
        const store = transaction.objectStore('activities');
        const dateIndex = store.index('date');
        const request = dateIndex.getAll(date);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Error getting activities by date:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Get activities by date range
function getActivitiesByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const activitiesJson = localStorage.getItem('dailyActivities');
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            const filtered = activities.filter(activity => {
                return activity.date >= startDate && activity.date <= endDate;
            });
            resolve(filtered);
            return;
        }

        const transaction = db.transaction(['activities'], 'readonly');
        const store = transaction.objectStore('activities');
        const dateIndex = store.index('date');
        
        // We need to use a key range for the index
        const range = IDBKeyRange.bound(startDate, endDate);
        const request = dateIndex.getAll(range);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Error getting activities by date range:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Save an activity
function saveActivity(activity) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const activitiesJson = localStorage.getItem('dailyActivities');
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            
            // Check if activity already exists
            const existingIndex = activities.findIndex(a => a.id === activity.id);
            if (existingIndex >= 0) {
                activities[existingIndex] = activity;
            } else {
                activities.push(activity);
            }
            
            localStorage.setItem('dailyActivities', JSON.stringify(activities));
            resolve(activity);
            return;
        }

        const transaction = db.transaction(['activities'], 'readwrite');
        const store = transaction.objectStore('activities');
        const request = store.put(activity);

        request.onsuccess = () => {
            resolve(activity);
        };

        request.onerror = (event) => {
            console.error("Error saving activity:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Delete an activity
function deleteActivity(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const activitiesJson = localStorage.getItem('dailyActivities');
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            const filtered = activities.filter(activity => activity.id !== id);
            localStorage.setItem('dailyActivities', JSON.stringify(filtered));
            resolve(true);
            return;
        }

        const transaction = db.transaction(['activities'], 'readwrite');
        const store = transaction.objectStore('activities');
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = (event) => {
            console.error("Error deleting activity:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Get all categories
function getAllCategories() {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const categoriesJson = localStorage.getItem('customCategories');
            const categories = categoriesJson ? JSON.parse(categoriesJson) : [];
            resolve(categories);
            return;
        }

        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => {
            // Transform from objects with name property to just array of names
            // to maintain compatibility with existing code
            const categoryObjects = request.result;
            const categoryNames = categoryObjects.map(cat => cat.name);
            resolve(categoryNames);
        };

        request.onerror = (event) => {
            console.error("Error getting categories:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Save a category
function saveCategory(category) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const categoriesJson = localStorage.getItem('customCategories');
            const categories = categoriesJson ? JSON.parse(categoriesJson) : [];
            
            if (!categories.includes(category.name)) {
                categories.push(category.name);
                localStorage.setItem('customCategories', JSON.stringify(categories));
            }
            
            resolve(category);
            return;
        }

        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.put(category);

        request.onsuccess = () => {
            resolve(category);
        };

        request.onerror = (event) => {
            console.error("Error saving category:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Save a setting
function saveSetting(key, value) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            localStorage.setItem(key, JSON.stringify(value));
            resolve({ key, value });
            return;
        }

        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const setting = { key, value };
        const request = store.put(setting);

        request.onsuccess = () => {
            resolve(setting);
        };

        request.onerror = (event) => {
            console.error(`Error saving setting ${key}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Get a setting
function getSetting(key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Fall back to localStorage
            const value = localStorage.getItem(key);
            resolve(value ? JSON.parse(value) : null);
            return;
        }

        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => {
            const setting = request.result;
            resolve(setting ? setting.value : null);
        };

        request.onerror = (event) => {
            console.error(`Error getting setting ${key}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Export all data from the database
async function exportDatabaseData() {
    try {
        const activities = await getAllActivities();
        const customCategories = await getAllCategories();
        const autoSave = await getSetting('autoSave') || false;
        
        const data = {
            activities,
            customCategories,
            settings: {
                autoSave
            },
            version: DB_CONFIG.version,
            exportDate: new Date().toISOString()
        };
        
        return data;
    } catch (error) {
        console.error("Error exporting database data:", error);
        throw error;
    }
}

// Import data into the database
async function importDatabaseData(data) {
    try {
        if (!data || !data.activities || !Array.isArray(data.activities)) {
            throw new Error("Invalid data format");
        }
        
        // Clear existing data
        await clearDatabase();
        
        // Import activities
        for (const activity of data.activities) {
            await saveActivity(activity);
        }
        
        // Import categories
        if (data.customCategories && Array.isArray(data.customCategories)) {
            for (const categoryName of data.customCategories) {
                await saveCategory({ 
                    name: categoryName, 
                    color: getCategoryColor(categoryName)
                });
            }
        }
        
        // Import settings
        if (data.settings) {
            if (data.settings.autoSave !== undefined) {
                await saveSetting('autoSave', data.settings.autoSave);
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error importing database data:", error);
        throw error;
    }
}

// Clear all data in the database
function clearDatabase() {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Clear localStorage
            localStorage.removeItem('dailyActivities');
            localStorage.removeItem('customCategories');
            resolve(true);
            return;
        }

        const stores = ['activities', 'categories', 'settings'];
        let completed = 0;
        let hasError = false;
        
        for (const storeName of stores) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                completed++;
                if (completed === stores.length && !hasError) {
                    resolve(true);
                }
            };
            
            request.onerror = (event) => {
                if (!hasError) {
                    console.error(`Error clearing ${storeName}:`, event.target.error);
                    reject(event.target.error);
                    hasError = true;
                }
            };
        }
    });
}

// Check if IndexedDB is supported
function isDatabaseSupported() {
    return !!window.indexedDB;
}

// Replace the original getActivitiesFromStorage function
async function getActivitiesFromDatabase() {
    try {
        return await getAllActivities();
    } catch (error) {
        console.error("Error in getActivitiesFromDatabase:", error);
        // Fall back to localStorage
        const activitiesJson = localStorage.getItem('dailyActivities');
        return activitiesJson ? JSON.parse(activitiesJson) : [];
    }
}

// Replace the original getCustomCategoriesFromStorage function
async function getCategoriesFromDatabase() {
    try {
        return await getAllCategories();
    } catch (error) {
        console.error("Error in getCategoriesFromDatabase:", error);
        // Fall back to localStorage
        const categoriesJson = localStorage.getItem('customCategories');
        return categoriesJson ? JSON.parse(categoriesJson) : [];
    }
}
