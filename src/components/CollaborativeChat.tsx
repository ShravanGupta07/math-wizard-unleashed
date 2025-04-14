
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoom } from "@/contexts/RoomContext";
import { Mic, MicOff, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export const CollaborativeChat: React.FC = () => {
  const { participants, sendChatMessage } = useRoom();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      userId: "host-user",
      userName: "Demo Host",
      content: "Welcome to the collaborative math session!",
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      id: "msg-2",
      userId: "user-456",
      userName: "John Doe",
      content: "I'm having trouble with the second equation. Can someone help?",
      timestamp: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
    },
    {
      id: "msg-3",
      userId: "user-789",
      userName: "Jane Smith",
      content: "I think we need to factor the polynomial first.",
      timestamp: new Date(Date.now() - 1000 * 60) // 1 minute ago
    }
  ]);
  const [voiceActive, setVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add message to local state (in a real app, this would be sent to a server)
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: "user-123", // Current user's ID
      userName: "You", // Current user's name
      content: message,
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    sendChatMessage(message);
    setMessage("");
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const toggleVoiceChat = () => {
    // In a real app, this would initiate/end a WebRTC voice call
    setVoiceActive(!voiceActive);
  };
  
  // Format timestamp to HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-medium">Chat</h3>
        <Button
          variant={voiceActive ? "default" : "outline"}
          size="icon"
          className={voiceActive ? "bg-green-500 hover:bg-green-600" : ""}
          onClick={toggleVoiceChat}
        >
          {voiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.userId === "user-123" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center mb-1">
                <span className="text-xs font-medium mr-2">{msg.userId === "user-123" ? "You" : msg.userName}</span>
                <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
              </div>
              <div 
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  msg.userId === "user-123" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
