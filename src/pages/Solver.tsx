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
  const [selectedTool, setSelectedTool] = useState<"unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer" | "quick-tools" | "brain-booster" | null>(null);

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
      
      if (result) {
        // Extract the final answer from the solution
        let finalAnswer = "";
        const solutionLines = result.solution.split('\n');
        
        // Look for lines containing "answer", "=", or boxed content
        for (const line of solutionLines) {
          if (
            line.toLowerCase().includes('answer:') ||
            line.includes('【') ||
            (line.includes('=') && !line.includes('equation') && !line.includes('step'))
          ) {
            finalAnswer = line.trim();
            // If it's not already boxed, box it
            if (!finalAnswer.includes('【')) {
              const match = finalAnswer.match(/[=]\s*(.+)$/);
              if (match) {
                finalAnswer = `= 【${match[1].trim()}】`;
              } else {
                finalAnswer = `【${finalAnswer}】`;
              }
            }
            break;
          }
        }

        // Ensure we have a final answer
        if (!finalAnswer) {
          // If no clear answer found, take the last non-empty line
          for (let i = solutionLines.length - 1; i >= 0; i--) {
            if (solutionLines[i].trim()) {
              finalAnswer = `【${solutionLines[i].trim()}】`;
              break;
            }
          }
        }

        // Update the solution with the extracted final answer
        result.solution = `A classic! Here's the solution:\n\n${finalAnswer}`;
        
        // Clean up any remaining LaTeX notation
        result.solution = result.solution
          .replace(/\\\$/g, "")
          .replace(/\$\$(.*?)\$\$/g, "$1")
          .replace(/\$(.*?)\$/g, "$1")
          .replace(/\\boxed\{(.*?)\}/g, "【$1】")
          .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
          .replace(/\\sqrt\{(.*?)\}/g, "sqrt($1)");
        
        // Keep steps for detailed view if needed
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
    <div className="min-h-screen bg-transparent">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-purple-300/50 dark:border-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              <div className="p-6">
                <MathInput 
                  onSubmit={handleSubmit} 
                  isLoading={loading}
                  onClear={() => {
                    setSolution(null);
                    setProblem(null);
                    setRequestVisualization(false);
                    setRequestHints(false);
                    setAutoDetectTopic(false);
                  }}
                />

                {/* Solution Output - Only show when there's a problem or loading */}
                {(problem || loading) && (
                  <>
                    <Separator className="my-6 bg-gradient-to-r from-transparent via-purple-300/30 dark:via-purple-500/20 to-transparent" />
                    <MathOutput problem={problem} solution={solution} loading={loading} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Tools & Brain Boosters */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-gray-900/90 dark:to-purple-900/40 backdrop-blur-2xl rounded-2xl border border-purple-300/50 dark:border-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-5 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 shadow-sm">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">Quick Tools & Brain Boosters</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">Handy tools and puzzles</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-purple-50/80 dark:hover:bg-purple-900/40 rounded-xl transition-all px-4 border border-purple-200/50 dark:border-purple-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("quick-tools")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-purple-100/80 dark:bg-purple-900/80 group-hover:bg-purple-200/80 dark:group-hover:bg-purple-800/80 transition-colors">
                      <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-base text-gray-900 dark:text-white truncate">Quick Tools</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">Calculator & solver</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 rounded-xl transition-all px-4 border border-blue-200/50 dark:border-blue-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("brain-booster")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-blue-100/80 dark:bg-blue-900/80 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/80 transition-colors">
                      <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-base text-gray-900 dark:text-white truncate">Brain Booster</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">Math puzzles</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Math Tools */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-gray-900/90 dark:to-purple-900/40 backdrop-blur-2xl rounded-2xl border border-purple-300/50 dark:border-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-5 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 shadow-sm">
                    <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white">Math Tools</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Quick access tools</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-purple-50/80 dark:hover:bg-purple-900/40 rounded-xl transition-all px-4 border border-purple-200/50 dark:border-purple-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("unit-converter")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-purple-100/80 dark:bg-purple-900/80 group-hover:bg-purple-200/80 dark:group-hover:bg-purple-800/80 transition-colors">
                      <Ruler className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-base text-gray-900 dark:text-white">Unit Converter</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Convert units</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 rounded-xl transition-all px-4 border border-blue-200/50 dark:border-blue-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("graphing-tool")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-blue-100/80 dark:bg-blue-900/80 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/80 transition-colors">
                      <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-base text-gray-900 dark:text-white">Graphing Tool</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Plot graphs</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-green-50/80 dark:hover:bg-green-900/40 rounded-xl transition-all px-4 border border-green-200/50 dark:border-green-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("formula-sheet")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-green-100/80 dark:bg-green-900/80 group-hover:bg-green-200/80 dark:group-hover:bg-green-800/80 transition-colors">
                      <BookText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-base text-gray-900 dark:text-white">Formula Sheet</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Common formulas</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="group flex items-center h-16 bg-white/60 dark:bg-gray-800/40 hover:bg-yellow-50/80 dark:hover:bg-yellow-900/40 rounded-xl transition-all px-4 border border-yellow-200/50 dark:border-yellow-700/30 shadow-sm hover:shadow-md"
                    onClick={() => setSelectedTool("topic-explorer")}
                  >
                    <div className="p-2 mr-3 rounded-lg bg-yellow-100/80 dark:bg-yellow-900/80 group-hover:bg-yellow-200/80 dark:group-hover:bg-yellow-800/80 transition-colors">
                      <BookOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-base text-gray-900 dark:text-white">Topic Explorer</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Browse topics</p>
                    </div>
                  </Button>
                </div>
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
