# indexeddb-export-import - JSON export/import for IndexedDB

During development and testing it may be useful to be able to save and load the contents of an IndexedDB database.

This project is a fork of [Polarisation/indexeddb-export-import](https://github.com/Polarisation/indexeddb-export-import).  
He wrote this as a Node.js module for use with a desktop [Electron](https://electron.atom.io/) app - which has access to both the IndexedDB API and Node.js.

It had minimal dependencies so it was easy to reuse the functions in a browser environment where Node.js is not available.  
I removed the dependencies and made it support browser and Node.js without needing any modifications, I also decided to use Objects instead of JSON Strings for the functions to allow typed variables.

[![NPM](https://nodei.co/npm/@sighmir/indexeddb-export-import.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/@sighmir/indexeddb-export-import/)

## Usage

You will need an open [IDBDatabase](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) connection.

The follwing example exports a database, clears all object stores, then re-imports the database. It uses [Dexie.js](https://github.com/dfahlander/Dexie.js) to initiate the database, but this is not required.

Node.js:

```js
const Dexie = require("Dexie");
const IDBExportImport = require("@sighmir/indexeddb-export-import");

const db = new Dexie("MyDB");
db.version(1).stores({
  things: "id++, thing_name, thing_description"
});
db.open()
  .then(async () => {
    try {
      const idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

      // export to JSON, clear database, and import from JSON
      const jsonObject = await IDBExportImport.exportToObject(idb_db);
      console.log("Exported as JSON: " + JSON.stringify(jsonObject));

      await IDBExportImport.clearDatabase(idb_db);

      await IDBExportImport.importFromObject(idb_db, jsonObject);
      console.log("Imported data successfully");
    } catch (err) {
      console.error(err);
    }
  })
  .catch(e => {
    console.error("Could not connect. " + e);
  });
```

Browser:

```js
const request = indexedDB.open("MyDB");

request.onerror = event => {
  console.log("Failed to connect to IndexedDB!");
};

request.onsuccess = async event => {
  const idb_db = event.target.result;
  try {
    // export to JSON, clear database, and import from JSON
    const jsonObject = await IDBExportImport.exportToObject(idb_db);

    console.log("Exported as JSON: " + JSON.stringify(jsonObject));
    await IDBExportImport.clearDatabase(idb_db);

    await IDBExportImport.importFromObject(idb_db, jsonObject);
    console.log("Imported data successfully");
  } catch (err) {
    console.error(err);
  }
};
```

## API

### async exportToObject(idb_db)

Export all data from an IndexedDB database.

| Param  | Type                     | Description |
| ------ | ------------------------ | ----------- |
| idb_db | <code>IDBDatabase</code> |             |

<a name="importFromObject"></a>

### async importFromObject(idb_db, importObject)

Import data from Object into an IndexedDB database. This overwrites objects with the same keys.

| Param        | Type                     | Description                              |
| ------------ | ------------------------ | ---------------------------------------- |
| idb_db       | <code>IDBDatabase</code> |                                          |
| importObject | <code>object</code>      | data to import, one key per object store |

<a name="clearDatabase"></a>

### async clearDatabase(idb_db)

Clears a database of all data.

| Param  | Type                     | Description |
| ------ | ------------------------ | ----------- |
| idb_db | <code>IDBDatabase</code> |             |

## Installation

Node.js:

```
$ npm install @sighmir/indexeddb-export-import
```

Browser:

```html
<script src="https://cdn.jsdelivr.net/npm/@sighmir/indexeddb-export-import/index.js"></script>
```

## License

MIT
