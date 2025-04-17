import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { toast } from "../ui/sonner";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from "../../contexts/AuthContext";

const puzzles = [
  {
    question: "What comes next: 2, 4, 8, 16, ?",
    answer: "32",
    explanation: "Each number is multiplied by 2 to get the next number."
  },
  {
    question: "A triangle has angles 90°, 60°, and __?",
    answer: "30°",
    explanation: "The sum of angles in a triangle is 180°. 180° - 90° - 60° = 30°"
  },
  {
    question: "What's the square root of 144?",
    answer: "12",
    explanation: "12 × 12 = 144"
  },
  {
    question: "If 3x + 5 = 20, what is x?",
    answer: "5",
    explanation: "3x = 20 - 5 = 15, so x = 15 ÷ 3 = 5"
  },
  {
    question: "What is the next prime number after 7?",
    answer: "11",
    explanation: "Prime numbers after 7 are 11, 13, 17, 19, etc."
  },
  {
    question: "If a circle has radius 5, what is its area?",
    answer: "25π",
    explanation: "Area = πr² = π × 5² = 25π"
  }
];

export function BrainBooster() {
  const { isAuthenticated, signInWithGoogle, loading } = useAuth();
  const [currentPuzzle, setCurrentPuzzle] = useState(puzzles[0]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Select a random puzzle when component mounts
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    setCurrentPuzzle(puzzles[randomIndex]);
  }, []);

  const handleNewPuzzle = () => {
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    setCurrentPuzzle(puzzles[randomIndex]);
    setUserAnswer("");
    setShowAnswer(false);
  };

  const handleCheckAnswer = () => {
    if (userAnswer.toLowerCase() === currentPuzzle.answer.toLowerCase()) {
      toast.success("Correct! 🎉");
    } else {
      toast.error("Try again! 💪");
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">🧠 Brain Booster</h3>
            <p className="text-center">Please sign in to access Brain Booster puzzles.</p>
            <Button onClick={signInWithGoogle}>Sign in with Google</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🧠 Brain Booster</h3>
          <Button variant="outline" size="sm" onClick={handleNewPuzzle}>
            New Puzzle
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-lg font-medium">{currentPuzzle.question}</p>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer..."
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background"
            />
            <Button onClick={handleCheckAnswer}>Check</Button>
          </div>

          {showAnswer && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <p className="font-medium">Answer: <InlineMath math={currentPuzzle.answer} /></p>
              <p className="text-sm text-muted-foreground">{currentPuzzle.explanation}</p>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 