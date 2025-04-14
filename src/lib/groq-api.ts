
import { toast } from "@/components/ui/sonner";

// The API Key, ideally this would be stored in a more secure way like environment variables or server-side
const GROQ_API_KEY = "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";

export interface MathProblem {
  problem: string;
  type: "text" | "image" | "voice" | "drawing" | "file";
  fileType?: "pdf" | "docx" | "csv";
  content?: string | ArrayBuffer | null;
  requestVisualization?: boolean;
  requestHints?: boolean;
}

export interface MathSolution {
  solution: string;
  explanation: string;
  latex?: string;
  visualization?: any;
  steps?: string[];
  topic?: string;
  hints?: string[];
  plotData?: any;
}

// Topic detection using keywords and patterns
const detectMathTopic = (problem: string): string => {
  const problemText = problem.toLowerCase();
  
  // Define keyword patterns for different topics
  const topicPatterns = {
    algebra: [
      'solve', 'equation', 'expression', 'simplify', 'factor', 'polynomial',
      'linear', 'quadratic', 'systems of equations', 'inequality', 'x', 'y', 'variable'
    ],
    calculus: [
      'derivative', 'integrate', 'limit', 'differentiate', 'rate of change',
      'maximum', 'minimum', 'inflection', 'critical points', 'definite integral'
    ],
    trigonometry: [
      'sin', 'cos', 'tan', 'sine', 'cosine', 'tangent', 'angle', 'radian', 'degree',
      'triangle', 'circular', 'periodic', 'cotangent', 'secant', 'cosecant'
    ],
    geometry: [
      'area', 'volume', 'perimeter', 'circle', 'triangle', 'rectangle', 'square',
      'polygon', 'sphere', 'distance', 'angle', 'chord', 'diameter', 'radius'
    ],
    statistics: [
      'probability', 'mean', 'median', 'mode', 'standard deviation', 'variance',
      'distribution', 'sample', 'histogram', 'correlation', 'regression'
    ],
    linearAlgebra: [
      'matrix', 'vector', 'determinant', 'eigenvalue', 'eigenvector',
      'linear transformation', 'span', 'basis', 'dimension', 'transpose'
    ],
    numberTheory: [
      'prime', 'divisor', 'gcd', 'lcm', 'modulo', 'congruence',
      'diophantine', 'integer', 'divisibility', 'remainder'
    ]
  };
  
  // Score each topic based on keyword matches
  const topicScores = Object.entries(topicPatterns).map(([topic, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (problemText.includes(keyword) ? 1 : 0);
    }, 0);
    return { topic, score };
  });
  
  // Find the topic with the highest score
  topicScores.sort((a, b) => b.score - a.score);
  
  // If no strong match is found, default to algebra
  return topicScores[0].score > 0 ? topicScores[0].topic : 'algebra';
};

