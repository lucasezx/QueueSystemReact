import React, { useState, useEffect } from "react";
import { SECTION_NAMES } from "./queueSystem.js";
import "./index.css";

const BASE_URL = "http://localhost:3001";

const formatTicket = (ticket) => {
  if (!ticket || !ticket.user) {
    return "No tickets available";
  }
  return `Name: ${ticket.user}\nTicket: ${ticket.ticket}\nPriority: ${
    ticket.priority ? "Yes" : "No"
  }\n----------------------`;
};

function App() {
  const [averageTime, setAverageTime] = useState("");
  const [clientSection, setClientSection] = useState(SECTION_NAMES[0]);
  const [customerSection, setCustomerSection] = useState(SECTION_NAMES[0]);
  const [clientQueue, setClientQueue] = useState([]);
  const [customerQueue, setCustomerQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState("");
  const [lastCalled, setLastCalled] = useState([]);

  async function refreshQueue(section, isClient = true) {
    try {
      const response = await fetch(`${BASE_URL}/queues/${section}/tickets`);
      if (!response.ok) {
        throw new Error("Failed to fetch queue data");
      }
      const data = await response.json();
      if (isClient) {
        setClientQueue(data.tickets);
      } else {
        setCustomerQueue(data.tickets);
      }
    } catch (error) {
      console.error("Error refreshing queue:", error.message);
    }
  }

  async function requestTicket(isPriority = false) {
    if (!user) {
      setMessage("User name is required to request a ticket");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/queues/${clientSection}/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user, isPriority }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to request ticket");
      }

      const data = await response.json();
      const priorityText = isPriority ? "Priority " : "";
      setMessage(`${priorityText}Ticket requested: ${data.message}`);
      setMessage(data.message);
      await refreshQueue(clientSection);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function callNextTicket() {
    try {
      const response = await fetch(
        `${BASE_URL}/queues/${customerSection}/call`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to call next ticket");
      }
      const data = await response.json();
      setMessage(data.message);
      setLastCalled((prevLastCalled) => [...prevLastCalled, data.ticket]);
      await refreshQueue(customerSection, false);
    } catch (error) {
      setMessage(error.message);
    }
  }
  

  async function emptyQueue() {
    try {
      const response = await fetch(`${BASE_URL}/queues/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear queue");
      }

      setMessage("Queue has been emptied");
      await refreshQueue(clientSection);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function averageWaitTime() {
    try {
      const response = await fetch(`${BASE_URL}/queues/average-wait-time`);
      if (!response.ok) {
        throw new Error("Failed to fetch average wait time");
      }
      const data = await response.json();
      console.log("Average wait times:", data);
      let displayText = "";
      for (const section in data) {
        const average = Number(data[section] || 0);
        displayText += `${section}: ${average.toFixed(2)} minutes\n`;
      }
      setAverageTime(displayText);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refreshQueue(clientSection, true);
    refreshQueue(customerSection, false);
  }, [clientSection, customerSection]);

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
        <pre>{clientQueue.map(formatTicket).join("\n\n")}</pre>
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
        <pre>{customerQueue.map(formatTicket).join("\n\n")}</pre>

        <h3>Last Called</h3>
        <pre>
          {lastCalled.length > 0
            ? lastCalled.map(formatTicket).join("\n\n")
            : "No ticket called yet"}
        </pre>

        <button onClick={averageWaitTime}>Average Wait Time</button>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            maxWidth: "350px",
          }}
        >
          {averageTime}
        </pre>
      </div>
    </div>
  );
}

export default App;
