
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/contexts/HistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { MathProblem, MathSolution } from "@/lib/groq-api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from "recharts";
import { Clock, Copy, Download, ThumbsUp, Info, BookOpen, ChevronRight, Lightbulb } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import Katex from "katex";
import "katex/dist/katex.min.css";

// Enhanced rendering component for math solutions with LaTeX support
const FormattedMath = ({ text, className = "" }: { text: string, className?: string }) => {
  // Process text to highlight boxed answers with a special style and render LaTeX
  const processText = () => {
    if (!text) return { __html: "" };

    // First replace boxed answers with a special style
    let processedText = text.replace(/【(.*?)】/g, '<span class="bg-primary/20 px-2 py-1 rounded text-primary font-semibold">$1</span>');
    
    // Find all potential LaTeX expressions (both inline and display)
    const latexRegex = /\$(.*?)\$|\$\$(.*?)\$\$/g;
    let match;
    let lastIndex = 0;
    let result = "";
    
    while ((match = latexRegex.exec(processedText)) !== null) {
      // Add text before the LaTeX
      result += processedText.substring(lastIndex, match.index);
      
      // Determine if it's display or inline LaTeX
      const isDisplay = match[0].startsWith("$$");
      const latexContent = isDisplay ? match[2] : match[1];
      
      try {
        // Render LaTeX to HTML
        const html = Katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: isDisplay,
        });
        result += html;
      } catch (e) {
        // Fallback to original text if rendering fails
        result += match[0];
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    result += processedText.substring(lastIndex);
    
    return { __html: result };
  };
  
  return (
    <div className={`math-render ${className}`}>
      <div 
        className="whitespace-pre-line" 
        dangerouslySetInnerHTML={processText()}
      />
    </div>
  );
};

interface MathOutputProps {
  problem: MathProblem | null;
  solution: MathSolution | null;
  loading: boolean;
}

