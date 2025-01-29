import React, { useState, useEffect } from "react";
import { QueueSystem, SECTION_NAMES } from "./queueSystem.js";
import "./index.css";


function App() {
  const [queueSystem] = useState(QueueSystem.loadQueue());
  const [user, setUser] = useState(queueSystem.user || "");
  const [section, setSection] = useState(SECTION_NAMES[0]);
  const [queue, setQueue] = useState(queueSystem.queue);
  const [calledTickets, setCalledTickets] = useState(
    queueSystem.showLastCalledTickets()
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    QueueSystem.saveQueue(queueSystem);
  }, [queueSystem]);

  const requestTicket = (isPriority = false) => {
    if (!user) {
      setMessage("User name is required to request a ticket");
      return;
    }

    queueSystem.user = user;
    const message = queueSystem.requestTicket(section, isPriority);
    setQueue([...queueSystem.queue]);
    setMessage(message);
  };

  const callNextTicket = () => {
    try {
      const message = queueSystem.callNextTicket(section);
      setQueue([...queueSystem.queue]);
      setCalledTickets([...queueSystem.showLastCalledTickets()]);
      setMessage(message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const emptyQueue = () => {
    queueSystem.emptyQueue();
    setQueue([]);
    setCalledTickets([]);
    setMessage("Queue has been emptied.");
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
  }

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