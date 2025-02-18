import sqlite3 from "sqlite3";
import { promisify } from "util";

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database");
  }
});

export const createTables = () => {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL
      );`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS ticket (
        queue_id INTEGER NOT NULL,
        sequence INTEGER NOT NULL,
        is_priority BOOLEAN,
        name TEXT NOT NULL,
        FOREIGN KEY (queue_id) REFERENCES queue(id),
        PRIMARY KEY (queue_id, sequence)
      );`
    );
  });
};

export const runQuery = promisify(db.run.bind(db));
export const allQuery = promisify(db.all.bind(db));

export default db;