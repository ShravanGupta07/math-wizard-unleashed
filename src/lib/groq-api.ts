
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
    if (problem.type === "file" && content) {
      if (typeof content !== "string") {
        // Convert ArrayBuffer to base64 for sending
        const buffer = new Uint8Array(content as ArrayBuffer);
        content = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
      }
    }
    
    // Construct the system prompt based on the type of problem
    let systemPrompt = "You are MathWizard, an advanced AI specialized in solving mathematics problems. ";
    
    if (problem.requestVisualization) {
      systemPrompt += "Include visualization data whenever applicable. Format any visualization data as valid JSON that can be parsed by JavaScript. ";
    }
    
    systemPrompt += "Always provide step-by-step solutions, explanations in clear language, and LaTeX formatted equations when appropriate.";
    
    // Construct the user prompt
    let userPrompt = "Solve this math problem: " + problem.problem;
    
    if (problem.type === "image") {
      userPrompt = "Analyze and solve the math problem in this image: " + problem.problem;
    } else if (problem.type === "file") {
      userPrompt = `Extract and solve the math problems from this ${problem.fileType} file. `;
      if (problem.fileType === "csv") {
        userPrompt += "Perform appropriate statistical analysis if needed.";
      }
    }
    
    // Make request to GROQ API
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
        temperature: 0.3,
        max_tokens: 4096
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to solve the math problem");
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the AI response to extract solution components
    // This is a simplified parsing and would be more sophisticated in production
    const solution: MathSolution = {
      solution: extractSolution(aiResponse),
      explanation: extractExplanation(aiResponse),
      latex: extractLatex(aiResponse),
      steps: extractSteps(aiResponse),
      visualization: extractVisualization(aiResponse)
    };
    
    return solution;
  } catch (error) {
    console.error("Error solving math problem:", error);
    toast.error("Failed to solve the math problem. Please try again.");
    throw error;
  }
};

// Helper functions to extract components from the AI response
function extractSolution(text: string): string {
  // Simple extraction - in a real app this would be more sophisticated
  if (text.includes("Solution:")) {
    const solutionMatch = text.match(/Solution:(.*?)(?=\n\n|$)/s);
    return solutionMatch ? solutionMatch[1].trim() : text;
  }
  return text;
}

function extractExplanation(text: string): string {
  if (text.includes("Explanation:")) {
    const explanationMatch = text.match(/Explanation:(.*?)(?=\n\n|$)/s);
    return explanationMatch ? explanationMatch[1].trim() : "";
  }
  return text;
}

function extractLatex(text: string): string | undefined {
  // Look for LaTeX content between $$ or $ markers
  const latexRegex = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
  const matches = [...text.matchAll(latexRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => match[1] || match[2]).join("\n");
  }
  
  return undefined;
}

function extractSteps(text: string): string[] | undefined {
  if (text.includes("Steps:")) {
    const stepsSection = text.match(/Steps:(.*?)(?=\n\n|$)/s);
    if (stepsSection) {
      return stepsSection[1]
        .split(/\d+\.\s/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim());
    }
  }
  
  // Alternative: look for numbered steps
  const stepLines = text.match(/\d+\.\s+(.*?)(?=\n\d+\.|$)/gs);
  if (stepLines && stepLines.length > 0) {
    return stepLines.map(line => line.trim());
  }
  
  return undefined;
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
