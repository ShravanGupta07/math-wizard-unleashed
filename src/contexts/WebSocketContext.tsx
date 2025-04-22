import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Declare the __WS_TOKEN__ property on the Window interface
declare global {
  interface Window {
    __WS_TOKEN__?: string;
  }
}

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: string;
  activeUsers: number;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'Disconnected',
  activeUsers: 0,
  sendMessage: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [activeUsers, setActiveUsers] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const userIdRef = useRef<string>(`user-${Math.random().toString(36).substr(2, 9)}`);
  const messageQueueRef = useRef<any[]>([]);
  const [shouldConnect, setShouldConnect] = useState(false);

  const connect = () => {
    // Only connect if we should and there's no existing connection
    if (!shouldConnect || 
        socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      console.log('Attempting to connect to WebSocket server...');
      setConnectionStatus('Connecting...');
      
      // Create WebSocket URL with token if available
      let wsUrl = 'ws://localhost:4000';
      if (typeof window !== 'undefined' && window.__WS_TOKEN__) {
        wsUrl += `?token=${window.__WS_TOKEN__}`;
      }
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setConnectionStatus('Connected');
        
        // Send user_active message with consistent user ID
        ws.send(JSON.stringify({
          type: 'user_active',
          userId: user?.id || userIdRef.current,
          name: user?.name || 'Anonymous User'
        }));
        
        // Process any queued messages
        if (messageQueueRef.current.length > 0) {
          messageQueueRef.current.forEach(msg => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(msg));
            }
          });
          messageQueueRef.current = [];
        }
        
        // Send a ping every 30 seconds to keep the connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Store the interval ID for cleanup
        (ws as any).pingInterval = pingInterval;
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        setActiveUsers(0);
        clearInterval((ws as any).pingInterval);
        socketRef.current = null;

        // Only attempt to reconnect if we should
        if (shouldConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            setConnectionStatus('Reconnecting...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
        // Don't set any error states that might affect the UI
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Update active users if the message contains that information
          if (message.type === 'active_users' && typeof message.count === 'number') {
            setActiveUsers(message.count);
          }
          
          // Dispatch custom event for components to listen to
          const customEvent = new CustomEvent('websocket-message', {
            detail: message
          });
          window.dispatchEvent(customEvent);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  };

  // Only attempt to connect when user is authenticated
  useEffect(() => {
    setShouldConnect(!!user);
  }, [user]);

  // Handle connection based on shouldConnect flag
  useEffect(() => {
    if (shouldConnect) {
      connect();
    } else {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.close();
        clearInterval((socketRef.current as any).pingInterval);
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      setActiveUsers(0);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        clearInterval((socketRef.current as any).pingInterval);
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [shouldConnect]);

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      messageQueueRef.current.push(message);
      
      // If not connected but should be, try to reconnect
      if (shouldConnect && !isConnected) {
        connect();
      }
    }
  };

  return (
    <WebSocketContext.Provider value={{ 
      socket: socketRef.current, 
      isConnected, 
      connectionStatus,
      activeUsers,
      sendMessage 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 