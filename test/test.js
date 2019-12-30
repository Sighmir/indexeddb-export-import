const fakeIndexedDB = require("fake-indexeddb");
const Dexie = require("dexie");
const IDBExportImport = require("../index");
const assert = require("assert");

describe("IDBExportImport", () => {
  describe("#exportToObject()", () => {
    it("DB with no object stores should export an empty string", done => {
      const db = new Dexie("NoObjectStoresDB", { indexedDB: fakeIndexedDB });
      db.version(1).stores({}); // nothing
      db.open()
        .then(() => {
          const idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          IDBExportImport.exportToObject(idb_db)
            .then(exportObject => {
              assert.deepEqual(exportObject, {});
              done();
            })
            .catch(err => {
              assert.ifError(err);
            });
        })
        .catch(e => {
          console.error("Could not connect. " + e);
        });
    });

    it("DB with empty object stores should export an empty string", done => {
      const db = new Dexie("EmptyObjectStoresDB", { indexedDB: fakeIndexedDB });
      db.version(1).stores({ things: "id++, thing_name, thing_description" }); // nothing
      db.open()
        .then(() => {
          const idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          IDBExportImport.exportToObject(idb_db)
            .then(exportObject => {
              assert.deepEqual(exportObject, { things: {} });
              done();
            })
            .catch(err => {
              assert.ifError(err);
            });
        })
        .catch(e => {
          console.error("Could not connect. " + e);
        });
    });
  });

  it("Should export, clear, and import the database", done => {
    const db = new Dexie("MyDB", { indexedDB: fakeIndexedDB });
    db.version(1).stores({
      things: "id++, thing_name, thing_description"
    });
    db.open().catch(e => {
      console.error("Could not connect. " + e);
    });

    const thingsToAdd = [
      {
        thing_name: "First thing",
        thing_description: "This is the first thing"
      },
      {
        thing_name: "Second thing",
        thing_description: "This is the second thing"
      }
    ];
    db.things
      .bulkAdd(thingsToAdd)
      .then(lastKey => {
        const idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

        // export to JSON, clear database, and import from JSON
        IDBExportImport.exportToObject(idb_db)
          .then(exportObject => {
            console.log("Exported as JSON: " + JSON.stringify(exportObject));
            assert.deepEqual(exportObject, {
              things: {
                "1": {
                  thing_name: "First thing",
                  thing_description: "This is the first thing",
                  id: 1
                },
                "2": {
                  thing_name: "Second thing",
                  thing_description: "This is the second thing",
                  id: 2
                }
              }
            });

            IDBExportImport.clearDatabase(idb_db).then(err => {
              console.log("Cleared the database");

              IDBExportImport.importFromObject(idb_db, exportObject)
                .then(() => {
                  console.log("Imported data successfully");

                  IDBExportImport.exportToObject(idb_db)
                    .then(exportObject => {
                      console.log(
                        "Exported as JSON: " + JSON.stringify(exportObject)
                      );
                      assert.deepEqual(exportObject, {
                        things: {
                          "1": {
                            thing_name: "First thing",
                            thing_description: "This is the first thing",
                            id: 1
                          },
                          "2": {
                            thing_name: "Second thing",
                            thing_description: "This is the second thing",
                            id: 2
                          }
                        }
                      });

                      done();
                    })
                    .catch(err => {
                      console.error(err);
                      assert.ifError(err);
                    });
                })
                .catch(err => {
                  console.error(err);
                  assert.ifError(err);
                });
            });
          })
          .catch(err => {
            console.error(err);
            assert.ifError(err);
          });
      })
      .catch(Dexie.BulkError, function(err) {
        console.error(err);
        assert.ifError(err);
      });
  });
});
