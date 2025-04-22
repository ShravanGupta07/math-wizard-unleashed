import React, { useEffect, useState, useMemo, useCallback } from "react";
// Remove direct import of recharts components and use dynamic loading instead
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useTheme } from "./theme-provider";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Types for recharts components that will be loaded dynamically
declare global {
  interface Window {
    Recharts: any;
  }
}

// Define placeholder components that will be replaced with actual recharts components
const Placeholder = ({ children }: { children?: React.ReactNode }) => {
  return <div className="flex items-center justify-center h-full text-muted-foreground">Loading chart components...</div>;
};

// Declare recharts components with default placeholders
let ResponsiveContainer = Placeholder as any;
let PieChart = Placeholder as any;
let Pie = Placeholder as any;
let BarChart = Placeholder as any;
let Bar = Placeholder as any;
let XAxis = Placeholder as any;
let YAxis = Placeholder as any;
let CartesianGrid = Placeholder as any;
let Legend = Placeholder as any;
let Line = Placeholder as any;
let LineChart = Placeholder as any;
let Cell = Placeholder as any;
let Tooltip = Placeholder as any;

interface QueryEvent {
  id: string;
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
}

interface MathQuery {
  id: string;
  topic: string;
  latex: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'connection' | 'active_users' | 'query_event' | 'initial_events' | 'query';
  id?: string;
  userId?: string;
  topic?: string;
  latex?: string;
  formulaType?: string;
  data?: any;
}

interface DashboardStats {
  activeUsers: number;
  totalQueries: number;
  uniqueFormulas: Set<string>;
  topics: Set<string>;
}

// Modern color palette with better contrast and theme support
const CHART_COLORS = {
  primary: {
    light: [
      'hsl(252, 87%, 53%)',
      'hsl(252, 87%, 63%)',
      'hsl(252, 87%, 73%)',
    ],
    dark: [
      'hsl(252, 87%, 73%)',
      'hsl(252, 87%, 83%)',
      'hsl(252, 87%, 93%)',
    ]
  },
  accent: {
    light: [
      'hsl(262, 83%, 58%)',
      'hsl(262, 83%, 68%)',
      'hsl(262, 83%, 78%)',
    ],
    dark: [
      'hsl(262, 83%, 78%)',
      'hsl(262, 83%, 88%)',
      'hsl(262, 83%, 98%)',
    ]
  },
  muted: {
    light: [
      'hsl(215, 16%, 47%)',
      'hsl(215, 16%, 57%)',
      'hsl(215, 16%, 67%)',
    ],
    dark: [
      'hsl(215, 16%, 67%)',
      'hsl(215, 16%, 77%)',
      'hsl(215, 16%, 87%)',
    ]
  }
};

