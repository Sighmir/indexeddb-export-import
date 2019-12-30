isNode = () => {
  return typeof module !== "undefined" && module.exports;
};

/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 */
function exportToJsonString(idbDatabase) {
  return new Promise((resolve, reject) => {
    const exportObject = {};
    if (idbDatabase.objectStoreNames.length === 0)
      resolve(JSON.stringify(exportObject));
    else {
      const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        "readonly"
      );
      transaction.onerror = event => {
        reject(event);
      };
      _.forEach(idbDatabase.objectStoreNames, storeName => {
        const allObjects = [];
        transaction.objectStore(storeName).openCursor().onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            allObjects.push(cursor.value);
            cursor.continue();
          } else {
            exportObject[storeName] = allObjects;
            if (
              idbDatabase.objectStoreNames.length ===
              _.keys(exportObject).length
            ) {
              resolve(JSON.stringify(exportObject));
            }
          }
        };
      });
    }
  });
}

/**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 */
function importFromJsonString(idbDatabase, jsonString) {
  return new Promise((resolve, reject) => {
    const transaction = idbDatabase.transaction(
      idbDatabase.objectStoreNames,
      "readwrite"
    );
    transaction.onerror = event => {
      reject(event);
    };
    const importObject = JSON.parse(jsonString);
    _.forEach(idbDatabase.objectStoreNames, storeName => {
      const count = 0;
      _.forEach(importObject[storeName], toAdd => {
        const request = transaction.objectStore(storeName).add(toAdd);
        request.onsuccess = event => {
          count++;
          if (count === importObject[storeName].length) {
            // added all objects for this store
            delete importObject[storeName];
            if (_.keys(importObject).length === 0)
              // added all object stores
              resolve(null);
          }
        };
      });
    });
  });
}

/**
 * Clears a database of all data
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 */
function clearDatabase(idbDatabase) {
  return new Promise((resolve, reject) => {
    const transaction = idbDatabase.transaction(
      idbDatabase.objectStoreNames,
      "readwrite"
    );
    transaction.onerror = function(event) {
      reject(event);
    };
    const count = 0;
    _.forEach(idbDatabase.objectStoreNames, function(storeName) {
      transaction.objectStore(storeName).clear().onsuccess = function() {
        count++;
        if (count === idbDatabase.objectStoreNames.length)
          // cleared all object stores
          resolve(null);
      };
    });
  });
}

if (isNode()) {
  _ = {
    forEach: require("lodash.foreach"),
    keys: require("lodash.keys")
  };

  module.exports = {
    clearDatabase: clearDatabase,
    exportToJsonString: exportToJsonString,
    importFromJsonString: importFromJsonString
  };
}
