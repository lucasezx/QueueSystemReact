import QueueSystem from "../src/queueSystem.js";
import express from "express";
import path from "path";
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(process.cwd(), "../build")));

const queueSystem = new QueueSystem("admin");

app.get("/queues/:queueId/tickets", (req, res) => {
  const queueId = req.params.queueId;
  const tickets = queueSystem.showQueue(queueId);
  res.json({ queueId, tickets });
});


app.post("/queues/:queueId/tickets", (req, res) => {
  const { user, isPriority } = req.body;
  const queueId = req.params.queueId;

  try {
    const message = queueSystem.requestTicket(queueId, user, isPriority);
    res.json({ message, queue: queueSystem.showQueue(queueId) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/queues/:queueId/call", (req, res) => {
  const queueId = req.params.queueId;

  try {
    const ticket = queueSystem.callNextTicket(queueId);
    res.json({
      message: `Next ticket for ${queueId} is ${ticket.ticket} for ${ticket.user}`,
      ticket,
      queue: queueSystem.showQueue(queueId)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/queues/clear", (req, res) => {
  queueSystem.emptyQueue();
  res.json({ message: "Queue cleared successfully" });
});

app.get("/queues/average-wait-time", (req, res) => {
  const averages = queueSystem.averageWaitTimeForAll();
  res.json(averages);
});

app.get("/queues/last-called", (req, res) => {
  const lastCalled = queueSystem.showLastCalledTickets();
  res.json(lastCalled);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
