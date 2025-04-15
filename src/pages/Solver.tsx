import { useState } from "react";
import MathInput from "../components/MathInput";
import MathOutput from "../components/MathOutput";
import { MathProblem, MathSolution, solveMathProblem } from "../lib/groq-api";
import { Separator } from "../components/ui/separator";
import { toast } from "../components/ui/sonner";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, LogIn, Lightbulb, ScrollText, Sparkles, Brain, BookMarked, Calculator, BarChart3, ThumbsUp, Ruler, LineChart, BookText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { MathToolsDialog } from "../components/math-tools/MathToolsDialog";

const SmartFeature = ({ 
  id, 
  title, 
  checked, 
  onChange, 
  description,
  icon: Icon
}: { 
  id: string; 
  title: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  description: string;
  icon: React.ElementType;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);

const Solver = () => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestVisualization, setRequestVisualization] = useState(false);
  const [requestHints, setRequestHints] = useState(false);
  const [autoDetectTopic, setAutoDetectTopic] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [selectedTool, setSelectedTool] = useState<"unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer" | null>(null);

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    
    // Add AI feature preferences to the problem
    const enhancedProblem = {
      ...mathProblem,
      requestVisualization,
      requestHints,
      autoDetectTopic
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
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            {/* Solution Output */}
            {(problem || loading) && (
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <MathOutput problem={problem} solution={solution} loading={loading} />
              </div>
            )}

            {/* Problem Input Area */}
            <div className="bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
              <MathInput onSubmit={handleSubmit} isLoading={loading} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Smart AI Features */}
            <div className="bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Smart AI Features</h3>
                  <p className="text-sm text-white/70">Customize your solving experience</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <SmartFeature 
                  id="visualization" 
                  title="Graph & Visualization" 
                  checked={requestVisualization}
                  onChange={setRequestVisualization}
                  description="Plot graphs and visualize concepts"
                  icon={BarChart3}
                />
                <SmartFeature 
                  id="hints" 
                  title="Hint System" 
                  checked={requestHints}
                  onChange={setRequestHints}
                  description="Get step-by-step hints"
                  icon={Lightbulb}
                />
                <SmartFeature 
                  id="topic" 
                  title="Auto Topic Detection" 
                  checked={autoDetectTopic}
                  onChange={setAutoDetectTopic}
                  description="Identify math topics automatically"
                  icon={Brain}
                />
              </div>
            </div>

            {/* Math Tools */}
            <div className="bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Calculator className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Math Tools</h3>
                  <p className="text-sm text-white/70">Quick access to helpful tools</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-24 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setSelectedTool("unit-converter")}
                >
                  <Ruler className="h-6 w-6 mb-2 text-purple-400" />
                  <span className="text-sm">Unit Converter</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-24 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setSelectedTool("graphing-tool")}
                >
                  <LineChart className="h-6 w-6 mb-2 text-blue-400" />
                  <span className="text-sm">Graphing Tool</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-24 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setSelectedTool("formula-sheet")}
                >
                  <BookText className="h-6 w-6 mb-2 text-green-400" />
                  <span className="text-sm">Formula Sheet</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-24 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setSelectedTool("topic-explorer")}
                >
                  <BookOpen className="h-6 w-6 mb-2 text-yellow-400" />
                  <span className="text-sm">Topic Explorer</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedTool && (
        <MathToolsDialog
          isOpen={true}
          onClose={() => setSelectedTool(null)}
          tool={selectedTool}
        />
      )}
    </div>
  );
};

export default Solver;
