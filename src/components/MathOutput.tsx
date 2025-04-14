
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/contexts/HistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { MathProblem, MathSolution } from "@/lib/groq-api";
import { Clock, Copy, Download, ThumbsUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Improved LaTeX rendering component
const MathJax = ({ latex, className = "" }: { latex: string, className?: string }) => {
  // Process LaTeX to properly display it in the UI
  const processedLatex = latex
    .replace(/\$\$(.*?)\$\$/g, "$1") // Remove $$ delimiters
    .replace(/\$(.*?)\$/g, "$1")     // Remove $ delimiters
    .replace(/\\boxed\{(.*?)\}/g, "【$1】"); // Replace \boxed with visible brackets

  return (
    <div className={`katex-render bg-muted/30 p-4 rounded-md ${className}`}>
      <pre className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">{processedLatex}</pre>
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
  
  // Fix the infinite loop by adding solutionSaved to prevent multiple saves
  useEffect(() => {
    if (solution && !loading && problem && !solutionSaved) {
      addToHistory(problem, solution);
      setSolutionSaved(true);
      
      // Save solution to Supabase if user is authenticated
      if (isAuthenticated && user) {
        saveSolutionToSupabase(problem, solution);
      }
      
      if (solution.visualization) {
        setGraphData(solution.visualization);
      } else if (problem.problem.toLowerCase().includes("graph") || 
                problem.problem.toLowerCase().includes("plot") ||
                problem.problem.toLowerCase().includes("equation")) {
        const demoData = Array.from({ length: 20 }, (_, i) => ({
          x: i - 10,
          y: Math.pow(i - 10, 2) / 10,
        }));
        setGraphData(demoData);
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
          visualization: solution.visualization || null
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
    }
  }, [problem]);
  
  // Improved formatting for solution steps
  const formatSolutionSteps = (solution: MathSolution) => {
    if (solution.steps && solution.steps.length > 0) {
      return solution.steps;
    }
    
    // Split by common step delimiters (numbered steps or blank lines)
    const explanationSteps = solution.explanation
      .split(/(\d+\.\s+|\n\n)/)
      .filter(step => step.trim().length > 0 && !step.match(/^\d+\.\s*$/)) // Remove empty steps and standalone numbers
      .map(step => step.trim());
    
    return explanationSteps.length > 0 ? explanationSteps : [solution.explanation];
  };

  // Format the solution to include a friendly intro and boxed result
  const formatSolution = (solution: MathSolution): string => {
    if (!solution.solution) return "";
    
    // Check if the solution already has the desired format
    if (solution.solution.includes("A classic!") || 
        solution.solution.includes("$$") ||
        solution.solution.includes("\\boxed")) {
      return solution.solution;
    }
    
    // Add the desired format if not present
    let formattedSolution = `A classic! The solution to this problem is quite simple: $$${solution.solution}$$`;
    
    // If there's a specific numerical answer, try to box it
    const numericAnswer = solution.solution.match(/[=]\s*([\d\.\-]+)/);
    if (numericAnswer && numericAnswer[1]) {
      formattedSolution = formattedSolution.replace(
        numericAnswer[0], 
        `= \\boxed{${numericAnswer[1]}}`
      );
    }
    
    return formattedSolution;
  };

  const handleCopy = () => {
    if (!solution) return;
    
    const textToCopy = activeTab === "solution" 
      ? solution.solution
      : activeTab === "explanation" 
        ? solution.explanation
        : solution.latex || "";
        
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  };
  
  const handleDownload = () => {
    if (!solution) return;
    
    let content = "";
    let filename = "math_solution.txt";
    
    if (activeTab === "solution") {
      content = `Problem: ${problem?.problem}\n\nSolution: ${solution.solution}`;
    } else if (activeTab === "explanation") {
      content = `Problem: ${problem?.problem}\n\nExplanation: ${solution.explanation}`;
    } else if (activeTab === "latex" && solution.latex) {
      content = solution.latex;
      filename = "math_solution.tex";
    }
    
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
          <span>Solution</span>
          <span className="text-xs bg-primary/10 text-primary-foreground px-2 py-1 rounded-full flex items-center">
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
            <TabsTrigger value="latex">LaTeX</TabsTrigger>
          </TabsList>
          
          <TabsContent value="solution" className="p-6">
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-lg font-medium mb-4 whitespace-pre-line">{formatSolution(solution)}</p>
              
              {solution?.latex && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Final Equation</h4>
                  <MathJax latex={solution.latex} className="mb-4" />
                </div>
              )}
              
              {graphData && (
                <div className="graph-container mt-6 h-[300px]">
                  <h3 className="text-sm font-medium mb-2">Graph Visualization</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="hsl(var(--primary))" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="latex" className="p-6">
            <div className="prose prose-sm max-w-none space-y-4">
              {solution?.latex ? (
                <>
                  <h4 className="text-sm font-semibold">Complete LaTeX Representation</h4>
                  <MathJax latex={solution.latex} />
                </>
              ) : (
                <p className="text-muted-foreground">
                  No LaTeX representation available for this solution.
                </p>
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
