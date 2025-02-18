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
app.get("/queues/:queueId/tickets", async (req, res) => {
  const queueId = req.params.queueId;
  try {
    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queueId,
    ]);
    res.json({ queueId, tickets: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/queues/:queueId/tickets", async (req, res) => {
  const { user, isPriority } = req.body;
  const queueId = req.params.queueId;

  try {
    if (!queueSystem.sections[queueId]) {
      queueSystem.sections[queueId] = 1;
    }

    const ticketNumber = queueSystem.sections[queueId]++;
    await runQuery(
      "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
      [queueId, ticketNumber, isPriority, user]
    );

    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queueId,
    ]);
    res.json({ message: `Ticket requested for ${user}`, queue: rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/queues/:queueId/call", async (req, res) => {
  const queueId = req.params.queueId;

  try {
    const ticket = queueSystem.callNextTicket(queueId);
    const { ticket: ticketNumber, user } = ticket;

    await runQuery("DELETE FROM ticket WHERE queue_id = ? AND sequence = ?", [
      queueId,
      ticketNumber,
    ]);

    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queueId,
    ]);
    res.json({
      message: `Next ticket for ${queueId} is ${ticketNumber} for ${user}`,
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