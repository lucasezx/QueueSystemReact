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

function formatTicket(ticket) {
  return `Name: ${ticket.user}\nTicket: ${ticket.ticket}\nPriority: ${ticket.priority ? "Yes" : "No"}\n----------------------`;
}

function formatAverageWaitTimes(averageWaitTimes) {
  return Object.entries(averageWaitTimes)
    .map(
      ([section, average]) =>
        `${section}: ${
          average !== null && !isNaN(average) ? average : 0
        } minutes`
    )
    .join("\n");
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
      `Average wait times for all sections: \n${formatAverageWaitTimes(
        averageWaitTimes
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
          {queue
            .filter((ticket) => ticket.section === clientSection)
            .map(formatTicket)
            .join("\n\n")}
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
        
        <p>{message}</p>

        <h3>Queue for {customerSection}</h3>
        <pre>
          {queue
            .filter((ticket) => ticket.section === customerSection)
            .map(formatTicket)
            .join("\n\n")}
        </pre>

        <h3>Last Called Tickets for {customerSection}</h3>
        <pre>
          {calledTickets
            .filter((ticket) => ticket.section === customerSection)
            .map(formatTicket)
            .join("\n\n")}
        </pre>

        <button onClick={averageWaitTime}>Average Wait Time</button>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: `break-word`,
            maxWidth: `350px`,
          }}
        >
          {averageTime}
        </pre>
      </div>
    </div>
  );
}

export default App;
