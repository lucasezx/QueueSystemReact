import React, { useState, useEffect } from "react";
import { QueueSystem, SECTION_NAMES } from "./queueSystem.js";
import "./index.css";

function saveQueue(queue) {
  if (!queue) return;
  const dataToSave = {
    user: queue.user,
    queue: queue.queue.filter(
      (item) => item.user && item.ticket && item.section
    ),
    tickets: queue.tickets,
    history: queue.history.filter((item) => item.user && item.ticket),
    sections: SECTION_NAMES.reduce((acc, section) => {
      acc[section] = queue.sections[section] || 1;
      return acc;
    }, {}),
    lastCalledTickets: queue.showLastCalledTickets(),
  };

  localStorage.setItem("queueData", JSON.stringify(dataToSave));
}

function loadQueue() {
  const data = localStorage.getItem("queueData");
  const queueSystem = QueueSystem.loadQueue(data);

  if (data) {
    const parsedData = JSON.parse(data);
    queueSystem.lastCalledTickets = parsedData.lastCalledTickets || [];
  }

  return queueSystem;
}

function App() {
  const [queueSystem] = useState(() => loadQueue());
  const [user, setUser] = useState(queueSystem.user || "");
  const [section, setSection] = useState(SECTION_NAMES[0]);
  const [queue, setQueue] = useState(queueSystem.queue);
  const [calledTickets, setCalledTickets] = useState(
    queueSystem.lastCalledTickets || []
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      queueSystem.user = user;
      saveQueue(queueSystem);
    }
  }, [user, queueSystem]);

  const requestTicket = (isPriority = false) => {
    if (!user) {
      setMessage("User name is required to request a ticket");
      return;
    }

    queueSystem.user = user;
    const message = queueSystem.requestTicket(section, isPriority);
    setQueue([...queueSystem.queue]);
    setMessage(message);

    saveQueue(queueSystem);
  };

  const callNextTicket = () => {
    try {
      const message = queueSystem.callNextTicket(section);
      setQueue([...queueSystem.queue]);
      const calledTickets = queueSystem.showLastCalledTickets();
      setCalledTickets(calledTickets);
      setMessage(message);

      setTimeout(() => {

      saveQueue(queueSystem);
    }, 0);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const emptyQueue = () => {
    queueSystem.emptyQueue();
    setQueue([]);
    setCalledTickets([]);
    setMessage("Queue has been emptied");

    saveQueue(queueSystem);
  };

  const showQueue = () => {
    setQueue(queueSystem.showQueue(section));
  };

  const averageWaitTime = () => {
    const averageWaitTimes = queueSystem.averageWaitTimeForAll();
    setMessage(
      `Average wait times for all sections: ${JSON.stringify(
        averageWaitTimes,
        null,
        2
      )}`
    );
  };

  return (
    <div>
      <h1>Queue System</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      />
      <select value={section} onChange={(e) => setSection(e.target.value)}>
        {SECTION_NAMES.map((section) => (
          <option key={section} value={section}>
            {section}
          </option>
        ))}
      </select>
      <button onClick={() => requestTicket(false)}>Request Ticket</button>
      <button onClick={() => requestTicket(true)}>
        Request Priority Ticket
      </button>
      <button onClick={callNextTicket}>Call Next Ticket</button>
      <button onClick={emptyQueue}>Empty Queue</button>
      <button onClick={showQueue}>Show Queue</button>
      <button onClick={averageWaitTime}>Average Wait Time</button>

      <h2>Last Called Tickets</h2>
      <pre>{JSON.stringify(calledTickets, null, 2)}</pre>
      <p>{message}</p>
      <h2>Queue for {section}</h2>
      <pre>{JSON.stringify(queue, null, 2)}</pre>
    </div>
  );
}

export default App;
