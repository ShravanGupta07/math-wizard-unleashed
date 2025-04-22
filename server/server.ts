import express, { Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import cors from "cors";

interface QueryEvent {
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
  id?: string;
}

interface UserConnection {
  userId: string;
  name?: string;
  connections: Set<string>;
}

// Create Redis client for pub/sub
const redisSub = new Redis();
// Create Redis client for commands
const redis = new Redis();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = app.listen(4000, '0.0.0.0', () => {
  console.log(`HTTP server listening on http://0.0.0.0:4000`);
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });
console.log("WebSocket server listening on ws://0.0.0.0:4000");

// Store active WebSocket connections and user IDs with their connection IDs
const clients = new Set<WebSocket>();
const activeUsers = new Map<string, UserConnection>(); // userId -> UserConnection

// Initialize server
const init = async () => {
  try {
    // Check Redis connection
    await redis.ping();
    console.log("Connected to Redis successfully");
    
    // Get current data count
    const count = await redis.llen("math_queries");
    console.log(`Found ${count} existing queries in Redis`);
  } catch (err) {
    console.error("Failed to initialize Redis connection:", err);
    process.exit(1);
  }
};

init().catch(console.error);

// Broadcast active users count to all clients
const broadcastActiveUsers = () => {
  // Count unique users (not connections)
  const uniqueUsers = Array.from(activeUsers.values()).filter(conn => conn.connections.size > 0);
  
  console.log('Active users:', {
    uniqueUsers: uniqueUsers.map(u => u.userId),
    count: uniqueUsers.length,
    connections: uniqueUsers.map(u => ({
      userId: u.userId,
      connectionCount: u.connections.size
    }))
  });
  
  const message = JSON.stringify({ 
    type: "active_users", 
    count: uniqueUsers.length
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Subscribe to Redis channel for Fluvio events
redisSub.subscribe("fluvio_math_events", (err) => {
  if (err) {
    console.error("Failed to subscribe to Redis channel:", err);
    return;
  }
  console.log("Subscribed to Redis channel: fluvio_math_events");
});

redisSub.on("message", (channel, message) => {
  if (channel === "fluvio_math_events") {
    console.log("Received message from Fluvio via Redis:", message);
    // Broadcast to all WebSocket clients
    const event = JSON.parse(message);
    const formattedMessage = JSON.stringify({
      type: 'query_event',
      data: event
    });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(formattedMessage);
      }
    });
  }
});

// Handle POST /event endpoint
app.post("/event", async (req: Request, res: Response) => {
  try {
    const event: QueryEvent = req.body;
    event.timestamp = Date.now();
    
    // Add a unique ID if not present
    if (!event.id) {
      event.id = `${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Store event in Redis
    const eventString = JSON.stringify(event);
    await redis.lpush("math_queries", eventString);
    console.log("Stored event in Redis:", eventString);

    // Broadcast directly to WebSocket clients
    const message = JSON.stringify({
      type: 'query_event',
      data: event
    });
    console.log("Broadcasting new event to clients");
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    res.status(200).json({ message: "Event received" });
  } catch (error) {
    console.error("Error handling event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  const connectionId = Math.random().toString(36).substr(2, 6);
  console.log(`New WebSocket client connected: ${connectionId}`);
  
  // Store connection metadata in WebSocket instance
  (ws as any).connectionId = connectionId;
  (ws as any).userId = null;
  clients.add(ws);

  // Remove client and user when they disconnect
  ws.on("close", () => {
    console.log(`WebSocket client disconnected: ${connectionId}`);
    clients.delete(ws);
    
    // Remove user's connection
    const userId = (ws as any).userId;
    if (userId) {
      const userConnection = activeUsers.get(userId);
      if (userConnection) {
        userConnection.connections.delete(connectionId);
        if (userConnection.connections.size === 0) {
          activeUsers.delete(userId);
          console.log(`User ${userId} removed - no more active connections`);
        } else {
          console.log(`Connection ${connectionId} removed for user ${userId} - ${userConnection.connections.size} connections remaining`);
        }
        broadcastActiveUsers();
      }
    }
  });

  // Handle messages from clients
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === "ping") {
        return; // Ignore ping messages
      }
      
      console.log('Received message:', data);

      if (data.type === "user_active" && data.userId) {
        const userId = data.userId;
        const userName = data.name;
        
        // Check if this is a new connection for an existing user
        if ((ws as any).userId === userId) {
          console.log(`Duplicate user_active message for user ${userId}`);
          return;
        }

        // Remove old connection if it exists
        const oldUserId = (ws as any).userId;
        if (oldUserId) {
          const oldConnection = activeUsers.get(oldUserId);
          if (oldConnection) {
            oldConnection.connections.delete(connectionId);
            if (oldConnection.connections.size === 0) {
              activeUsers.delete(oldUserId);
              console.log(`User ${oldUserId} removed - no more active connections`);
            }
          }
        }

        // Add new connection
        (ws as any).userId = userId;
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, {
            userId,
            name: userName,
            connections: new Set([connectionId])
          });
        } else {
          activeUsers.get(userId)!.connections.add(connectionId);
        }
        console.log(`User ${userId} active with connection ${connectionId}`);
        
        // Send recent events to the new connection
        try {
          const events = await redis.lrange("math_queries", 0, 99);
          console.log(`Found ${events.length} events in Redis`);
          
          if (events.length > 0) {
            const recentEvents = events
              .map(event => JSON.parse(event))
              .reverse(); // Most recent first
            
            console.log('Sending initial events to client:', recentEvents);
            ws.send(JSON.stringify({
              type: 'initial_events',
              data: recentEvents
            }));
          } else {
            console.log('No events found in Redis');
          }
        } catch (error) {
          console.error("Error fetching recent events:", error);
        }
        
        // Broadcast active users after setting the user ID
        broadcastActiveUsers();
      }

      // Handle event subscriptions
      if (data.type === "subscribe_events") {
        (ws as any).subscribed = true;
        console.log(`Client ${connectionId} subscribed to events`);
      }

      if (data.type === "unsubscribe_events") {
        (ws as any).subscribed = false;
        console.log(`Client ${connectionId} unsubscribed from events`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
}); 