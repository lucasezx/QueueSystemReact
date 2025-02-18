import QueueSystem from "../src/queueSystem.js";
import express from "express";
import path from "path";
import cors from "cors";
import { createTables, runQuery, allQuery } from "./sql.js";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "../build")));

createTables();

const queueSystem = new QueueSystem("admin");

if (!queueSystem.sections) {
  queueSystem.sections = {};
}

app.get("/queues/:queue_id/tickets", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);
  try {
    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queue_id,
    ]);
    res.json({ queue_id, tickets: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/queues/:queue_id/tickets", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);
  const { name, is_priority } = req.body;

  try {
    if (!queueSystem.sections[queue_id]) {
      queueSystem.sections[queue_id] = 1;
    }

    const ticketNumber = queueSystem.sections[queue_id]++;
    await runQuery(
      "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
      [queue_id, ticketNumber, is_priority, name]
    );

    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queue_id,
    ]);
    res.json({ message: `Ticket requested for ${name}`, queue: rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/queues/:queue_id/tickets/call", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);

  try {
    const ticket = queueSystem.callNextTicket(queue_id);
    const { ticket: ticketNumber, name } = ticket;

    await runQuery("DELETE FROM ticket WHERE queue_id = ? AND sequence = ?", [
      queue_id,
      ticketNumber,
    ]);

    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queue_id,
    ]);
    res.json({
      message: `Next ticket for ${queue_id} is ${ticketNumber} for ${name}`,
      ticket,
      queue: rows,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/queues/clear", async (req, res) => {
  queueSystem.emptyQueue();
  try {
    await runQuery("DELETE FROM ticket");
    res.json({ message: "Queue cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  ];

  try {
    await Promise.all(
      tickets.map((ticket) =>
        runQuery(
          "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
          [ticket.queue_id, ticket.sequence, ticket.is_priority, ticket.name]
        )
      )
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