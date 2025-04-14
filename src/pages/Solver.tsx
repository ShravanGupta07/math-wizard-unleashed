
import { useState } from "react";
import MathInput from "@/components/MathInput";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "@/lib/groq-api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    setProblem(mathProblem);
    setSolution(null);
    
    try {
      const result = await solveMathProblem(mathProblem);
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
