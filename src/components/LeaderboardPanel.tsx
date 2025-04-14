
import React from "react";
import { useRoom } from "@/contexts/RoomContext";
import { Button } from "@/components/ui/button";
import { Award, Medal, Trophy, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  badges: { name: string; icon: string }[];
  rank: number;
}

export const LeaderboardPanel: React.FC = () => {
  const { participants, teamMode, toggleTeamMode } = useRoom();
  
  // Generate mockup leaderboard data based on participants
  const leaderboardData: LeaderboardEntry[] = participants
    .filter(p => p.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p, index) => ({
      userId: p.id,
      userName: p.name,
      score: p.score || 0,
      badges: [
        ...(index === 0 ? [{ name: "Top Contributor", icon: "🏆" }] : []),
        ...(p.role === "host" ? [{ name: "Host", icon: "👑" }] : []),
        ...(p.role === "co-host" ? [{ name: "Co-host", icon: "⭐" }] : []),
        { name: "Math Wizard", icon: "🧙" },
      ],
      rank: index + 1
    }));
  
  // Team stats if team mode is enabled
  const teamStats = teamMode ? {
    A: {
      score: participants
        .filter(p => p.team === "A")
        .reduce((sum, p) => sum + (p.score || 0), 0),
      members: participants.filter(p => p.team === "A").length
    },
    B: {
      score: participants
        .filter(p => p.team === "B")
        .reduce((sum, p) => sum + (p.score || 0), 0),
      members: participants.filter(p => p.team === "B").length
    }
  } : null;
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Leaderboard
        </h3>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="team-mode" className="text-xs cursor-pointer">Team Mode</Label>
          <Switch id="team-mode" checked={teamMode} onCheckedChange={toggleTeamMode} />
        </div>
      </div>
      
      {teamMode && teamStats && (
        <div className="p-3 border-b">
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg p-2 ${
              teamStats.A.score > teamStats.B.score 
                ? "bg-primary/20 border border-primary/30" 
                : "bg-secondary"
            }`}>
              <h4 className="text-sm font-medium">Team A</h4>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">{teamStats.A.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span className="text-xs font-medium">{teamStats.A.score} pts</span>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg p-2 ${
              teamStats.B.score > teamStats.A.score 
                ? "bg-primary/20 border border-primary/30" 
                : "bg-secondary"
            }`}>
              <h4 className="text-sm font-medium">Team B</h4>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">{teamStats.B.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span className="text-xs font-medium">{teamStats.B.score} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          <h4 className="text-sm font-medium mb-3">Individual Rankings</h4>
          <div className="space-y-3">
            {leaderboardData.map((entry) => (
              <div 
                key={entry.userId} 
                className={`rounded-lg p-3 ${
                  entry.rank === 1 
                    ? "bg-primary/20 border border-primary/30" 
                    : "bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`
                      h-7 w-7 rounded-full flex items-center justify-center
                      ${entry.rank === 1 ? "bg-yellow-500" : 
                        entry.rank === 2 ? "bg-zinc-400" : 
                        entry.rank === 3 ? "bg-amber-600" : "bg-zinc-200"}
                      ${entry.rank <= 3 ? "text-white" : "text-zinc-700"}
                      font-medium text-sm
                    `}>
                      {entry.rank}
                    </div>
                    <span className="font-medium">{entry.userName}</span>
                    
                    {entry.userId === "user-123" && (
                      <Badge variant="outline" className="text-xs py-0 h-5">You</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">{entry.score}</span>
                  </div>
                </div>
                
                {entry.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.badges.map((badge, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs py-0 h-5"
                      >
                        {badge.icon} {badge.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
