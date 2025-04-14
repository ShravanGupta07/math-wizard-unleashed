
import React, { createContext, useState, useContext, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export type RoomRole = "host" | "co-host" | "solver" | "viewer";
export type ParticipantData = {
  id: string;
  name: string;
  avatar?: string;
  role: RoomRole;
  isActive: boolean;
  team?: "A" | "B";
  score?: number;
};

type RoomContextType = {
  roomCode: string | null;
  isHost: boolean;
  participants: ParticipantData[];
  userRole: RoomRole;
  teamMode: boolean;
  activeEditor: string | null;
  createRoom: (roomName: string, userName: string) => Promise<void>;
  joinRoom: (roomCode: string, userName: string) => Promise<void>;
  leaveRoom: () => void;
  toggleTeamMode: () => void;
  updateUserRole: (userId: string, role: RoomRole) => void;
  sendChatMessage: (message: string) => void;
  lockBoard: () => void;
  unlockBoard: () => void;
  takeEditorControl: () => void;
  releaseEditorControl: () => void;
};

export const RoomContext = createContext<RoomContextType>({
  roomCode: null,
  isHost: false,
  participants: [],
  userRole: "viewer",
  teamMode: false,
  activeEditor: null,
  createRoom: async () => {},
  joinRoom: async () => {},
  leaveRoom: () => {},
  toggleTeamMode: () => {},
  updateUserRole: () => {},
  sendChatMessage: () => {},
  lockBoard: () => {},
  unlockBoard: () => {},
  takeEditorControl: () => {},
  releaseEditorControl: () => {},
});

export const useRoom = () => useContext(RoomContext);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [userRole, setUserRole] = useState<RoomRole>("viewer");
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [teamMode, setTeamMode] = useState(false);
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  
  // Mock user ID for the current user
  const currentUserId = "user-123";
  
  // Mock room creation - in a real app, this would connect to Firebase/Socket.io
  const createRoom = async (roomName: string, userName: string) => {
    try {
      // Generate a random 6-character room code
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Set up the room state
      setRoomCode(newRoomCode);
      setIsHost(true);
      setUserRole("host");
      
      // Add the host as first participant
      setParticipants([
        {
          id: currentUserId,
          name: userName,
          role: "host",
          isActive: true,
          score: 0
        }
      ]);
      
      toast({
        title: "Room created",
        description: `Room ${newRoomCode} created successfully. Share this code with others to join.`
      });
      
    } catch (error) {
      toast({
        title: "Error creating room",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Mock join room - in a real app, this would connect to Firebase/Socket.io
  const joinRoom = async (code: string, userName: string) => {
    try {
      // Simulate API call to join room
      // In a real app, this would validate the room code and connect to the room
      
      if (code === "DEMO") {
        // Just for demo purposes, allow joining a demo room
        setRoomCode(code);
        setIsHost(false);
        setUserRole("solver");
        
        // Mock existing participants
        setParticipants([
          {
            id: "host-user",
            name: "Demo Host",
            role: "host",
            isActive: true,
            score: 120
          },
          {
            id: currentUserId,
            name: userName,
            role: "solver",
            isActive: true,
            score: 0
          },
          {
            id: "user-456",
            name: "John Doe",
            role: "solver",
            isActive: true,
            team: "A",
            score: 85
          },
          {
            id: "user-789",
            name: "Jane Smith",
            role: "viewer",
            isActive: true,
            team: "B",
            score: 65
          }
        ]);
        
        toast({
          title: "Joined room",
          description: "You've joined the demo room successfully."
        });
      } else {
        // For a real implementation, validate the room code
        throw new Error("Invalid room code. Please try again.");
      }
      
    } catch (error) {
      toast({
        title: "Error joining room",
        description: error instanceof Error ? error.message : "Failed to join room. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const leaveRoom = () => {
    setRoomCode(null);
    setIsHost(false);
    setUserRole("viewer");
    setParticipants([]);
    setTeamMode(false);
    setActiveEditor(null);
    
    toast({
      title: "Left room",
      description: "You've left the collaborative session."
    });
  };
  
  const toggleTeamMode = () => {
    if (!isHost && userRole !== "co-host") {
      toast({
        title: "Permission denied",
        description: "Only hosts and co-hosts can toggle team mode.",
        variant: "destructive"
      });
      return;
    }
    
    setTeamMode(!teamMode);
    
    // In a real implementation, this would notify all participants about the mode change
    toast({
      title: teamMode ? "Team mode disabled" : "Team mode enabled",
      description: teamMode 
        ? "Participants are no longer divided into teams." 
        : "Participants are now divided into Team A and Team B."
    });
  };
  
  const updateUserRole = (userId: string, role: RoomRole) => {
    if (!isHost && userRole !== "co-host") {
      toast({
        title: "Permission denied",
        description: "Only hosts and co-hosts can change user roles.",
        variant: "destructive"
      });
      return;
    }
    
    setParticipants(participants.map(p => 
      p.id === userId ? { ...p, role } : p
    ));
    
    // If updating current user's role
    if (userId === currentUserId) {
      setUserRole(role);
    }
    
    // In a real implementation, this would notify all participants
    toast({
      title: "Role updated",
      description: `User role has been updated to ${role}.`
    });
  };
  
  const sendChatMessage = (message: string) => {
    // In a real implementation, this would send the message to all participants
    toast({
      title: "Message sent",
      description: "Your message has been sent to the room."
    });
  };
  
  const lockBoard = () => {
    if (!isHost && userRole !== "co-host") {
      toast({
        title: "Permission denied",
        description: "Only hosts and co-hosts can lock the board.",
        variant: "destructive"
      });
      return;
    }
    
    setActiveEditor(currentUserId);
    
    // In a real implementation, this would notify all participants
    toast({
      title: "Board locked",
      description: "Only you can edit the board now."
    });
  };
  
  const unlockBoard = () => {
    if (!isHost && userRole !== "co-host" && activeEditor !== currentUserId) {
      toast({
        title: "Permission denied",
        description: "Only the current editor or hosts can unlock the board.",
        variant: "destructive"
      });
      return;
    }
    
    setActiveEditor(null);
    
    // In a real implementation, this would notify all participants
    toast({
      title: "Board unlocked",
      description: "Anyone can edit the board now."
    });
  };
  
  const takeEditorControl = () => {
    if (activeEditor && activeEditor !== currentUserId) {
      toast({
        title: "Board is locked",
        description: "The board is currently locked by another user.",
        variant: "destructive"
      });
      return;
    }
    
    setActiveEditor(currentUserId);
    
    // In a real implementation, this would notify all participants
    toast({
      title: "Control taken",
      description: "You are now the active editor."
    });
  };
  
  const releaseEditorControl = () => {
    if (activeEditor !== currentUserId) {
      return;
    }
    
    setActiveEditor(null);
    
    // In a real implementation, this would notify all participants
    toast({
      title: "Control released",
      description: "You are no longer the active editor."
    });
  };
  
  return (
    <RoomContext.Provider value={{
      roomCode,
      isHost,
      participants,
      userRole,
      teamMode,
      activeEditor,
      createRoom,
      joinRoom,
      leaveRoom,
      toggleTeamMode,
      updateUserRole,
      sendChatMessage,
      lockBoard,
      unlockBoard,
      takeEditorControl,
      releaseEditorControl
    }}>
      {children}
    </RoomContext.Provider>
  );
};
