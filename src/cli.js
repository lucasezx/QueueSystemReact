import pkg from "enquirer";
const { Select, Input } = pkg;
import { QueueSystem, SECTION_NAMES } from "./queueSystem.js";
import path from "path";
import fs from "fs";

const filePath = path.join(process.cwd(), 'queueData.json');

function saveQueue(queueSystem) {
  if (!queueSystem) return;
  const dataToSave = {
    user: queueSystem.user,
    queue: queueSystem.queue.filter((item) => item.user && item.ticket && item.section),
    tickets: queueSystem.tickets,
    history: queueSystem.history.filter((item) => item.user && item.ticket),
    sections: SECTION_NAMES.reduce((acc, section) => {
      acc[section] = queueSystem.sections[section] || 1;
      return acc;
    }, {}),
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving queue file:", error);
  }
}

async function loadQueue() {
const data = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
return QueueSystem.loadQueue(data);
}


async function selectSection() {
  const sectionPrompt = new Select({
    name: "section",
    message: "Select a section",
    choices: [...SECTION_NAMES],
  });
  return await sectionPrompt.run();
}
async function mainMenu(queueSystem) {
  const mainMenuPrompt = new Select({
    name: "queue",
    message: "Select an option",
    choices: [
      "Request Ticket",
      "Request Priority Ticket",
      "Call Next Ticket",
      "Average Wait Time",
      "Show Last Called Tickets",
      "Empty Queue",
      "Show Queue",
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
      initial: queueSystem.user,
    });

    const userName = await usernamePrompt.run();
    queueSystem.user = userName;

    if (!userName) {
      console.log("User name is required to request a ticket");
      return;
    }

    const section = await selectSection();
    const isPriority = answer === "Request Priority Ticket";
    console.log(queueSystem.requestTicket(section, isPriority));
  }

  if (answer === "Call Next Ticket") {
    const section = await selectSection();
    console.log(queueSystem.callNextTicket(section));
  }

  if (answer === "Average Wait Time") {
    const averageWaitTimes = queueSystem.averageWaitTimeForAll();
    console.log("The average wait for each tickets is:");
    for (const [section, waitTime] of Object.entries(averageWaitTimes)) {
      console.log(`${section}: ${waitTime.toFixed(2)} minutes`);
    }
  }

  if (answer === "Show Last Called Tickets") {
    console.log(JSON.stringify(queueSystem.showLastCalledTickets(), null, 2));
  }

  if (answer === "Empty Queue") {
    queueSystem.emptyQueue();
    console.log("Queue has been emptied.");
  }

  if (answer === "Show Queue") {
    const section = await selectSection();
    console.log(JSON.stringify(queueSystem.showQueue(section), null, 2));
  }

  saveQueue(queueSystem);
  return "";
}

(async () => {
  let code;
  const queueSystem = await loadQueue();
  do {
    code = await mainMenu(queueSystem);
  } while (code !== "Exit");
})();
