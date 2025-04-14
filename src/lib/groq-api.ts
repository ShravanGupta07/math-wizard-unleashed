
import { toast } from "@/components/ui/sonner";

// The API Key, ideally this would be stored in a more secure way like environment variables or server-side
const GROQ_API_KEY = "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";

export interface MathProblem {
  problem: string;
  type: "text" | "image" | "voice" | "drawing" | "file";
  fileType?: "pdf" | "docx" | "csv";
  content?: string | ArrayBuffer | null;
  requestVisualization?: boolean;
}

export interface MathSolution {
  solution: string;
  explanation: string;
  latex?: string;
  visualization?: any;
  steps?: string[];
}

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
    
    // Construct the system prompt based on the type of problem
    let systemPrompt = "You are MathWizard, an advanced AI specialized in solving mathematics problems with extreme accuracy. ";
    
    systemPrompt += "Always provide clear, step-by-step explanations that anyone can understand. ";
    systemPrompt += "Start every solution with 'A classic!' followed by a simple explanation anyone can understand. ";
    systemPrompt += "Format the final answer as '【answer】' to highlight it clearly. ";
    systemPrompt += "DO NOT use any LaTeX notations, mathematical symbols, or dollar signs. Write all equations and formulas in plain text format. ";
    systemPrompt += "Break down solutions into simple numbered steps that a middle school student could follow.";
    
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
      visualization: extractVisualization(cleanedResponse)
    };
    
    return solution;
  } catch (error) {
    console.error("Error solving math problem:", error);
    toast.error("Failed to solve the math problem. Please try again.");
    throw error;
  }
};

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
