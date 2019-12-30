isNode = () => {
  return typeof module !== "undefined" && module.exports;
};

const IDBExportImport = {
  /**
   * Clears a database of all data
   *
   * @param {IDBDatabase} idbDatabase - to delete all data from
   */
  clearDatabase: idbDatabase => {
    return new Promise((resolve, reject) => {
      const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        "readwrite"
      );
      transaction.onerror = event => {
        reject(event);
      };
      let count = 0;
      Object.values(idbDatabase.objectStoreNames).forEach(storeName => {
        transaction.objectStore(storeName).clear().onsuccess = () => {
          count++;
          if (count === idbDatabase.objectStoreNames.length)
            // cleared all object stores
            resolve(null);
        };
      });
    });
  },

  /**
   * Export all data from an IndexedDB database
   *
   * @param {IDBDatabase} idbDatabase - to export from
   */
  exportToObject: idbDatabase => {
    return new Promise((resolve, reject) => {
      const exportObject = {};
      if (idbDatabase.objectStoreNames.length === 0) resolve(exportObject);
      else {
        const transaction = idbDatabase.transaction(
          idbDatabase.objectStoreNames,
          "readonly"
        );
        transaction.onerror = event => {
          reject(event);
        };
        Object.values(idbDatabase.objectStoreNames).forEach(storeName => {
          const allObjects = {};
          transaction.objectStore(storeName).openCursor().onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
              allObjects[cursor.key] = cursor.value;
              cursor.continue();
            } else {
              exportObject[storeName] = allObjects;
              if (
                idbDatabase.objectStoreNames.length ===
                Object.keys(exportObject).length
              ) {
                resolve(exportObject);
              }
            }
          };
        });
      }
    });
  },

  /**
   * Import data from Object into an IndexedDB database.
   * This overwrites objects with the same keys.
   *
   * @param {IDBDatabase} idbDatabase - to import into
   * @param {object} importObject - data to import, one key per object store
   */
  importFromObject: (idbDatabase, importObject) => {
    return new Promise((resolve, reject) => {
      const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        "readwrite"
      );
      transaction.onerror = event => {
        reject(event);
      };
      Object.values(idbDatabase.objectStoreNames).forEach(storeName => {
        let count = 0;
        Object.keys(importObject[storeName]).forEach(keyToAdd => {
          const numberKey = Number(keyToAdd);
          const value = importObject[storeName][keyToAdd];
          const params = [value];

          if (!value.id) {
            params.push(isNaN(numberKey) ? keyToAdd : numberKey);
          }

          const request = transaction.objectStore(storeName).put(...params);

          request.onsuccess = event => {
            count++;
            if (count === Object.keys(importObject[storeName]).length) {
              // added all objects for this store
              delete importObject[storeName];
              if (Object.keys(importObject).length === 0)
                // added all object stores
                resolve(null);
            }
          };
        });
      });
    });
  }
};

if (isNode()) {
  module.exports = IDBExportImport;
}
