import React, { useState, useEffect } from "react";
import { QueueSystem, SECTION_NAMES } from "./queueSystem.js";
import "./index.css";

function saveQueue(queue) {
  if (!queue) return;
  const dataToSave = queue.backedUpQueue();
  dataToSave.lastCalledTickets = queue.showLastCalledTickets;

  localStorage.setItem("queueData", JSON.stringify(dataToSave));
}

function loadQueue() {
  const data = localStorage.getItem("queueData");
  return data ? QueueSystem.loadQueueSystem(data) : new QueueSystem("");
}

function App() {
  const [averageTime, setAverageTime] = useState("");
  const [clientSection, setClientSection] = useState("");
  const [customerSection, setCustomerSection] = useState("");
  const [queueSystem] = useState(() => loadQueue());
  const [user, setUser] = useState(queueSystem.user || "");
  const [queue, setQueue] = useState(queueSystem.queue);
  const [calledTickets, setCalledTickets] = useState(
    queueSystem.lastCalledTickets || []
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (SECTION_NAMES.length > 0) {
      setClientSection(SECTION_NAMES[0]);
      setCustomerSection(SECTION_NAMES[0]);
    }
    setCalledTickets(queueSystem.showLastCalledTickets());
  }, [queueSystem]);

  const requestTicket = (isPriority = false) => {
    if (!user) {
      setMessage("User name is required to request a ticket");
      return;
    }

    queueSystem.user = user;
    const message = queueSystem.requestTicket(clientSection, isPriority);
    setQueue([...queueSystem.queue]);
    setMessage(message);

    saveQueue(queueSystem);
  };

  const callNextTicket = () => {
    try {
      const message = queueSystem.callNextTicket(customerSection);
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

  const averageWaitTime = () => {
    const averageWaitTimes = queueSystem.averageWaitTimeForAll();
    setAverageTime(
      `Average wait times for all sections: ${JSON.stringify(
        averageWaitTimes,
        null,
        2
      )}`
    );
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-around" }}>
      <div>
        <h2>Client</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <select
          value={clientSection}
          onChange={(e) => setClientSection(e.target.value)}
        >
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

        <h3>Queue for {clientSection}</h3>
        <pre>
          {JSON.stringify(
            queue.filter((ticket) => ticket.section === clientSection),
            null,
            2
          )}
        </pre>
      </div>

      <div>
        <h2>Customer</h2>
        <select
          value={customerSection}
          onChange={(e) => setCustomerSection(e.target.value)}
        >
          {SECTION_NAMES.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
        <button onClick={callNextTicket}>Call Next Ticket</button>
        <button onClick={emptyQueue}>Empty Queue</button>

        <h3>Queue for {customerSection}</h3>
        <pre>
          {JSON.stringify(
            queue.filter((ticket) => ticket.section === customerSection),
            null,
            2
          )}
        </pre>

        <h3>Last Called Tickets for {customerSection}</h3>
        <pre>
          {JSON.stringify(
            calledTickets.filter(
              (ticket) => ticket.section === customerSection
            ),
            null,
            2
          )}
        </pre>

        <button onClick={averageWaitTime}>Average Wait Time</button>
        <p>{message}</p>
        <p>{averageTime}</p>
      </div>
    </div>
  );
}

export default App;
