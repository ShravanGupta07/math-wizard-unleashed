import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import { useHistory } from "../contexts/HistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { MathProblem, MathSolution } from "../lib/groq-api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from "recharts";
import { Clock, Copy, Download, ThumbsUp, Info, BookOpen, ChevronRight, Lightbulb, FileText } from "lucide-react";
import { toast } from "./ui/sonner";
import { supabase } from "../integrations/supabase/client";
import Katex from "katex";
import "katex/dist/katex.min.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
  
  // Function to generate PDF
  const generatePDF = async () => {
    if (!solution || !problem) return;

    try {
      toast.info("Generating PDF...");
      
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.className = 'pdf-content';
      pdfContent.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; margin-bottom: 20px;">Math Solution</h1>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #666;">Problem:</h2>
            <p>${problem.problem}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="color: #666;">Solution:</h2>
            <div>${solution.solution}</div>
          </div>

          ${solution.explanation ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #666;">Explanation:</h2>
              <p>${solution.explanation}</p>
            </div>
          ` : ''}

          ${solution.steps ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #666;">Steps:</h2>
              <ol>
                ${solution.steps.map(step => `<li>${step}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(pdfContent);

      // Convert the content to PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: pdfContent.scrollWidth,
        windowHeight: pdfContent.scrollHeight
      } as any);

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Math Wizard Solution', pdfWidth / 2, 20, { align: 'center' });

      // Add content
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      const today = new Date().toLocaleDateString();
      pdf.text(`Generated on ${today}`, pdfWidth - 20, pdfHeight - 10, { align: 'right' });

      // Save the PDF
      pdf.save('math-solution.pdf');
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
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
    <div className="w-full space-y-4">
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : solution ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">Solution:</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Save as PDF
                  </Button>
                </div>
              </div>

              <div className="text-lg">
                <FormattedMath text={solution.latex || solution.solution} />
              </div>
              
              {solution.explanation && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Explanation:</div>
                  <div className="text-base">{solution.explanation}</div>
                </div>
              )}

              {solution.steps && solution.steps.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Steps:</div>
                  <ol className="list-decimal list-inside space-y-2">
                    {formatSolutionSteps(solution).map((step, index) => (
                      <li key={index} className="text-base">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {solution.hints && solution.hints.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Hints:</div>
                  <ul className="list-disc list-inside space-y-2">
                    {solution.hints.map((hint, index) => (
                      <li key={index} className="text-base">{hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {solution.visualization && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Visualization:</div>
                  <div className="bg-muted rounded-lg p-4">
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
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No solution available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MathOutput;