export const solveMathProblem = async (problem: MathProblem): Promise<MathSolution> => {
  try {
    let content = problem.content;
    
    // Handle file content if it exists
    if ((problem.type === "file" || problem.type === "image" || problem.type === "voice" || problem.type === "drawing") && content) {
      if (typeof content !== "string") {
        // Convert ArrayBuffer to base64 for sending
        const buffer = new Uint8Array(content as ArrayBuffer);
        content = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
      }
    }
    
    // Detect the mathematical topic for more accurate solutions
    const detectedTopic = problem.type === "text" ? detectMathTopic(problem.problem) : "general";
    
    // Construct the system prompt based on the type of problem and detected topic
    let systemPrompt = "You are MathWizard, an advanced AI specialized in solving mathematics problems with extreme accuracy. ";
    
    // Add topic-specific instructions
    if (detectedTopic === "algebra") {
      systemPrompt += "You're particularly expert in algebra. Focus on equation solving, factoring, and simplification. ";
    } else if (detectedTopic === "calculus") {
      systemPrompt += "You're particularly expert in calculus. Pay attention to derivatives, integrals, limits, and optimization. ";
    } else if (detectedTopic === "trigonometry") {
      systemPrompt += "You're particularly expert in trigonometry. Focus on trigonometric functions, identities, and triangle problems. ";
    } else if (detectedTopic === "geometry") {
      systemPrompt += "You're particularly expert in geometry. Pay attention to shapes, areas, volumes, and spatial relationships. ";
    } else if (detectedTopic === "statistics") {
      systemPrompt += "You're particularly expert in statistics. Focus on probability, distributions, and data analysis. ";
    } else if (detectedTopic === "linearAlgebra") {
      systemPrompt += "You're particularly expert in linear algebra. Pay attention to matrices, vectors, and linear systems. ";
    } else if (detectedTopic === "numberTheory") {
      systemPrompt += "You're particularly expert in number theory. Focus on properties of integers, divisibility, and primes. ";
    }
    
    systemPrompt += "Always provide clear, step-by-step explanations that anyone can understand. ";
    systemPrompt += "Start every solution with 'A classic!' followed by a simple explanation anyone can understand. ";
    systemPrompt += "Format the final answer as '【answer】' to highlight it clearly. ";
    
    // New instructions for LaTeX, hints, and plotting
    systemPrompt += "Provide valid LaTeX for all mathematical expressions using standard LaTeX notation, wrapped within $$ for display and $ for inline. ";
    systemPrompt += "Include a 'Topic:' section that identifies the mathematical field this problem belongs to. ";
    
    if (problem.requestHints) {
      systemPrompt += "Include 3 progressive hints in a 'Hints:' section, starting from vague to more specific, that guide towards the solution without giving it away. ";
    }
    
    if (problem.requestVisualization) {
      systemPrompt += "If the problem involves graphing functions, provide plot data in JSON format within ```json ``` tags, with x and y coordinates. ";
      systemPrompt += "For geometry problems, describe the visualization in detail using LaTeX notation for coordinates and shapes. ";
    }
    
    // Type-specific system prompts for higher accuracy
    if (problem.type === "voice") {
      systemPrompt += " For this voice input, focus on correctly interpreting mathematical terminology. ";
      systemPrompt += " Carefully listen for numbers, operations, and mathematical terms. ";
      systemPrompt += " If you hear terms like 'x squared', interpret as x^2. If you hear 'square root', interpret as sqrt(). ";
      systemPrompt += " For fractions, clearly identify numerator and denominator.";
    } else if (problem.type === "drawing") {
      systemPrompt += " For this hand-drawn math, focus on correctly interpreting symbols and numbers. ";
      systemPrompt += " Pay attention to the structure of equations, fractions, exponents, and operation symbols. ";
      systemPrompt += " Differentiate between similar-looking symbols like x and ×, or + and t. ";
      systemPrompt += " For fractions, identify the numerator and denominator separated by a horizontal line.";
      systemPrompt += " If the drawing seems to be a graph or geometric figure, describe what you see in mathematical terms.";
    }
    
    // Construct the user prompt
    let userPrompt = "Solve this math problem: " + problem.problem;
    
    if (problem.type === "image") {
      userPrompt = "Analyze and solve the math problem in this image: " + problem.problem + " Ensure you identify all symbols and numbers correctly.";
    } else if (problem.type === "voice") {
      userPrompt = "Carefully analyze this spoken math problem and solve it step by step: " + problem.problem;
      userPrompt += " Remember to focus on mathematical terms and properly interpret them.";
    } else if (problem.type === "drawing") {
      userPrompt = "Analyze this hand-drawn math problem and solve it step by step: " + problem.problem;
      userPrompt += " Pay special attention to correctly identifying all mathematical symbols, numbers, and operations.";
    } else if (problem.type === "file") {
      userPrompt = `Extract and solve the math problems from this ${problem.fileType} file. `;
      if (problem.fileType === "csv") {
        userPrompt += "Perform appropriate statistical analysis if needed.";
      }
    }
    
    // Request visualization if needed
    if (problem.requestVisualization) {
      userPrompt += " Please include visualization data for graphing or geometric interpretation.";
    }
    
    // Request hints if needed
    if (problem.requestHints) {
      userPrompt += " Please provide progressive hints that would help someone solve this on their own.";
    }
    
    // Make request to GROQ API with enhanced parameters for accuracy
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic outputs
        max_tokens: 4096,
        top_p: 0.95, // Slightly reduced top_p for more focused sampling
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to solve the math problem");
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Extract different components from the response
    const topic = extractTopic(aiResponse);
    const hints = extractHints(aiResponse);
    const latexContent = extractLatex(aiResponse);
    const plotData = extractPlotData(aiResponse);
    
    // Clean and format the response
    const cleanedResponse = aiResponse
      .replace(/\\\$/g, "")
      .replace(/\$\$(.*?)\$\$/g, "$1")
      .replace(/\$(.*?)\$/g, "$1")
      .replace(/\\boxed\{(.*?)\}/g, "【$1】");
    
    // Format the response for simpler display
    const solution: MathSolution = {
      solution: formatSolution(cleanedResponse),
      explanation: extractExplanation(cleanedResponse),
      steps: extractSteps(cleanedResponse),
      topic: topic,
      hints: hints,
      latex: latexContent,
      plotData: plotData,
      visualization: extractVisualization(cleanedResponse)
    };
    
    return solution;
  } catch (error) {
    console.error("Error solving math problem:", error);
    toast.error("Failed to solve the math problem. Please try again.");
    throw error;
  }
};

