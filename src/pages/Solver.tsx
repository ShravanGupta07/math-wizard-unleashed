
import { useState } from "react";
import MathInput from "@/components/MathInput";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "@/lib/groq-api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Lightbulb, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestVisualization, setRequestVisualization] = useState(true);
  const [requestHints, setRequestHints] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    
    // Add visualization and hints preferences to the problem
    const enhancedProblem = {
      ...mathProblem,
      requestVisualization,
      requestHints
    };
    
    setProblem(enhancedProblem);
    setSolution(null);
    
    try {
      const result = await solveMathProblem(enhancedProblem);
      
      // Additional formatting to ensure no LaTeX remains and everything is in plain English
      if (result) {
        // Make sure it starts with "A classic!" introduction
        if (!result.solution.includes("A classic!")) {
          result.solution = `A classic! Here's the solution to your problem:\n\n${result.solution}`;
        }
        
        // Additional cleanup for any remaining LaTeX
        result.solution = result.solution
          .replace(/\\\$/g, "")
          .replace(/\$\$(.*?)\$\$/g, "$1")
          .replace(/\$(.*?)\$/g, "$1")
          .replace(/\\boxed\{(.*?)\}/g, "【$1】")
          .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
          .replace(/\\sqrt\{(.*?)\}/g, "sqrt($1)");
        
        // Try to identify the final answer and box it if not already boxed
        if (!result.solution.includes("【")) {
          const numericMatch = result.solution.match(/=\s*([\d\.\-]+)/);
          if (numericMatch && numericMatch[1]) {
            result.solution = result.solution.replace(
              numericMatch[0],
              `= 【${numericMatch[1]}】`
            );
          }
        }
        
        // Ensure steps are also properly formatted
        if (result.steps && Array.isArray(result.steps)) {
          result.steps = result.steps.map(step => {
            return step
              .replace(/\\\$/g, "")
              .replace(/\$\$(.*?)\$\$/g, "$1")
              .replace(/\$(.*?)\$/g, "$1")
              .replace(/\\boxed\{(.*?)\}/g, "【$1】")
              .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
              .replace(/\\sqrt\{(.*?)\}/g, "sqrt($1)");
          });
        }
      }
      
      setSolution(result);
      
      // Save to history if user is authenticated
      if (isAuthenticated && user) {
        try {
          // Let's prepare the content for storage - avoid storing the actual content from image/drawing/voice inputs
          // Instead, we'll just store the problem type
          
          const { error } = await supabase.from('math_history').insert({
            user_id: user.id,
            problem: enhancedProblem.problem,
            problem_type: enhancedProblem.type,
            solution: result.solution,
            explanation: result.explanation || "",
            steps: result.steps || [],
            topic: result.topic || "General Mathematics",
            hints: result.hints || [],
            latex: result.latex || ""
          });
          
          if (error) {
            console.error("Error saving to history:", error);
          }
        } catch (err) {
          console.error("Failed to save to history:", err);
        }
      }
    } catch (error) {
      console.error("Error solving problem:", error);
      toast.error("Failed to solve the problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Math Wizard</h1>
        <p className="text-muted-foreground mt-2">
          Solve any math problem with step-by-step explanations
        </p>
        
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center">
              <LogIn className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm">
                Sign in to save your solutions and access premium features
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/profile">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-5">
        <div className="flex flex-wrap items-center justify-end gap-4 px-1">
          <div className="flex items-center space-x-2">
            <Switch 
              id="visualization" 
              checked={requestVisualization}
              onCheckedChange={setRequestVisualization}
            />
            <Label htmlFor="visualization" className="text-sm cursor-pointer">
              Generate visualizations
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="hints" 
              checked={requestHints}
              onCheckedChange={setRequestHints}
            />
            <Label htmlFor="hints" className="text-sm cursor-pointer">
              Include hints
            </Label>
          </div>
        </div>
        
        <MathInput onSubmit={handleSubmit} isLoading={loading} />
      </div>
      
      {(problem || loading) && (
        <>
          <Separator />
          <MathOutput problem={problem} solution={solution} loading={loading} />
        </>
      )}
      
      {!problem && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-4 border rounded-lg bg-muted/10">
            <div className="flex items-start mb-2">
              <Lightbulb className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <h3 className="font-medium">Solving with Steps</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Each solution includes a detailed step-by-step explanation, perfect for learning how to solve similar problems.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/10">
            <div className="flex items-start mb-2">
              <ScrollText className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
              <h3 className="font-medium">Topic Detection</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Our system automatically detects the math topic of your problem to provide more accurate, subject-specific solutions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solver;
