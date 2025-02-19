import React, { useState, useEffect } from "react";
import "./index.css";

const BASE_URL = "http://localhost:3001";

const formatTicket = (ticket) => {
  if (!ticket || !ticket.name) {
    return "No tickets available";
  }
  return `Name: ${ticket.name}\nTicket: ${ticket.sequence}\nPriority: ${
    ticket.is_priority ? "Yes" : "No"
  }\n----------------------`;
};  

function App() {
  const [sections, setSections] = useState([]);
  const [averageTime, setAverageTime] = useState("");
  const [clientSection, setClientSection] = useState(null);
  const [customerSection, setCustomerSection] = useState(null);
  const [clientQueue, setClientQueue] = useState([]);
  const [customerQueue, setCustomerQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [lastCalled, setLastCalled] = useState([]);

  async function fetchSections() {
    try {
      const response = await fetch(`${BASE_URL}/queues`);
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      const data = await response.json();
      setSections(data);
      if (data.length > 0) {
        setClientSection(data[0]);
        setCustomerSection(data[0]);
      }
    } catch (error) {
      console.error("Error fetching sections:", error.message);
    }
  }

  async function refreshQueue(section, isClient = true) {
    try {
      const queue_id = section.id;
      const response = await fetch(`${BASE_URL}/queues/${queue_id}/tickets`);
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

  async function requestTicket(is_priority = false) {
    if (!name.trim()) {
      setMessage("User name is required to request a ticket");
      return;
    }
    try {
      const queue_id = clientSection.id;
      const response = await fetch(`${BASE_URL}/queues/${queue_id}/tickets/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, is_priority }),
      });

      if (!response.ok) {
        throw new Error("Failed to request ticket");
      }

      const data = await response.json();
      setMessage(`Ticket requested: ${data.message}`);
      await refreshQueue(clientSection);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function callNextTicket() {
    try {
      const queue_id = customerSection.id;
      const response = await fetch(
        `${BASE_URL}/queues/${queue_id}/tickets/next`,
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
      for (const sectionTitle in data) {
        const average = Number(data[sectionTitle] || 0);
        displayText += `${sectionTitle}: ${average.toFixed(2)} minutes\n`;
      }
      setAverageTime(displayText);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (clientSection) refreshQueue(clientSection, true);
  }, [clientSection]);

  useEffect(() => {
    if (customerSection) refreshQueue(customerSection, false);
  }, [customerSection]);

  return (
    <div style={{ display: "flex", justifyContent: "space-around" }}>
      <div>
        <h2>Client</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          value={clientSection ? clientSection.id : ""}
          onChange={(e) => {
            const section = sections.find(
              (s) => s.id === parseInt(e.target.value, 10)
            );
            setClientSection(section);
          }}
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
        <button onClick={() => requestTicket(false)}>Request Ticket</button>
        <button onClick={() => requestTicket(true)}>
          Request Priority Ticket
        </button>

        <h3>Queue for {clientSection ? clientSection.title : ""}</h3>
        <pre>
          {clientQueue.map(formatTicket).join("\n\n") || "No tickets available"}
        </pre>
      </div>

      <div>
        <h2>Customer</h2>
        <select
          value={customerSection ? customerSection.id : ""}
          onChange={(e) => {
            const section = sections.find(
              (s) => s.id === parseInt(e.target.value, 10)
            );
            setCustomerSection(section);
          }}
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
        <button onClick={callNextTicket}>Call Next Ticket</button>
        <button onClick={emptyQueue}>Empty Queue</button>

        <p>{message}</p>

        <h3>Queue for {customerSection ? customerSection.title : ""}</h3>
        <pre>
          {customerQueue.map(formatTicket).join("\n\n") ||
            "No tickets available"}
        </pre>

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
