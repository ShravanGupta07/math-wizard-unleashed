import React, { useState } from "react";
import { 
  Clock, 
  FileUp, 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Send, 
  Trophy, 
  Lightbulb, 
  ListChecks, 
  BarChart3,
  TimerReset,
  Plus,
  BookOpen,
  Info as InfoIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

// Types for our practice module
interface PracticeQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

interface PracticeSet {
  id: string;
  title: string;
  topic: string;
  questions: PracticeQuestion[];
  timeLimit: number; // in seconds
}

// Step 1: Practice Topic Selection Component
const TopicSelection = ({ 
  onGenerateQuestions 
}: { 
  onGenerateQuestions: (topic: string, fromPdf: boolean, pdfFile?: File) => void 
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const topics = [
    "Algebra", "Calculus", "Geometry", "Trigonometry", 
    "Statistics", "Probability", "Linear Algebra", "Number Theory",
    "Differential Equations", "Discrete Mathematics"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      setPdfFile(file);
      setSelectedTopic('');
    }
  };

  const handleGenerateQuestions = () => {
    if (!selectedTopic && !pdfFile) {
      toast({
        title: "Selection required",
        description: "Please select a topic or upload a PDF",
        variant: "destructive"
      });
      return;
    }

    // Simulate file upload process
    if (pdfFile) {
      setIsUploading(true);
      // In a real app, we would upload the file to a server here
      setTimeout(() => {
        setIsUploading(false);
        onGenerateQuestions('', true, pdfFile);
      }, 2000);
    } else {
      onGenerateQuestions(selectedTopic, false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center mb-2">
          <BookOpen className="h-6 w-6 text-indigo-500 mr-2" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 bg-clip-text text-transparent">
            Practice It — Learn, Solve & Level Up!
          </CardTitle>
        </div>
        <CardDescription>
          Upload notes or pick a topic, and let our AI generate a challenge for you!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="topic" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="topic">Choose a Topic</TabsTrigger>
            <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Select Math Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {topics.slice(0, 6).map((topic) => (
                <Badge 
                  key={topic}
                  variant="outline" 
                  className={`cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950 ${
                    selectedTopic === topic ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </Badge>
              ))}
              <Badge variant="outline" className="cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950">
                <Plus className="h-3 w-3 mr-1" /> More
              </Badge>
            </div>
          </TabsContent>
          
          <TabsContent value="pdf" className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="pdf">Upload Class Notes or Textbook PDF</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors">
                <input 
                  id="pdf" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                />
                <label htmlFor="pdf" className="cursor-pointer flex flex-col items-center justify-center">
                  <FileUp className="h-10 w-10 text-indigo-400 mb-2" />
                  <p className="text-sm font-medium mb-1">Drag and drop a PDF here or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF files only, max 10MB</p>
                </label>
              </div>
              
              {pdfFile && (
                <div className="flex items-center p-2 mt-2 bg-indigo-50 dark:bg-indigo-950/20 rounded">
                  <FileUp className="h-4 w-4 text-indigo-500 mr-2" />
                  <span className="text-sm truncate">{pdfFile.name}</span>
                  <button 
                    className="ml-auto text-red-500 hover:text-red-700 text-sm"
                    onClick={() => setPdfFile(null)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="text-sm text-muted-foreground mt-2">
          {!isAuthenticated && (
            <div className="text-amber-600 dark:text-amber-400 flex items-center mb-2">
              <InfoIcon className="h-4 w-4 mr-1" />
              Sign in to save your practice history and track progress
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleGenerateQuestions}
          disabled={isUploading || (!selectedTopic && !pdfFile)}
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
        >
          {isUploading ? (
            <>Uploading PDF <Loader className="ml-2 h-4 w-4 animate-spin" /></>
          ) : (
            <>Generate Questions <Brain className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Step 2: Questions Display Component
const QuestionsDisplay = ({
  practiceSet,
  userAnswers,
  setUserAnswers,
  currentQuestion,
  setCurrentQuestion,
  timer,
  onSubmit,
  showHints,
  setShowHints
}: {
  practiceSet: PracticeSet;
  userAnswers: (number | null)[];
  setUserAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  currentQuestion: number;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
  timer: number;
  onSubmit: () => void;
  showHints: boolean;
  setShowHints: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const question = practiceSet.questions[currentQuestion];
  const isLast = currentQuestion === practiceSet.questions.length - 1;
  const isFirst = currentQuestion === 0;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setUserAnswers(newAnswers);
  };
  
  const handleNext = () => {
    if (!isLast) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const questionsCompleted = userAnswers.filter(answer => answer !== null).length;
  const completionPercentage = (questionsCompleted / practiceSet.questions.length) * 100;
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-2/3">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>🧪 Your Practice Set is Ready!</CardTitle>
              <Badge variant="outline" className="font-normal">
                {question.topic} ({question.difficulty})
              </Badge>
            </div>
            <CardDescription>
              {practiceSet.title} - Question {currentQuestion + 1} of {practiceSet.questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <h3 className="font-medium text-lg mb-2">Question {currentQuestion + 1}:</h3>
              <p className="text-base">{question.text}</p>
              
              {showHints && question.hint && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-center text-amber-800 dark:text-amber-300 mb-1">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    <span className="font-medium text-sm">Hint:</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">{question.hint}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>Select your answer:</Label>
              <RadioGroup value={userAnswers[currentQuestion]?.toString() || ""} onValueChange={(value) => handleAnswer(parseInt(value))}>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-indigo-600" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={isFirst}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowHints(!showHints)}
              >
                <Lightbulb className="mr-2 h-4 w-4" /> {showHints ? "Hide Hint" : "Show Hint"}
              </Button>
              
              {isLast ? (
                <Button 
                  onClick={onSubmit}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
                  disabled={userAnswers.some(answer => answer === null)}
                >
                  Submit All <Send className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="lg:w-1/3">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-indigo-500" />
              Timer & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatTime(timer)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Time Remaining</p>
            </div>
            
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Progress</span>
                <span>{questionsCompleted} of {practiceSet.questions.length} questions answered</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {practiceSet.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={userAnswers[index] !== null ? "default" : "outline"}
                  className={`h-10 w-10 p-0 ${
                    currentQuestion === index ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  } ${
                    userAnswers[index] !== null ? 'bg-indigo-500 text-white' : ''
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox id="save-results" />
                <label htmlFor="save-results" className="ml-2 text-sm cursor-pointer">
                  Save results to my history
                </label>
              </div>
              
              <div className="flex items-center">
                <Checkbox id="auto-submit" />
                <label htmlFor="auto-submit" className="ml-2 text-sm cursor-pointer">
                  Auto-submit when timer ends
                </label>
              </div>
            </div>
            
            <Button 
              onClick={onSubmit} 
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
              disabled={userAnswers.some(answer => answer === null)}
            >
              Submit All Answers <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Step 3: Results Summary Component
const ResultsSummary = ({
  practiceSet,
  userAnswers,
  timeTaken,
  onPracticeMore
}: {
  practiceSet: PracticeSet;
  userAnswers: (number | null)[];
  timeTaken: number;
  onPracticeMore: () => void;
}) => {
  const correctAnswers = userAnswers.reduce((count, answer, index) => {
    return count + (answer === practiceSet.questions[index].correctAnswer ? 1 : 0);
  }, 0);
  
  const accuracy = Math.round((correctAnswers / practiceSet.questions.length) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Identify strengths and weaknesses based on topics
  const topicResults: Record<string, { total: number, correct: number }> = {};
  
  practiceSet.questions.forEach((question, index) => {
    if (!topicResults[question.topic]) {
      topicResults[question.topic] = { total: 0, correct: 0 };
    }
    
    topicResults[question.topic].total += 1;
    if (userAnswers[index] === question.correctAnswer) {
      topicResults[question.topic].correct += 1;
    }
  });
  
  const strengths = Object.entries(topicResults)
    .filter(([_, stats]) => (stats.correct / stats.total) >= 0.7)
    .map(([topic]) => topic);
    
  const weaknesses = Object.entries(topicResults)
    .filter(([_, stats]) => (stats.correct / stats.total) < 0.5)
    .map(([topic]) => topic);

  // Calculate stars based on performance (1-5)
  const stars = Math.max(1, Math.min(5, Math.ceil(accuracy / 20)));
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900">
            <Trophy className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Your Practice Results</CardTitle>
        <CardDescription>
          {practiceSet.title} - {practiceSet.topic}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {correctAnswers}/{practiceSet.questions.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Score</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {accuracy}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatTime(timeTaken)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Time Taken</p>
          </div>
        </div>
        
        <div className="flex justify-center py-2">
          {[...Array(5)].map((_, i) => (
            <Trophy 
              key={i} 
              className={`h-8 w-8 ${
                i < stars 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300 dark:text-gray-600'
              }`} 
            />
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-medium">Performance Breakdown:</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              <h4 className="font-medium">Strengths:</h4>
            </div>
            <div className="ml-7 flex flex-wrap gap-2">
              {strengths.length > 0 ? (
                strengths.map(topic => (
                  <Badge key={topic} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Keep practicing to discover your strengths!</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <ArrowRight className="text-amber-500 mr-2 h-5 w-5" />
              <h4 className="font-medium">Areas to Improve:</h4>
            </div>
            <div className="ml-7 flex flex-wrap gap-2">
              {weaknesses.length > 0 ? (
                weaknesses.map(topic => (
                  <Badge key={topic} className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Great job! No major weaknesses detected.</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 pt-2">
          <h3 className="font-medium">Question Review:</h3>
          <div className="space-y-4">
            {practiceSet.questions.map((question, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  userAnswers[index] === question.correctAnswer
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Question {index + 1}</span>
                  {userAnswers[index] === question.correctAnswer ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Correct
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Incorrect
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm">{question.text}</p>
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">Your answer:</span>
                    <span className={userAnswers[index] === question.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {question.options[userAnswers[index] || 0]}
                    </span>
                  </div>
                  {userAnswers[index] !== question.correctAnswer && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">Correct answer:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {question.options[question.correctAnswer]}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span className="font-medium mr-2">Explanation:</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {question.explanation}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4 pt-2">
        <Button 
          variant="outline"
          onClick={onPracticeMore}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Practice More
        </Button>
        <Button
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
          onClick={() => window.location.reload()}
        >
          <TimerReset className="mr-2 h-4 w-4" />
          Try New Set
        </Button>
      </CardFooter>
    </Card>
  );
};

// Mock data generator for development purposes
const generateMockPracticeSet = (topic: string, fromPdf: boolean = false): PracticeSet => {
  const difficulties = ['easy', 'medium', 'hard'] as const;
  
  // Topics to use if generating from PDF
  const pdfTopics = ['Algebra', 'Calculus', 'Trigonometry', 'Geometry', 'Statistics'];
  
  // Generate sample questions based on the topic
  let questions: PracticeQuestion[] = [];
  
  if (topic === 'Algebra' || (fromPdf && Math.random() > 0.7)) {
    questions = [
      {
        id: 1,
        text: "Solve for x: 2x + 5 = 13",
        options: ["x = 4", "x = 5", "x = 6", "x = 7"],
        correctAnswer: 0,
        explanation: "Subtract 5 from both sides: 2x = 8, then divide by 2 to get x = 4",
        topic: "Algebra",
        difficulty: "easy",
        hint: "Isolate the variable by moving constants to the right side"
      },
      {
        id: 2,
        text: "Factor the expression: x² - 9",
        options: ["(x - 3)(x + 3)", "(x - 9)(x + 1)", "(x - 3)²", "(x + 3)²"],
        correctAnswer: 0,
        explanation: "This is a difference of squares formula: a² - b² = (a - b)(a + b)",
        topic: "Algebra",
        difficulty: "medium",
        hint: "Consider the difference of squares formula"
      }
    ];
  } else if (topic === 'Calculus' || (fromPdf && Math.random() > 0.5)) {
    questions = [
      {
        id: 1,
        text: "What is the derivative of f(x) = x³ + 2x² - 5x + 3?",
        options: ["3x² + 4x - 5", "3x² + 4x", "x² + 4x - 5", "3x² - 5"],
        correctAnswer: 0,
        explanation: "Differentiate term by term: f'(x) = 3x² + 4x - 5",
        topic: "Calculus",
        difficulty: "medium",
        hint: "Apply the power rule for each term"
      },
      {
        id: 2,
        text: "Evaluate the integral: ∫(2x + 3)dx",
        options: ["x² + 3x + C", "2x² + 3x + C", "x² + 3x", "2x + 3 + C"],
        correctAnswer: 0,
        explanation: "Integrate term by term: ∫(2x + 3)dx = x² + 3x + C",
        topic: "Calculus",
        difficulty: "easy",
        hint: "Remember to increase the exponent by 1 and divide by the new exponent"
      }
    ];
  } else if (topic === 'Geometry' || (fromPdf && Math.random() > 0.6)) {
    questions = [
      {
        id: 1,
        text: "In a right triangle, if one angle is 30° and one leg is 8 units, what is the length of the hypotenuse?",
        options: ["16 units", "16√3 units", "8√3 units", "4√3 units"],
        correctAnswer: 2,
        explanation: "Using the 30-60-90 triangle properties, the hypotenuse is 8 / sin(30°) = 8 / (1/2) = 16 units. However, using the correct angle, it's 8 / sin(60°) = 8 / (√3/2) = 8√3/3 units.",
        topic: "Geometry",
        difficulty: "medium",
        hint: "Use trigonometric ratios like sine and cosine"
      },
      {
        id: 2,
        text: "What is the area of a circle with radius 5 units?",
        options: ["25π square units", "10π square units", "5π square units", "50π square units"],
        correctAnswer: 0,
        explanation: "The area of a circle is πr², so with r=5, we get 25π square units.",
        topic: "Geometry",
        difficulty: "easy",
        hint: "Use the formula A = πr²"
      }
    ];
  } else if (topic === 'Trigonometry') {
    questions = [
      {
        id: 1,
        text: "What is the value of sin(30°)?",
        options: ["1/2", "√3/2", "0", "1"],
        correctAnswer: 0,
        explanation: "sin(30°) = 1/2 is a standard trigonometric value.",
        topic: "Trigonometry",
        difficulty: "easy",
        hint: "Think of a 30-60-90 triangle"
      },
      {
        id: 2,
        text: "Simplify the expression: sin²(θ) + cos²(θ)",
        options: ["0", "1", "2", "Depends on θ"],
        correctAnswer: 1,
        explanation: "This is the Pythagorean identity: sin²(θ) + cos²(θ) = 1 for all values of θ.",
        topic: "Trigonometry",
        difficulty: "medium",
        hint: "This is a fundamental trigonometric identity"
      }
    ];
  } else {
    // Default or random questions for any other topic
    const randomTopics = ['Number Theory', 'Statistics', 'Probability', 'Linear Algebra'];
    const selectedTopic = topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
    
    questions = [
      {
        id: 1,
        text: `Find the mean of the numbers: 3, 7, 8, 12, 15`,
        options: ["7", "8", "9", "10"],
        correctAnswer: 2,
        explanation: "The mean is the sum of all values divided by the count: (3 + 7 + 8 + 12 + 15) / 5 = 45 / 5 = 9",
        topic: selectedTopic,
        difficulty: "easy",
        hint: "Add all numbers and divide by how many there are"
      },
      {
        id: 2,
        text: `If P(A) = 0.3 and P(B) = 0.4, and events A and B are independent, what is P(A and B)?`,
        options: ["0.12", "0.7", "0.3", "0.4"],
        correctAnswer: 0,
        explanation: "For independent events, P(A and B) = P(A) × P(B) = 0.3 × 0.4 = 0.12",
        topic: selectedTopic,
        difficulty: "medium",
        hint: "For independent events, multiply the individual probabilities"
      }
    ];
  }
  
  // Add more random questions to get to 10 total
  while (questions.length < 10) {
    const q: PracticeQuestion = {
      id: questions.length + 1,
      text: fromPdf 
        ? `From your PDF: Question about ${pdfTopics[Math.floor(Math.random() * pdfTopics.length)]} concept #${Math.floor(Math.random() * 100)}`
        : `Question about ${topic} concept #${Math.floor(Math.random() * 100)}`,
      options: [
        `Option A - ${Math.random().toString(36).substring(7)}`,
        `Option B - ${Math.random().toString(36).substring(7)}`,
        `Option C - ${Math.random().toString(36).substring(7)}`,
        `Option D - ${Math.random().toString(36).substring(7)}`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `This is the explanation for question #${questions.length + 1}`,
      topic: fromPdf 
        ? pdfTopics[Math.floor(Math.random() * pdfTopics.length)]
        : topic,
      difficulty: difficulties[Math.floor(Math.random() * 3)],
      hint: `This is a hint for question #${questions.length + 1}`
    };
    
    questions.push(q);
  }
  
  return {
    id: `practice-${Date.now()}`,
    title: fromPdf 
      ? "Practice Set from Your Document" 
      : `${topic} Practice Challenge`,
    topic: topic,
    questions: questions,
    timeLimit: 600 // 10 minutes
  };
};

// Loader component
const Loader = (props: React.ComponentProps<typeof Clock>) => {
  return <Clock {...props} />;
};

// Info component
const Info = (props: React.ComponentProps<typeof InfoIcon>) => {
  return <InfoIcon {...props} />;
};

const PracticeIt = () => {
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [timeTaken, setTimeTaken] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const { toast } = useToast();
  
  // Handle generating questions
  const handleGenerateQuestions = (topic: string, fromPdf: boolean, pdfFile?: File) => {
    setIsGenerating(true);
    
    // Simulate API call to generate questions
    setTimeout(() => {
      const newPracticeSet = generateMockPracticeSet(topic, fromPdf);
      setPracticeSet(newPracticeSet);
      setUserAnswers(Array(newPracticeSet.questions.length).fill(null));
      setTimer(newPracticeSet.timeLimit);
      setIsGenerating(false);
      
      toast({
        title: "Practice Set Generated!",
        description: `${newPracticeSet.questions.length} questions ready for you to solve.`,
      });
    }, 2000);
  };
  
  // Timer effect
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (practiceSet && !showResults && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          setTimeTaken((prevTime) => prevTime + 1);
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0 && !showResults) {
      // Auto-submit when timer reaches zero
      handleSubmit();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [practiceSet, timer, showResults]);
  
  // Handle submission
  const handleSubmit = () => {
    if (userAnswers.some(answer => answer === null)) {
      toast({
        title: "Incomplete Answers",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setShowResults(true);
    toast({
      title: "Practice Set Completed!",
      description: "View your results and analysis below.",
    });
  };
  
  // Reset the practice session
  const handlePracticeMore = () => {
    setPracticeSet(null);
    setUserAnswers([]);
    setCurrentQuestion(0);
    setTimer(600);
    setTimeTaken(0);
    setShowResults(false);
  };
  
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-200 animate-pulse"></div>
              <Brain className="relative h-16 w-16 text-indigo-500 animate-bounce" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-center">Generating Your Practice Set...</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Our AI is crafting personalized questions based on your selection. This might take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {!practiceSet ? (
          // Step 1: Select topic or upload PDF
          <TopicSelection onGenerateQuestions={handleGenerateQuestions} />
        ) : showResults ? (
          // Step 3: Show results
          <ResultsSummary
            practiceSet={practiceSet}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            onPracticeMore={handlePracticeMore}
          />
        ) : (
          // Step 2: Display questions
          <QuestionsDisplay
            practiceSet={practiceSet}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            timer={timer}
            onSubmit={handleSubmit}
            showHints={showHints}
            setShowHints={setShowHints}
          />
        )}
      </div>
    </div>
  );
};

export default PracticeIt;
