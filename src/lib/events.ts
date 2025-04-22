export interface QueryEvent {
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
}

export const sendQueryEvent = async (event: QueryEvent) => {
  try {
    const response = await fetch('http://localhost:4000/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to send event');
    }

    console.log("Event sent successfully:", event);
  } catch (error) {
    console.error("Error sending event:", error);
  }
}; 