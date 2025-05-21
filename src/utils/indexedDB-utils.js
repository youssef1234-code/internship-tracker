// indexedDB-utils.js - A reusable utility for IndexedDB operations

/**
 * Initialize the database connection
 * @param {string} dbName - Database name
 * @returns {Promise} - Promise resolving to the database object
 */
const initializeDB = (dbName = "StudentProfileDB") => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

/**
 * Generic function to save data to a specified store
 * @param {string} storeName - The name of the object store
 * @param {Object} data - The data to save
 * @param {string} dbName - Database name (optional)
 * @returns {Promise} - Promise resolving to true if successful
 */
const saveToStore = async (storeName, data, dbName = "StudentProfileDB") => {
  const db = await initializeDB(dbName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.put(data);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error(`Error saving to ${storeName}:`, event.target.error);
      reject(`Error saving data to ${storeName}`);
    };
  });
};

/**
 * Generic function to retrieve data from a specified store
 * @param {string} storeName - The name of the object store
 * @param {string|number} key - The key to retrieve
 * @param {string} dbName - Database name (optional)
 * @returns {Promise} - Promise resolving to the retrieved data
 */
const getFromStore = async (storeName, key, dbName = "StudentProfileDB") => {
  const db = await initializeDB(dbName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    const request = store.get(key);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error(`Error retrieving from ${storeName}:`, event.target.error);
      reject(`Error retrieving data from ${storeName}`);
    };
  });
};

/**
 * Generic function to retrieve data from a specified store
 * @param {string} storeName - The name of the object store
 * @param {string} dbName - Database name (optional)
 * @returns {Promise} - Promise resolving to the retrieved data
 */
const getAllFromStore = async (storeName, dbName = "StudentProfileDB") => {
  const db = await initializeDB(dbName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error(`Error retrieving from ${storeName}:`, event.target.error);
      reject(`Error retrieving data from ${storeName}`);
    };
  });
};

const deleteFromStore = async (storeName, key, dbName = "StudentProfileDB") => {
  const db = await initializeDB(dbName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.delete(key);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error(`Error Deleting from ${storeName}:`, event.target.error);
      reject(`Error deleting data from ${storeName}`);
    };
  });
};
// Export all functions
export {
  initializeDB,
  saveToStore,
  getFromStore,
  getAllFromStore,
  deleteFromStore,
};
