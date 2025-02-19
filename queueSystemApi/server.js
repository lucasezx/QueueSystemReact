import QueueSystem from "../src/queueSystem.js";
import express from "express";
import path from "path";
import cors from "cors";
import { createTables, runQuery, allQuery } from "./sql.js";
import { create } from "domain";

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

app.get("/queues", async (req, res) => {
  try {
    const rows = await allQuery("SELECT * FROM queue");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/queues/:queue_id/tickets", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);
  try {
    const rows = await allQuery(
      "SELECT * FROM ticket WHERE queue_id = ? AND called_at IS NULL ORDER BY sequence ASC",
      [queue_id]
    ); 
    res.json({ queue_id, tickets: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const queue_mapping = {
  1: "Bakery",
  2: "Butcher",
  3: "Deli",
  4: "Fishmonger",
  5: "Checkout",
};

app.post("/queues/:queue_id/tickets/call", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);
  const { name, is_priority } = req.body;

  try {
    if (!queueSystem.sections[queue_id]) {
      const result = await allQuery(
        "SELECT MAX(sequence) as maxSeq FROM ticket WHERE queue_id = ?",
        [queue_id]
      );
      const maxSeq = result[0].maxSeq;
      queueSystem.sections[queue_id] = maxSeq ? maxSeq + 1 : 1;
    }

    const ticketNumber = queueSystem.sections[queue_id]++;
    const createdAt = new Date().toISOString();

    await runQuery(
      "INSERT INTO ticket (queue_id, sequence, is_priority, name, created_at) VALUES (?, ?, ?, ?, ?)",
      [queue_id, ticketNumber, is_priority, name, createdAt]
    );

    const newTicket = {
      queue_id,
      sequence: ticketNumber,
      is_priority,
      name,
      created_at: createdAt,
      section: queue_mapping[queue_id],
    };

    queueSystem.queue.push(newTicket);

    const rows = await allQuery("SELECT * FROM ticket WHERE queue_id = ?", [
      queue_id,
    ]);
    res.json({ message: `Ticket requested for ${name}`, queue: rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



app.post("/queues/:queue_id/tickets/next", async (req, res) => {
  const queue_id = parseInt(req.params.queue_id, 10);
  try {
    const rows = await allQuery(
      "SELECT * FROM ticket WHERE queue_id = ? AND called_at IS NULL ORDER BY is_priority DESC, sequence ASC LIMIT 1",
      [queue_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No tickets available" });
    }

    const now = new Date().toISOString();
    const nextTicket = rows[0];

    await runQuery(
      "UPDATE ticket SET called_at = ? WHERE queue_id = ? AND sequence = ?",
      [now, queue_id, nextTicket.sequence]
    );

    const index = queueSystem.queue.findIndex(
      (ticket) =>
        ticket.queue_id === queue_id && ticket.sequence === nextTicket.sequence
    );
    if (index !== -1) {
      const ticketInMemory = queueSystem.queue.splice(index, 1)[0];
      ticketInMemory.called_at = now;
      queueSystem.history.push(ticketInMemory);
    }

    res.json({
      message: `Ticket chamado para ${nextTicket.name}`,
      ticket: { ...nextTicket, called_at: now },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.get("/queues/average-wait-time", async (req, res) => {
  try {
    const averages = queueSystem.averageWaitTimeForAll();
    res.json(averages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/populate", async (req, res) => {
  const tickets = [
    { queue_id: 1, sequence: 1, is_priority: true, name: "John Doe" },
    { queue_id: 1, sequence: 2, is_priority: false, name: "Jane Singer" },
    { queue_id: 2, sequence: 1, is_priority: false, name: "Robert Smith" },
  ];

  const queues = [
    { id: 1, title: "Bakery" },
    { id: 2, title: "Butcher" },
    { id: 3, title: "Deli" },
    { id: 4, title: "Fishmonger" },
    { id: 5, title: "Checkout" },
  ];

  try {
    await runQuery("DELETE FROM ticket");
    await runQuery("DELETE FROM queue");

    for (const queue of queues) {
      await runQuery("INSERT INTO queue (id, title) VALUES (?, ?)", [
        queue.id,
        queue.title,
      ]);
    }

    for (const ticket of tickets) {
      await runQuery(
        "INSERT INTO ticket (queue_id, sequence, is_priority, name) VALUES (?, ?, ?, ?)",
        [ticket.queue_id, ticket.sequence, ticket.is_priority, ticket.name]
      );
    }

    res.json({ message: "Database populated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
