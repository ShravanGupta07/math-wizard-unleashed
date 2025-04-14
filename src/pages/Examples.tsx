
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

// Example problems by category
const examples = {
  algebra: [
    {
      title: "Solve Quadratic Equation",
      problem: "Solve for x: 3x^2 - 14x + 8 = 0",
      description: "Find the roots of a quadratic equation using the quadratic formula."
    },
    {
      title: "Linear System",
      problem: "Solve the system of equations: 2x + y = 5 and 3x - 2y = 4",
      description: "Find the values of x and y that satisfy both equations."
    },
    {
      title: "Simplify Expression",
      problem: "Simplify the expression: (2x^3 - 3x^2 + 5x - 7) - (3x^3 + 2x^2 - 5x + 8)",
      description: "Combine like terms and simplify this algebraic expression."
    }
  ],
  calculus: [
    {
      title: "Find Derivative",
      problem: "Find the derivative of f(x) = 3x^4 - 2x^3 + 5x^2 - 7x + 2",
      description: "Calculate the first derivative of a polynomial function."
    },
    {
      title: "Evaluate Integral",
      problem: "Evaluate the indefinite integral: ∫(3x^2 + 2x - 5) dx",
      description: "Find the antiderivative of a polynomial function."
    },
    {
      title: "Limit Calculation",
      problem: "Calculate the limit: lim (x→2) (x^3 - 8) / (x - 2)",
      description: "Evaluate the limit as x approaches 2."
    }
  ],
  geometry: [
    {
      title: "Find Area of Triangle",
      problem: "Find the area of a triangle with vertices at (0,0), (4,0), and (2,3)",
      description: "Calculate the area of a triangle given its vertices."
    },
    {
      title: "Volume of Cone",
      problem: "Calculate the volume of a cone with radius 3 units and height 7 units.",
      description: "Apply the formula for the volume of a cone."
    },
    {
      title: "Angle in a Circle",
      problem: "Find the measure of an inscribed angle that intercepts an arc of 120° in a circle",
      description: "Use the relationship between inscribed angles and their intercepted arcs."
    }
  ],
  statistics: [
    {
      title: "Calculate Mean and Standard Deviation",
      problem: "Find the mean and standard deviation of the data set: 12, 15, 18, 22, 30, 35, 38",
      description: "Compute basic statistical measures for a data set."
    },
    {
      title: "Probability Problem",
      problem: "A bag contains 5 red marbles, 3 blue marbles, and 2 green marbles. If two marbles are drawn without replacement, what is the probability of drawing a red marble followed by a blue marble?",
      description: "Calculate a probability using the multiplication rule."
    },
    {
      title: "Normal Distribution",
      problem: "If X is normally distributed with mean μ = 70 and standard deviation σ = 5, find P(X > 75)",
      description: "Calculate probability using the normal distribution."
    }
  ]
};

const Examples = () => {
  const [activeCategory, setActiveCategory] = useState("algebra");
  const navigate = useNavigate();
  
  const handleTryExample = (problem: string) => {
    // In a real application, this would set the problem in a global state or URL parameter
    // For now, we'll just navigate to the solver page and show a toast message
    navigate("/");
    toast.info("Example copied", {
      description: "The example has been copied. You can now paste it in the solver.",
      action: {
        label: "Copy",
        onClick: () => {
          navigator.clipboard.writeText(problem);
          toast.success("Copied to clipboard");
        }
      }
    });
  };
  
  return (
    <div className="container py-8 space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Example Problems</h1>
        <p className="text-muted-foreground mt-2">
          Explore these example problems to see Math Wizard in action
        </p>
      </div>
      
      <Tabs defaultValue="algebra" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="algebra">Algebra</TabsTrigger>
          <TabsTrigger value="calculus">Calculus</TabsTrigger>
          <TabsTrigger value="geometry">Geometry</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        {Object.entries(examples).map(([category, problems]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map((example, index) => (
                <Card key={index} className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>{example.title}</CardTitle>
                    <CardDescription>{example.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="p-4 bg-muted/30 rounded-md">
                      <p className="font-mono text-sm">{example.problem}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      onClick={() => handleTryExample(example.problem)}
                    >
                      Try this example <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Examples;
