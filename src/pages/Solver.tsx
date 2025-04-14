
import { useState } from "react";
import MathInput from "@/components/MathInput";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "@/lib/groq-api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    setProblem(mathProblem);
    setSolution(null);
    
    try {
      const result = await solveMathProblem(mathProblem);
      
      // Format the solution to be more readable in plain English
      if (result) {
        // Make sure it starts with "A classic!" introduction
        if (!result.solution.includes("A classic!")) {
          result.solution = `A classic! The solution to this problem is quite simple:\n\n${result.solution}`;
        }
        
        // Replace any LaTeX notation with plain text
        result.solution = result.solution
          .replace(/\\\$/g, "")
          .replace(/\$\$(.*?)\$\$/g, "$1")
          .replace(/\$(.*?)\$/g, "$1")
          .replace(/\\boxed\{(.*?)\}/g, "【$1】");
        
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
      }
      
      setSolution(result);
      
      // Save to history if user is authenticated
      if (isAuthenticated && user) {
        try {
          const { error } = await supabase.from('math_history').insert({
            user_id: user.id,
            problem: mathProblem.problem,
            problem_type: mathProblem.type,
            solution: result.solution,
            explanation: result.explanation || "",
            steps: result.steps || [],
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
          <div className="mt-4 p-3 bg-primary/5 rounded-lg inline-flex items-center">
            <LogIn className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm">
              <Link to="/profile" className="font-medium text-primary hover:underline">Sign in</Link>
              {" "}to save your solutions and access history
            </span>
          </div>
        )}
      </div>
      
      <MathInput onSubmit={handleSubmit} isLoading={loading} />
      
      {(problem || loading) && (
        <>
          <Separator />
          <MathOutput problem={problem} solution={solution} loading={loading} />
        </>
      )}
    </div>
  );
};

export default Solver;
