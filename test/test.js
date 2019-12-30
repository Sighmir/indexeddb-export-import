const fakeIndexedDB = require("fake-indexeddb");
const Dexie = require("dexie");
const IDBExportImport = require("../index");
const assert = require("assert");

describe("IDBExportImport", () => {
  describe("#exportToJsonString()", () => {
    it("DB with no object stores should export an empty string", done => {
      const db = new Dexie("NoObjectStoresDB", { indexedDB: fakeIndexedDB });
      db.version(1).stores({}); // nothing
      db.open()
        .then(() => {
          const idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          IDBExportImport.exportToJsonString(idb_db)
            .then(jsonString => {
              assert.equal(jsonString, "{}");
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
          IDBExportImport.exportToJsonString(idb_db)
            .then(jsonString => {
              assert.equal(jsonString, '{"things":[]}');
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
        IDBExportImport.exportToJsonString(idb_db)
          .then(jsonString => {
            console.log("Exported as JSON: " + jsonString);
            assert.equal(
              jsonString,
              '{"things":[' +
                '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
                '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}'
            );

            IDBExportImport.clearDatabase(idb_db).then(err => {
              console.log("Cleared the database");

              IDBExportImport.importFromJsonString(idb_db, jsonString)
                .then(() => {
                  console.log("Imported data successfully");

                  IDBExportImport.exportToJsonString(idb_db)
                    .then(jsonString => {
                      console.log("Exported as JSON: " + jsonString);
                      assert.equal(
                        jsonString,
                        '{"things":[' +
                          '{"thing_name":"First thing","thing_description":"This is the first thing","id":1}' +
                          ',{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}'
                      );

                      done();
                    })
                    .catch(err => {
                      assert.ifError(err);
                    });
                })
                .catch(err => {
                  assert.ifError(err);
                });
            });
          })
          .catch(err => {
            assert.ifError(err);
          });
      })
      .catch(Dexie.BulkError, function(e) {
        assert.ifError(e);
      });
  });
});