const CELL_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83A6ED'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { 
  cx?: number; 
  cy?: number; 
  midAngle?: number; 
  innerRadius?: number; 
  outerRadius?: number; 
  percent?: number;
  name?: string;
}) => {
  if (!percent || percent < 0.05) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = (innerRadius || 0) + ((outerRadius || 0) - (innerRadius || 0)) * 0.5;
  const x = (cx || 0) + radius * Math.cos(-midAngle! * RADIAN);
  const y = (cy || 0) + radius * Math.sin(-midAngle! * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > (cx || 0) ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {name && name.length > 10 ? `${name.slice(0, 10)}...` : name}
      {` (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export const Dashboard = () => {
  const { activeUsers, connectionStatus, sendMessage, isConnected } = useWebSocket();
  const [data, setData] = useState<QueryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<MathQuery[]>([]);
  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Add state for tracking Recharts loading
  const [rechartsLoaded, setRechartsLoaded] = useState(false);
  
  // State for collaborative room
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("userName") || "");
  const [roomCode, setRoomCode] = useState<string>("");
  
  // Get current theme colors
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const colors = useMemo(() => ({
    primary: CHART_COLORS.primary[currentTheme as 'light' | 'dark'],
    accent: CHART_COLORS.accent[currentTheme as 'light' | 'dark'],
    muted: CHART_COLORS.muted[currentTheme as 'light' | 'dark']
  }), [currentTheme]);

  // Track the last processed event at component level
  const lastEventRef = React.useRef<QueryEvent | null>(null);

  const processEvent = useCallback((event: QueryEvent) => {
    setData(prevEvents => {
      // Check if we've already processed this event
      if (event.id === lastEventRef.current?.id) {
        return prevEvents;
      }

      // Update last event reference
      lastEventRef.current = event;
      
      // Add new event to the beginning of the array
      const newEvents = [event, ...prevEvents];
      
      // Keep only the last 100 events to prevent memory issues
      return newEvents.slice(0, 100);
    });
  }, []);

  // Dynamic import of Recharts
  useEffect(() => {
    let mounted = true;
    
    // Load Recharts from CDN
    if (!window.Recharts && typeof document !== 'undefined') {
      // Create script element to load Recharts from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/recharts@2.9.3/umd/Recharts.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Recharts && mounted) {
          // Assign components from window.Recharts
          ResponsiveContainer = window.Recharts.ResponsiveContainer;
          PieChart = window.Recharts.PieChart;
          Pie = window.Recharts.Pie;
          BarChart = window.Recharts.BarChart;
          Bar = window.Recharts.Bar;
          XAxis = window.Recharts.XAxis;
          YAxis = window.Recharts.YAxis;
          CartesianGrid = window.Recharts.CartesianGrid;
          Legend = window.Recharts.Legend;
          LineChart = window.Recharts.LineChart;
          Line = window.Recharts.Line;
          Cell = window.Recharts.Cell;
          Tooltip = window.Recharts.Tooltip;
          
          // Force re-render
          setRechartsLoaded(true);
          setData((prevData: QueryEvent[]) => [...prevData]);
        }
      };
      
      // Append script to document
      document.head.appendChild(script);
    } else if (window.Recharts) {
      // Recharts already loaded
      ResponsiveContainer = window.Recharts.ResponsiveContainer;
      PieChart = window.Recharts.PieChart;
      Pie = window.Recharts.Pie;
      BarChart = window.Recharts.BarChart;
      Bar = window.Recharts.Bar;
      XAxis = window.Recharts.XAxis;
      YAxis = window.Recharts.YAxis;
      CartesianGrid = window.Recharts.CartesianGrid;
      Legend = window.Recharts.Legend;
      LineChart = window.Recharts.LineChart;
      Line = window.Recharts.Line;
      Cell = window.Recharts.Cell;
      Tooltip = window.Recharts.Tooltip;
      
      setRechartsLoaded(true);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    console.log('Setting up WebSocket message handler, connected:', isConnected);
    
    const handleMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message: WebSocketMessage = customEvent.detail;
      console.log('Received WebSocket message:', message);
      
      switch (message.type) {
        case 'initial_events':
          console.log('Received initial events:', message.data);
          if (Array.isArray(message.data)) {
            setData(message.data);
          }
          break;
          
        case 'query_event':
          console.log('Received query event:', message);
          if (message.data || (message.id && message.latex)) {
            const eventData = message.data || message;
            const newEvent: QueryEvent = {
              id: eventData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: eventData.userId || 'anonymous',
              topic: eventData.topic || 'unknown',
              latex: eventData.latex || '',
              formulaType: eventData.formulaType || 'unknown',
              timestamp: eventData.timestamp || Date.now()
            };
            
            console.log('Processing new event:', newEvent);
            setData(prevEvents => {
              // Check if we've already processed this event
              if (prevEvents.some(e => e.id === newEvent.id)) {
                console.log('Duplicate event, skipping');
                return prevEvents;
              }
              
              // Add new event to the beginning and keep last 100
              const updatedEvents = [newEvent, ...prevEvents].slice(0, 100);
              console.log('Updated events count:', updatedEvents.length);
              return updatedEvents;
            });
            
            setRecentQueries(prev => {
              const newQuery: MathQuery = {
                id: newEvent.id,
                topic: newEvent.topic,
                latex: newEvent.latex,
                timestamp: newEvent.timestamp
              };
              
              if (prev.some(q => q.id === newQuery.id)) {
                return prev;
              }
              return [newQuery, ...prev].slice(0, 5);
            });
          }
          break;
      }
    };

    window.addEventListener('websocket-message', handleMessage);
    
    // Request initial data when component mounts
    if (isConnected) {
      console.log('Requesting initial events...');
      sendMessage({ type: 'get_initial_events' });
    }

    return () => {
      console.log('Cleaning up WebSocket message handler');
      window.removeEventListener('websocket-message', handleMessage);
    };
  }, [isConnected, sendMessage]);

  // Force re-render of charts when data changes
  const chartKey = useMemo(() => data?.length || 0, [data]);

  // Calculate statistics from data
  const { statistics, chartData } = useMemo(() => {
    console.log('Calculating statistics from data:', data?.length || 0, 'events');
    
    if (!data || data.length === 0) {
      return {
        statistics: {
          uniqueFormulas: 0,
          uniqueTopics: 0,
          uniqueFormulaTypes: 0
        },
        chartData: {
          formulaTypes: [],
          topics: [],
          complexity: []
        }
      };
    }
    
    const uniqueFormulas = new Set(data.map(event => event.latex));
    const uniqueTopics = new Set(data.map(event => event.topic));
    const uniqueFormulaTypes = new Set(data.map(event => event.formulaType));
    
    // Calculate complexity distribution
    const complexityGroups = data.reduce((acc, event) => {
      let complexity = 'Simple';
      const latex = event.latex;
      
      if (latex.includes('\\begin{') || latex.includes('\\end{') || 
          latex.includes('\\frac') || latex.includes('\\int')) {
        complexity = 'Complex';
      } else if (latex.includes('\\') || latex.length > 20) {
        complexity = 'Medium';
      }
      
      acc[complexity] = (acc[complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexityData = Object.entries(complexityGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Sort formula types by frequency
    const formulaTypeData = Array.from(uniqueFormulaTypes)
      .map(type => ({
        name: type,
        value: data.filter(event => event.formulaType === type).length
      }))
      .sort((a, b) => b.value - a.value);

    // Sort topics by frequency
    const topicData = Array.from(uniqueTopics)
      .map(topic => ({
        name: topic,
        value: data.filter(event => event.topic === topic).length
      }))
      .sort((a, b) => b.value - a.value);
    
    return {
      statistics: {
        uniqueFormulas: uniqueFormulas.size,
        uniqueTopics: uniqueTopics.size,
        uniqueFormulaTypes: uniqueFormulaTypes.size
      },
      chartData: {
        formulaTypes: formulaTypeData,
        topics: topicData,
        complexity: complexityData
      }
    };
  }, [data]);

  // Calculate time-based data
  const timeBasedData = useMemo(() => {
    const now = Date.now();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now - (23 - i) * 3600000);
      return {
        hour: hour.getHours(),
        queries: 0,
        users: new Set<string>()
      };
    });

    if (!data || data.length === 0) {
      return last24Hours.map(hour => ({
        hour: hour.hour,
        queries: 0,
        users: 0
      }));
    }

    data.forEach(event => {
      const eventHour = new Date(event.timestamp).getHours();
      const hourData = last24Hours.find(h => h.hour === eventHour);
      if (hourData) {
        hourData.queries++;
        hourData.users.add(event.userId);
      }
    });

    return last24Hours.map(hour => ({
      hour: `${hour.hour}:00`,
      queries: hour.queries,
      users: hour.users.size
    }));
  }, [data]);

  // Calculate trending topics
  const trendingTopics = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    
    const topicCounts = data.reduce((acc, cur) => {
      acc[cur.topic] = (acc[cur.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [data]);

  const [tab, setTab] = useState('analytics');
  
  // Add a simple navigation function using React Router
  const navigateToRoom = (roomCode: string, isNew: boolean, name: string) => {
    // Store userName
    localStorage.setItem("userName", name);
    
    // Clear any previous room code
    localStorage.removeItem('collaboration_room_code');
    
    // Navigate to the room
    const url = `/collaboration/${roomCode}?isNew=${isNew}&name=${encodeURIComponent(name)}`;
    navigate(url);
  };

  const createRoom = () => {
    // Save user name
    if (!userName.trim()) {
      // Generate random name if empty
      const defaultName = `User_${Math.floor(Math.random() * 1000)}`;
      setUserName(defaultName);
      localStorage.setItem("userName", defaultName);
    } else {
      localStorage.setItem("userName", userName);
    }
    
    // Generate a random room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Navigate to the collaboration room
    navigateToRoom(newRoomCode, true, userName || `User_${Math.floor(Math.random() * 1000)}`);
  };
  
  const joinRoom = () => {
    if (!roomCode.trim()) {
      toast({
        title: "Room Code Required",
        description: "Please enter a room code to join a room.",
        variant: "destructive"
      });
      return;
    }
    
    // Save user name
    if (!userName.trim()) {
      // Generate random name if empty
      const defaultName = `User_${Math.floor(Math.random() * 1000)}`;
      setUserName(defaultName);
      localStorage.setItem("userName", defaultName);
    } else {
      localStorage.setItem("userName", userName);
    }
    
    // Navigate to the collaboration room
    navigateToRoom(roomCode, false, userName || `User_${Math.floor(Math.random() * 1000)}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Connection Status */}
      <Alert variant={isConnected ? "default" : "destructive"} className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Status</AlertTitle>
        <AlertDescription>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Connected to server</span>
              <span className="text-muted-foreground">
                ({activeUsers} active users)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>Disconnected from server</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Formulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueFormulas}</div>
              <p className="text-xs text-muted-foreground">
                Total unique mathematical expressions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueTopics}</div>
              <p className="text-xs text-muted-foreground">
                Different mathematical topics
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-muted/5 to-muted/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formula Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueFormulaTypes}</div>
              <p className="text-xs text-muted-foreground">
                Different types of formulas
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle>Formula Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {chartData.formulaTypes && chartData.formulaTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" key={`formula-types-${chartKey}`}>
                    <PieChart>
                      <Pie
                        data={chartData.formulaTypes || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="90%"
                        innerRadius="40%"
                        label={renderCustomizedLabel}
                        labelLine={false}
                        animationBegin={0}
                        animationDuration={750}
                        animationEasing="ease-out"
                      >
                        {chartData.formulaTypes && chartData.formulaTypes.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors.primary && colors.primary.length > 0 ? colors.primary[index % colors.primary.length] : '#888888'}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }: { active?: boolean, payload?: Array<any> }) => {
                          if (active && payload && payload.length && payload[0] && payload[0].payload) {
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-2 w-2 rounded-full" 
                                      style={{ backgroundColor: payload[0].payload.fill }}
                                    />
                                    <span className="font-medium">
                                      {payload[0]?.name || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="text-right text-sm">
                                    {payload[0]?.value || 0} queries
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        content={({ payload }: { payload?: Array<{ color: string; value: string; name?: string; percent?: number }> }) => (
                          <div className="flex flex-wrap justify-center gap-4 pt-4">
                            {payload?.map((entry, index) => (
                              <div key={`legend-${index}`} className="flex items-center gap-2">
                                <div 
                                  className="h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader>
              <CardTitle>Topics Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {chartData.topics && chartData.topics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" key={`topics-${chartKey}`}>
                    <BarChart data={chartData.topics || []}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="hsl(var(--border))" 
                        opacity={0.3}
                      />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                        content={({ active, payload }: { active?: boolean, payload?: Array<any> }) => {
                          if (active && payload && payload.length && payload[0] && payload[0].payload) {
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-2 w-2 rounded-full" 
                                      style={{ backgroundColor: payload[0].payload.fill }}
                                    />
                                    <span className="font-medium">
                                      {payload[0]?.name || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="text-right text-sm">
                                    {payload[0]?.value || 0} queries
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        animationBegin={0}
                        animationDuration={750}
                        animationEasing="ease-out"
                      >
                        {chartData.topics && chartData.topics.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors.accent && colors.accent.length > 0 ? colors.accent[index % colors.accent.length] : '#888888'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Complexity Distribution */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-muted/5 to-muted/10">
          <CardHeader>
            <CardTitle>Query Complexity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData.complexity && chartData.complexity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" key={`complexity-${chartKey}`}>
                  <PieChart>
                    <Pie
                      data={chartData.complexity || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="90%"
                      innerRadius="40%"
                      label={renderCustomizedLabel}
                      labelLine={false}
                      animationBegin={0}
                      animationDuration={750}
                      animationEasing="ease-out"
                    >
                      {chartData.complexity && chartData.complexity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={colors.muted && colors.muted.length > 0 ? colors.muted[index % colors.muted.length] : '#888888'}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }: { active?: boolean, payload?: Array<any> }) => {
                        if (active && payload && payload.length && payload[0] && payload[0].payload) {
                          return (
                            <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: payload[0].payload.fill }}
                                  />
                                  <span className="font-medium">
                                    {payload[0]?.name || 'Unknown'}
                                  </span>
                                </div>
                                <div className="text-right text-sm">
                                  {payload[0]?.value || 0} queries
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      content={({ payload }: { payload?: Array<{ color: string; value: string; name?: string; percent?: number }> }) => (
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                          {payload?.map((entry, index) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        
      </motion.div>
    </div>
  );
};

export default Dashboard; 