const MathOutput: React.FC<MathOutputProps> = ({ problem, solution, loading }) => {
  const { addToHistory } = useHistory();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("solution");
  const [graphData, setGraphData] = useState<any[] | null>(null);
  const [solutionSaved, setSolutionSaved] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [chartType, setChartType] = useState<'line' | 'scatter' | 'area'>('line');
  
  // Determine the best chart type based on the data and topic
  useEffect(() => {
    if (solution && solution.topic) {
      const topic = solution.topic.toLowerCase();
      if (topic.includes('statistic') || topic.includes('data')) {
        setChartType('scatter');
      } else if (topic.includes('calculus') && topic.includes('area')) {
        setChartType('area');
      } else {
        setChartType('line');
      }
    }
  }, [solution]);
  
  // Fix the infinite loop by adding solutionSaved to prevent multiple saves
  useEffect(() => {
    if (solution && !loading && problem && !solutionSaved) {
      addToHistory(problem, solution);
      setSolutionSaved(true);
      
      // Save solution to Supabase if user is authenticated
      if (isAuthenticated && user) {
        saveSolutionToSupabase(problem, solution);
      }
      
      // Use the plot data from the solution if available
      if (solution.plotData) {
        setGraphData(solution.plotData);
      } else if (solution.visualization) {
        setGraphData(solution.visualization);
      } else if (problem.problem.toLowerCase().includes("graph") || 
                problem.problem.toLowerCase().includes("plot") ||
                problem.problem.toLowerCase().includes("equation")) {
        // Create appropriate sample data based on the detected topic
        if (solution.topic?.toLowerCase().includes('quadratic')) {
          const demoData = Array.from({ length: 21 }, (_, i) => ({
            x: i - 10,
            y: Math.pow(i - 10, 2) / 10,
          }));
          setGraphData(demoData);
        } else if (solution.topic?.toLowerCase().includes('trigonometry')) {
          const demoData = Array.from({ length: 41 }, (_, i) => ({
            x: i * 0.2 - 4,
            y: Math.sin(i * 0.2 - 4),
          }));
          setGraphData(demoData);
        } else {
          // Default linear data
          const demoData = Array.from({ length: 21 }, (_, i) => ({
            x: i - 10,
            y: (i - 10) * 0.5,
          }));
          setGraphData(demoData);
        }
      } else {
        setGraphData(null);
      }
    }
  }, [solution, loading, problem, addToHistory, solutionSaved, isAuthenticated, user]);
  
  // Save solution to Supabase
  const saveSolutionToSupabase = async (problem: MathProblem, solution: MathSolution) => {
    try {
      const { error } = await supabase
        .from('math_history')
        .insert({
          user_id: user?.id,
          problem: problem.problem,
          problem_type: problem.type,
          solution: solution.solution,
          explanation: solution.explanation,
          latex: solution.latex,
          steps: solution.steps || [],
          topic: solution.topic || 'General Mathematics',
          hints: solution.hints || [],
          visualization: solution.visualization || solution.plotData || null
        });
        
      if (error) {
        console.error("Error saving solution to Supabase:", error);
      }
    } catch (err) {
      console.error("Failed to save solution to Supabase:", err);
    }
  };
  
  // Reset solutionSaved when problem changes
  useEffect(() => {
    if (problem) {
      setSolutionSaved(false);
      setVisibleHints(0);
    }
  }, [problem]);
  
  // Format solution steps
  const formatSolutionSteps = (solution: MathSolution) => {
    if (solution.steps && solution.steps.length > 0) {
      return solution.steps;
    }
    
    // Split by common step delimiters
    const explanationSteps = solution.explanation
      .split(/(\d+\.\s+|\n\n)/)
      .filter(step => step.trim().length > 0 && !step.match(/^\d+\.\s*$/)) 
      .map(step => step.trim());
    
    return explanationSteps.length > 0 ? explanationSteps : [solution.explanation];
  };

  const handleCopy = () => {
    if (!solution) return;
    
    const textToCopy = solution.solution;
        
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  };
  
  const handleDownload = () => {
    if (!solution) return;
    
    const content = `Problem: ${problem?.problem}\n\nSolution: ${solution.solution}`;
    const filename = "math_solution.txt";
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Solution downloaded");
  };
  
  const showNextHint = () => {
    if (solution?.hints && visibleHints < solution.hints.length) {
      setVisibleHints(prev => prev + 1);
    }
  };
  
  // Render chart based on data type and topic
  const renderChart = () => {
    if (!graphData || graphData.length === 0) return null;
    
    if (chartType === 'scatter') {
      return (
        <ScatterChart width={600} height={300} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="X" />
          <YAxis type="number" dataKey="y" name="Y" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Values" data={graphData} fill="hsl(var(--primary))" />
        </ScatterChart>
      );
    } else if (chartType === 'area') {
      return (
        <AreaChart width={600} height={300} data={graphData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="y" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
        </AreaChart>
      );
    } else {
      return (
        <LineChart width={600} height={300} data={graphData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
        </LineChart>
      );
    }
  };
  
  if (!problem && !loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-muted/30">
        <CardContent className="p-6 text-center">
          <div className="py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ThumbsUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to Solve</h3>
            <p className="text-muted-foreground">
              Enter your math problem above to get step-by-step solutions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[200px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  if (!solution) return null;
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <div className="flex flex-col">
            <span>Solution</span>
            {solution.topic && (
              <span className="text-xs font-normal text-muted-foreground mt-1">
                Topic: {solution.topic}
              </span>
            )}
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Just now
          </span>
        </CardTitle>
        <CardDescription>
          {problem?.problem}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="solution">Solution</TabsTrigger>
            <TabsTrigger value="explanation">Step-by-Step</TabsTrigger>
            <TabsTrigger value="hints" disabled={!solution.hints || solution.hints.length === 0}>
              Hints
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="solution" className="p-6">
            <div className="prose prose-sm max-w-none space-y-4">
              <div className="text-lg font-medium mb-4">
                <FormattedMath text={solution.solution} />
              </div>
              
              {graphData && (
                <div className="graph-container mt-6">
                  <h3 className="text-sm font-medium mb-2">Graph Visualization</h3>
                  <div className="h-[300px] w-full overflow-auto">
                    <ResponsiveContainer width="100%" height="100%" minWidth={600}>
                      {renderChart()}
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-end mt-2 space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setChartType('line')}
                      className={chartType === 'line' ? 'bg-muted' : ''}
                    >
                      Line
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setChartType('scatter')}
                      className={chartType === 'scatter' ? 'bg-muted' : ''}
                    >
                      Scatter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setChartType('area')}
                      className={chartType === 'area' ? 'bg-muted' : ''}
                    >
                      Area
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="explanation" className="p-6">
            <div className="prose prose-sm max-w-none">
              {solution && (
                <ol className="list-decimal pl-5 space-y-3">
                  {formatSolutionSteps(solution).map((step, index) => (
                    <li key={index} className="text-base">
                      <FormattedMath text={step} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="hints" className="p-6">
            <div className="prose prose-sm max-w-none">
              {solution.hints && solution.hints.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <Lightbulb className="h-5 w-5" />
                    <p className="font-medium">Need some guidance without the full answer?</p>
                  </div>
                  
                  <div className="space-y-3">
                    {solution.hints.slice(0, visibleHints).map((hint, index) => (
                      <div 
                        key={index} 
                        className="p-3 bg-amber-50 border border-amber-200 rounded-md"
                      >
                        <p className="font-medium text-amber-800 mb-1">Hint {index + 1}:</p>
                        <FormattedMath text={hint} />
                      </div>
                    ))}
                  </div>
                  
                  {visibleHints < solution.hints.length && (
                    <Button 
                      onClick={showNextHint} 
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Show Next Hint ({visibleHints + 1} of {solution.hints.length})
                    </Button>
                  )}
                  
                  {visibleHints === solution.hints.length && (
                    <div className="p-3 bg-muted rounded-md mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        You've seen all available hints. Check the solution for the complete answer.
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab('solution')}
                        className="mt-2"
                      >
                        View full solution <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">No Hints Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Hints aren't available for this problem. Check the step-by-step solution instead.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('explanation')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Step-by-Step
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 p-4 bg-muted/10 border-t">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MathOutput;
