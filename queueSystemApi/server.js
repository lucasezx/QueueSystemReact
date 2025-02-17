import QueueSystem from "../src/queueSystem.js";
import express from "express";
import path from "path";
import cors from "cors";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database");
  }
});

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "../build")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS ticket (
    queue_id INTEGER NOT NULL,
    sequence INTEGER NOT NULL,
    is_priority BOOLEAN,
    name TEXT NOT NULL,
    PRIMARY KEY (queue_id, sequence),
    FOREIGN KEY (queue_id) REFERENCES queue(id)
  );`);
});

const queueSystem = new QueueSystem("admin");

if (!queueSystem.sections) {
  queueSystem.sections = {};
}

app.get("/queues/:queueId/tickets", async (req, res) => {
  const queueId = req.params.queueId;
  db.all("SELECT * FROM ticket WHERE queue_id = ?", [queueId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ queueId, tickets: rows });
  });
});

app.post("/queues/:queueId/tickets", async (req, res) => {
  const { user, isPriority } = req.body;
  const queueId = req.params.queueId;

  try {
    if (!queueSystem.sections[queueId]) {
      queueSystem.sections[queueId] = 1;
    }

    const ticketNumber = queueSystem.sections[queueId]++;
    const newTicket = {
      user: user,
      ticket: ticketNumber,
      section: queueId,
      isPriority: isPriority,
    };

    db.run(
      "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
      [queueId, ticketNumber, isPriority, user],
      function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        db.all(
          "SELECT * FROM ticket WHERE queue_id = ?",
          [queueId],
          (err, rows) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ message: `Ticket requested for ${user}`, queue: rows });
          }
        );
      }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/queues/:queueId/call", async (req, res) => {
  const queueId = req.params.queueId;

  try {
    const ticket = queueSystem.callNextTicket(queueId);
    const { ticket: ticketNumber, user } = ticket;

    db.run(
      "DELETE FROM ticket WHERE queue_id = ? AND sequence = ?",
      [queueId, ticketNumber],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.all(
          "SELECT * FROM ticket WHERE queue_id = ?",
          [queueId],
          (err, rows) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({
              message: `Next ticket for ${queueId} is ${ticketNumber} for ${user}`,
              ticket,
              queue: rows,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/queues/clear", async (req, res) => {
  queueSystem.emptyQueue();
  db.run("DELETE FROM ticket", (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Queue cleared successfully" });
  });
});

app.get("/queues/average-wait-time", (req, res) => {
  const averages = queueSystem.averageWaitTimeForAll();
  res.json(averages);
});

app.post("/populate", async (req, res) => {
  const tickets = [
    { queue_id: 1, sequence: 1, is_priority: true, name: "John Doe" },
    { queue_id: 1, sequence: 2, is_priority: false, name: "Jane Singer" },
    { queue_id: 2, sequence: 1, is_priority: false, name: "Robert Smith" },
    { queue_id: 2, sequence: 2, is_priority: true, name: "Alice Cooper" },
    { queue_id: 3, sequence: 1, is_priority: false, name: "Tommy Lee" },
  ];

  try {
    await Promise.all(
      tickets.map((ticket) => {
        return new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
            [ticket.queue_id, ticket.sequence, ticket.is_priority, ticket.name],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      })
    );

    res.json({ message: "Database populated with initial data" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
