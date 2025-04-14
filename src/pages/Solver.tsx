
import { useState } from "react";
import MathInput from "@/components/MathInput";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "@/lib/groq-api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, LogIn, Lightbulb, ScrollText, Sparkles, Brain, BookMarked, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModeToggle } from "@/components/ModeToggle";

const SmartFeature = ({ 
  id, 
  title, 
  checked, 
  onChange, 
  description 
}: { 
  id: string; 
  title: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  description: string 
}) => (
  <div className="flex items-center justify-between space-x-2 py-2">
    <div className="flex items-center space-x-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {title}
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help">
              ?
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
);

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestVisualization, setRequestVisualization] = useState(true);
  const [requestHints, setRequestHints] = useState(true);
  const [autoDetectTopic, setAutoDetectTopic] = useState(true);
  const [symbolicEngine, setSymbolicEngine] = useState(true);
  const [latexRendering, setLatexRendering] = useState(true);
  const [conceptTagging, setConceptTagging] = useState(true);
  const [practiceMode, setPracticeMode] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    
    // Add AI feature preferences to the problem
    const enhancedProblem = {
      ...mathProblem,
      requestVisualization,
      requestHints,
      autoDetectTopic,
      symbolicEngine,
      latexRendering,
      conceptTagging,
      practiceMode
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container py-8 space-y-8 px-4 sm:px-6">
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Math Wizard
          </h1>
          <p className="text-muted-foreground mt-2">
            Solve any math problem with step-by-step explanations
          </p>
          
          {!isAuthenticated && (
            <div className="mt-4 p-4 bg-card border rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 shadow-sm">
              <div className="flex items-center">
                <LogIn className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">
                  Sign in to save your solutions and access premium features
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500 hover:text-white transition-all duration-300">
                <Link to="/app/profile">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-sm h-fit sticky top-4">
              <CardContent className="p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-semibold">Smart AI Features</h3>
                </div>
                <div className="space-y-1">
                  <SmartFeature 
                    id="visualization" 
                    title="Graph & Visualization" 
                    checked={requestVisualization}
                    onChange={setRequestVisualization}
                    description="Plot graphs and visualize mathematical concepts"
                  />
                  <SmartFeature 
                    id="hints" 
                    title="Hint System" 
                    checked={requestHints}
                    onChange={setRequestHints}
                    description="Get step-by-step hints before seeing the full solution"
                  />
                  <SmartFeature 
                    id="topic" 
                    title="Auto Topic Detection" 
                    checked={autoDetectTopic}
                    onChange={setAutoDetectTopic}
                    description="Automatically identify the math topic to provide more accurate solutions"
                  />
                  <SmartFeature 
                    id="symbolic" 
                    title="Symbolic Engine" 
                    checked={symbolicEngine}
                    onChange={setSymbolicEngine}
                    description="Use a symbolic math engine for precise algebraic calculations"
                  />
                  <SmartFeature 
                    id="latex" 
                    title="LaTeX Rendering" 
                    checked={latexRendering}
                    onChange={setLatexRendering}
                    description="Display mathematical equations in beautiful LaTeX format"
                  />
                  <SmartFeature 
                    id="concepts" 
                    title="Concept Tagging" 
                    checked={conceptTagging}
                    onChange={setConceptTagging}
                    description="Identify key mathematical concepts for better understanding"
                  />
                  <SmartFeature 
                    id="practice" 
                    title="Practice Mode" 
                    checked={practiceMode}
                    onChange={setPracticeMode}
                    description="Generate similar practice problems for learning"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-9 order-1 lg:order-2 space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <MathInput onSubmit={handleSubmit} isLoading={loading} />
              </CardContent>
            </Card>
            
            {(problem || loading) && (
              <>
                <Separator />
                <MathOutput problem={problem} solution={solution} loading={loading} />
              </>
            )}
            
            {!problem && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-3">
                      <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-3">
                        <Brain className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Smart Topic Detection</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Our system automatically identifies whether your problem is algebra, calculus, or another topic.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-950/30 dark:to-indigo-950/30 border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-3">
                      <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mr-3">
                        <BookOpen className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Step-by-Step Learning</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get detailed explanations and hints to help you understand the solution process.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-3">
                      <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-3">
                        <Calculator className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Multiple Input Methods</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Type, speak, draw, or upload images of your math problems for quick solutions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-950/30 dark:to-indigo-950/30 border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-3">
                      <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mr-3">
                        <BookMarked className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Practice Mode</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Generate similar problems to practice and master mathematical concepts.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solver;
