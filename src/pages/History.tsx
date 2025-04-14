
import { useState } from "react";
import { useHistory, HistoryItem } from "@/contexts/HistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const History = () => {
  const { history, loading, clearHistory } = useHistory();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter history items based on search query
  const filteredHistory = history.filter(item => 
    item.problem.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.solution.solution.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group history items by day
  const groupedHistory: Record<string, HistoryItem[]> = {};
  
  filteredHistory.forEach(item => {
    const date = new Date(item.timestamp);
    const dateString = date.toLocaleDateString();
    
    if (!groupedHistory[dateString]) {
      groupedHistory[dateString] = [];
    }
    
    groupedHistory[dateString].push(item);
  });
  
  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">History</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your solution history.
          </p>
          <Link to="/">
            <Button>Back to Solver</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">History</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Solution History</h1>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>
      
      {history.length > 0 ? (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your solution history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filteredHistory.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-4">{date}</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <Card key={item.id} className="history-item">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex justify-between">
                            <span className="truncate">{item.problem.problem}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </span>
                          </CardTitle>
                          <CardDescription className="truncate">
                            {item.solution.solution}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex justify-end">
                          <Link to="/">
                            <Button variant="ghost" size="sm">View Solution</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No matching results found.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">No History Yet</h2>
          <p className="text-muted-foreground mb-6">
            Your solved math problems will appear here.
          </p>
          <Link to="/">
            <Button>Solve a Problem</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default History;
