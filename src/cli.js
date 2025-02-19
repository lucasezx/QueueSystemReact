import pkg from "enquirer";
const { Select, Input } = pkg;

const BASE_URL = "http://localhost:3001";

async function selectSection() {
  const response = await fetch(`${BASE_URL}/queues`);
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    console.error("No sections found or data is not an array");
    return;
  }

  const sections = data.map((section) => section.title);
  const sectionPrompt = new Select({
    name: "section",
    message: "Select a section",
    choices: sections,
  });

  const selectedTitle = await sectionPrompt.run();
  return data.find((section) => section.title === selectedTitle).id;
}


async function mainMenu() {
  const mainMenuPrompt = new Select({
    name: "queue",
    message: "Select an option",
    choices: [
      "Request Ticket",
      "Request Priority Ticket",
      "Call Next Ticket",
      "Empty Queue",
      "Show Queue",
      "Show Last Called",
      "Average Wait Time",
      "Exit",
    ],
  });

  const answer = await mainMenuPrompt.run();

  if (answer === "Exit") {
    console.log("Goodbye!");
    return "Exit";
  }

  if (["Request Ticket", "Request Priority Ticket"].includes(answer)) {
    const usernamePrompt = new Input({
      message: "Enter your name",
    });
    const userName = await usernamePrompt.run();
    const isPriority = answer === "Request Priority Ticket";
    const section = await selectSection();
    try {
      const response = await fetch(`${BASE_URL}/queues/${section}/tickets/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: userName, is_priority: isPriority }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  if (answer === "Call Next Ticket") {
    const section = await selectSection();
    try {
      const response = await fetch(`${BASE_URL}/queues/${section}/tickets/next`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  if (answer === "Empty Queue") {
    try {
      const response = await fetch(`${BASE_URL}/queues/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log("Queue cleared successfully");
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  if (answer === "Show Queue") {
    const section = await selectSection();
    try {
      const response = await fetch(`${BASE_URL}/queues/${section}/tickets`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(JSON.stringify(data.tickets, null, 2));
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  if (answer === "Show Last Called") {
    try {
      const response = await fetch(`${BASE_URL}/queues/last-called`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Last Called Tickets:");
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  if (answer === "Average Wait Time") {
    try {
      const response = await fetch(`${BASE_URL}/queues/average-wait-time`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Average Wait Times:");
      for (const section in data) {
        console.log(`${section}: ${Number(data[section]).toFixed(2)} minutes`);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  return "";
}

(async () => {
  let code;
  do {
    code = await mainMenu();
  } while (code !== "Exit");
})();