// Extract mathematical topic from the response
function extractTopic(text: string): string {
  const topicMatch = text.match(/Topic:\s*([^\n]+)/i);
  return topicMatch ? topicMatch[1].trim() : 'General Mathematics';
}

// Extract hints from the response
function extractHints(text: string): string[] | undefined {
  if (text.includes("Hints:")) {
    const hintsSection = text.match(/Hints:(.*?)(?=\n\n|Topic:|$)/s);
    if (hintsSection) {
      return hintsSection[1]
        .split(/\d+\.\s/)
        .filter(hint => hint.trim().length > 0)
        .map(hint => hint.trim());
    }
  }
  return undefined;
}

// Extract LaTeX content from the response
function extractLatex(text: string): string | undefined {
  // Extract all LaTeX expressions
  const latexExpressions: string[] = [];
  const displayMathRegex = /\$\$(.*?)\$\$/gs;
  const inlineMathRegex = /\$(.*?)\$/gs;
  
  let match;
  while ((match = displayMathRegex.exec(text)) !== null) {
    latexExpressions.push(match[1]);
  }
  
  while ((match = inlineMathRegex.exec(text)) !== null) {
    latexExpressions.push(match[1]);
  }
  
  return latexExpressions.length > 0 ? latexExpressions.join('\n') : undefined;
}

// Extract plot data for graphs
function extractPlotData(text: string): any {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Error parsing plot data JSON:", e);
      
      // Fallback: Try to create sample data for common functions
      if (text.toLowerCase().includes('parabola') || text.toLowerCase().includes('quadratic')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i - 10,
          y: Math.pow(i - 10, 2) / 10
        }));
      } else if (text.toLowerCase().includes('sine') || text.toLowerCase().includes('sin(')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i,
          y: Math.sin(i * Math.PI / 10)
        }));
      } else if (text.toLowerCase().includes('line') || text.toLowerCase().includes('linear')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i - 10,
          y: (i - 10) / 2
        }));
      }
    }
  }
  return undefined;
}

function formatSolution(text: string): string {
  // If solution already has our desired format, return it as is
  if (text.includes("A classic!")) {
    return text;
  }
  
  // Add our desired format
  let formattedSolution = "A classic! The solution to this problem is quite simple: ";
  
  // Extract just the numerical answer if possible
  const numericMatch = text.match(/(?:=|is|equals)\s*([\d\.\-]+)/i);
  if (numericMatch && numericMatch[1]) {
    formattedSolution += `The answer is 【${numericMatch[1]}】.`;
  } else {
    // Otherwise use the whole text
    formattedSolution += text;
  }
  
  // Replace any remaining LaTeX notation with simplified text
  return formattedSolution
    .replace(/\\boxed\{(.*?)\}/g, "【$1】")
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
    .replace(/\\sqrt\{(.*?)\}/g, "sqrt($1)")
    .replace(/\^(\d+)/g, "^$1");
}

// Helper functions to extract components from the AI response
function extractExplanation(text: string): string {
  if (text.includes("Explanation:")) {
    const explanationMatch = text.match(/Explanation:(.*?)(?=\n\n|$)/s);
    return explanationMatch ? explanationMatch[1].trim() : "";
  }
  
  // If no explicit explanation section, use the whole text
  return text;
}

function extractSteps(text: string): string[] | undefined {
  // Look for steps in various formats
  if (text.includes("Steps:")) {
    const stepsSection = text.match(/Steps:(.*?)(?=\n\n|$)/s);
    if (stepsSection) {
      return stepsSection[1]
        .split(/\d+\.\s/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim());
    }
  }
  
  // Look for numbered steps
  const stepLines = text.match(/\d+\.\s+(.*?)(?=\n\d+\.|$)/gs);
  if (stepLines && stepLines.length > 0) {
    return stepLines.map(line => line.trim());
  }
  
  // Try to split by new lines if no other pattern matches
  return text.split('\n').filter(line => line.trim().length > 0);
}

function extractVisualization(text: string): any | undefined {
  // Look for visualization data in JSON format
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Error parsing visualization JSON:", e);
    }
  }
  return undefined;
}
