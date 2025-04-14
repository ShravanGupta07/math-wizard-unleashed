
import React, { useState } from "react";
import { 
  Pencil, 
  Eraser, 
  Type, 
  Image, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  Undo, 
  Redo, 
  RefreshCw,
  Grid3X3,
  MessageSquare,
  Users,
  Clock,
  Award,
  HelpCircle,
  Lock,
  Hand,
  RotateCw,
  Mic,
  Layers,
  User,
  Plus,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CollaborativeWhiteboard } from "@/components/CollaborativeWhiteboard";
import { CollaborativeChat } from "@/components/CollaborativeChat";
import { ParticipantsList } from "@/components/ParticipantsList";
import { ProblemPanel } from "@/components/ProblemPanel";
import { ToolsPanel } from "@/components/ToolsPanel";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { RoomContext, RoomProvider } from "@/contexts/RoomContext";

const SolveTogetherLanding = () => {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-display">Solve Together</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Collaborate in real-time with friends, classmates, or tutors to solve math problems
          on a shared whiteboard with powerful tools and AI assistance.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="hover:shadow-md transition-all border-2 border-transparent hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create a Room
            </CardTitle>
            <CardDescription>
              Start a new collaborative session as the host
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new room and invite others to join. You'll be the host with full control over the session.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowCreateModal(true)}
            >
              Create New Room
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-all border-2 border-transparent hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Join a Room
            </CardTitle>
            <CardDescription>
              Join an existing collaborative session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a room code to join an existing session. You'll be able to collaborate with others in real-time.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setShowJoinModal(true)}
            >
              Join Existing Room
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Feature highlights */}
      <div className="pt-8">
        <h2 className="text-2xl font-semibold font-display text-center mb-6">Powerful Collaboration Features</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Interactive Whiteboard</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Draw, write, and solve problems with a full suite of math tools
            </p>
          </div>
          
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Real-Time Chat</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Discuss solutions with text and optional voice chat
            </p>
          </div>
          
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Assistance</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Get hints or full solutions from our math AI when you're stuck
            </p>
          </div>
          
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Team Solving</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Split into teams for competitive problem solving
            </p>
          </div>
          
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">XP & Badges</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Earn rewards and track your progress on the leaderboard
            </p>
          </div>
          
          <div className="feature-card p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Save className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Save & Share</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your work as images or PDFs to review later
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}

      {showJoinModal && (
        <JoinRoomModal 
          isOpen={showJoinModal} 
          onClose={() => setShowJoinModal(false)} 
        />
      )}
    </div>
  );
};

const SolveTogetherRoom = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top bar with problem title, timer and help button */}
      <ProblemPanel />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with chat and participants */}
        <div className="w-80 border-r border-border h-full hidden md:block">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="participants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col">
              <CollaborativeChat />
            </TabsContent>
            <TabsContent value="participants" className="flex-1 overflow-hidden flex flex-col">
              <ParticipantsList />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Main whiteboard area */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="flex-1 relative">
            <CollaborativeWhiteboard />
          </div>
          
          {/* Bottom tools panel */}
          <ToolsPanel />
        </div>
        
        {/* Right sidebar for leaderboard/game features */}
        <div className="w-64 border-l border-border h-full hidden lg:block">
          <LeaderboardPanel />
        </div>
      </div>
    </div>
  );
};

const SolveTogether = () => {
  return (
    <RoomProvider>
      <RoomContext.Consumer>
        {({ roomCode }) => (
          roomCode ? <SolveTogetherRoom /> : <SolveTogetherLanding />
        )}
      </RoomContext.Consumer>
    </RoomProvider>
  );
};

export default SolveTogether;
