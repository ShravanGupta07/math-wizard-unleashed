import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Mic, PenTool, Send } from "lucide-react";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution } from "@/lib/groq-api";

export function MainContent() {
  const [problem, setProblem] = useState<string>("");
  const [currentSolution, setCurrentSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    // TODO: Implement solution logic
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">Math Wizard</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {currentSolution ? (
          <MathOutput
            problem={{ problem, type: "text" }}
            solution={currentSolution}
            loading={loading}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Welcome to Math Wizard</h2>
              <p className="text-muted-foreground">
                Enter your math problem below to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Textarea
              placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 13)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="min-h-[60px] w-full resize-none rounded-lg pr-20 pl-4 py-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Upload Image"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Voice Input"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Draw"
              >
                <PenTool className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleSubmit}
                disabled={!problem.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 