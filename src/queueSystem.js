const SECTION_NAMES = Object.freeze([
  "Bakery",
  "Butcher",
  "Fishmonger",
  "Deli",
  "Checkout",
]);

class QueueSystem {
  constructor(user, sharedQueue = []) {
    this.user = user;
    this.tickets = [];
    this.queue = sharedQueue;
    this.history = [];
    this.sections = SECTION_NAMES.reduce((acc, section) => {
      acc[section] = 1;
      return acc;
    }, {});
  }

  requestTicket(section, isPriority = false) {
    if (!this.user) {
      throw new Error("User name is required to request a ticket");
    }
  
    const ticketNumber = this.sections[section]++;
    const newTicket = {
      user: this.user,
      ticket: ticketNumber,
      section,
      priority: isPriority,
    };
  
    this.queue.push(newTicket);
  
    const positionInSection = this.queue.filter(
      (item) => item.section === section
    ).length;
  
    return `${
      isPriority ? "Priority" : ""
    } Ticket for ${section} requested for ${
      this.user
    }, position ${positionInSection} in queue`;
  }
  

  showQueue(section) {
    return this.queue.filter((item) => item.section === section);
  }

  averageWaitTimeForAll() {
    const sectionWaitTimes = SECTION_NAMES.reduce((acc, section) => {
      acc[section] = 0;
      return acc;
    }, {});

    const sectionCount = SECTION_NAMES.reduce((acc, section) => {
      acc[section] = 0;
      return acc;
    }, {});

    this.queue.forEach((item) => {
      const { section } = item;
      const sectionTime =
        this.queue.filter((q) => q.section === section).indexOf(item) + 1;

      sectionWaitTimes[section] += sectionTime;
      sectionCount[section]++;
    });

    const sectionAverages = {
      Bakery: sectionWaitTimes.Bakery / sectionCount.Bakery,
      Butcher: sectionWaitTimes.Butcher / sectionCount.Butcher,
      Fishmonger: sectionWaitTimes.Fishmonger / sectionCount.Fishmonger,
      Deli: sectionWaitTimes.Deli / sectionCount.Deli,
    };

    return sectionAverages;
  }

  callNextTicket(section) {
    const sectionQueue = this.queue.filter((item) => item.section === section);
    if (sectionQueue.length === 0) {
      console.log(`There are no tickets in the ${section} queue`);
    }

    const nextTicketIndex = sectionQueue.findIndex((item) => item.priority);
    const nextTicket =
      nextTicketIndex === -1 ? sectionQueue[0] : sectionQueue[nextTicketIndex];

    this.queue = this.queue.filter((item) => item !== nextTicket);
    this.history.push(nextTicket);
    return `Next ticket for ${section} is ${nextTicket.ticket} for ${nextTicket.user}`;
  }

  showLastCalledTickets() {
    if (this.history.length === 0) {
      return "No tickets have been called yet";
    }
    return this.history.slice(-3);
  }

  emptyQueue() {
    this.queue = [];
    this.history = [];
    this.tickets = [];
    this.sections = SECTION_NAMES.reduce((acc, section) => {
      acc[section] = 1;
      return acc;
    }, {});
  }

  static saveQueue(queue) {
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
    };
    localStorage.setItem("queueData", JSON.stringify(dataToSave));
  }

  static loadQueue() {
    const data = localStorage.getItem("queueData");
    if (data) {
      const parsedData = JSON.parse(data);

      const queueSystem = new QueueSystem(parsedData.user || "");

      queueSystem.queue = (parsedData.queue || []).filter(
        (item) => item.user && item.ticket && item.section
      );
      queueSystem.tickets = parsedData.tickets || [];
      queueSystem.history = (parsedData.history || []).filter(
        (item) => item.user && item.ticket
      );
      queueSystem.sections = SECTION_NAMES.reduce((acc, section) => {
        acc[section] = parsedData.sections?.[section] || 1;
        return acc;
      }, {});

      return queueSystem;
    }
    return new QueueSystem();
  }
}

export { QueueSystem, SECTION_NAMES };
