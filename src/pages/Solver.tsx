
import { useState } from "react";
import MathInput from "@/components/MathInput";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "@/lib/groq-api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    setProblem(mathProblem);
    setSolution(null);
    
    try {
      const result = await solveMathProblem(mathProblem);
      
      // Format solution to have boxed answers and LaTeX if it doesn't already
      if (result && !result.solution.includes("$$")) {
        // Add LaTeX delimiters if not present
        result.solution = `A classic! The solution to this problem is quite simple:\n\n$$${result.solution}$$`;
        
        // Try to identify the final answer and box it
        const numericMatch = result.solution.match(/=\s*([\d\.\-]+)/);
        if (numericMatch && numericMatch[1]) {
          result.solution = result.solution.replace(
            numericMatch[0],
            `= \\boxed{${numericMatch[1]}}`
          );
        }
      }
      
      setSolution(result);
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
