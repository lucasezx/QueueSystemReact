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

  static loadQueueSystem(queue) {
    const parsedData = JSON.parse(queue);
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

  backedUpQueue() {
    return {
      user: this.user,
      queue: this.queue.filter(
        (item) => item.user && item.ticket && item.section
      ),
      tickets: this.tickets,
      history: this.history.filter((item) => item.user && item.ticket),
      sections: SECTION_NAMES.reduce((acc, section) => {
        acc[section] = this.sections[section] || 1;
        return acc;
      }, {}),
    };
  }

  requestTicket(section, user, isPriority = false) {
    if (!user) {
      throw new Error("User name is required to request a ticket");
    }

    const ticketNumber = this.sections[section]++;
    const newTicket = {
      user: user,
      ticket: ticketNumber,
      section: section,
      priority: isPriority,
    };

    if (isPriority) {
      let lastPriorityIndex = -1;
      for (let i = 0; i < this.queue.length; i++) {
        const ticket = this.queue[i];
        if (ticket.section === section && ticket.priority) {
          lastPriorityIndex = i;
        }
      }
      if (lastPriorityIndex !== -1) {
        this.queue.splice(lastPriorityIndex + 1, 0, newTicket);
      } else {
        const firstNonPriorityIndex = this.queue.findIndex(
          (ticket) => ticket.section === section && !ticket.priority
        );
        if (firstNonPriorityIndex !== -1) {
          this.queue.splice(firstNonPriorityIndex, 0, newTicket);
        } else {
          this.queue.push(newTicket);
        }
      }
    } else {
      this.queue.push(newTicket);
    }

    const positionInSection = this.queue.filter(
      (item) => item.section === section
    ).length;

    return `${
      isPriority ? "Priority " : ""
    }Ticket requested for ${user}, position ${positionInSection}`;
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
      ...SECTION_NAMES.reduce((acc, section) => {
        acc[section] = sectionWaitTimes[section] / sectionCount[section];
        return acc;
      }, {}),
    };

    return sectionAverages;
  }

  callNextTicket(section) {
    const sectionQueue = this.queue.filter((item) => item.section === section);
    if (sectionQueue.length === 0) {
      throw new Error(`There are no tickets in the ${section} queue`);
    }

    const nextTicket = sectionQueue[0];

    const indexInGlobal = this.queue.indexOf(nextTicket);
    if (indexInGlobal > -1) {
      this.queue.splice(indexInGlobal, 1);
    }
    this.history.push(nextTicket);
    return nextTicket;
  }

  showLastCalledTickets() {
    if (!this.history) {
      return "No tickets have been called yet";
    }
    return this.history.slice(Math.max(this.history.length - 10, 0));
  }

  emptyQueue() {
    this.queue = [];
    this.history = [];
    this.tickets = [];
    this.sections = SECTION_NAMES.reduce((acc, section) => {
      acc[section] = 1;
      return acc;
    }, {});
    this.user = "";
  }

  static loadQueue(data) {
    if (!data) {
      return new QueueSystem();
    }

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
}

export { QueueSystem, SECTION_NAMES };
export default QueueSystem;
