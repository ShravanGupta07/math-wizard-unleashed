
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
    
    systemPrompt += "Always provide clear, simple explanations in plain English. Start with 'A classic!' followed by a simple explanation. ";
    systemPrompt += "Format answers as 'The solution to this problem is quite simple: {solution}' and use 【answer】 to highlight the final result. ";
    systemPrompt += "Do NOT use LaTeX notation or dollar sign delimiters. Present math formulas in plain text format. ";
    systemPrompt += "Include step-by-step solutions in numbered list format, with each step clearly explained.";
    
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
    
    // Format the response for simpler display
    const solution: MathSolution = {
      solution: formatSolution(aiResponse),
      explanation: extractExplanation(aiResponse),
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
    formattedSolution += `${numericMatch[1]} is our answer.`;
  } else {
    // Otherwise use the whole text
    formattedSolution += text;
  }
  
  // Replace any LaTeX boxed notation with our simplified boxing
  return formattedSolution.replace(/\\boxed\{(.*?)\}/g, "【$1】");
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
