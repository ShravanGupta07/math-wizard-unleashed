import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, FileText, Mic, Image, PenTool, BarChart4, BrainCircuit, Lightbulb, RefreshCw, Globe, CheckCircle, Calculator, ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";

const Feature = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="feature-card hover:border-primary/50 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-cyan-50/50 dark:hover:from-indigo-950/30 dark:hover:to-cyan-950/30 group transition-all">
    <div className="flex items-start space-x-4">
      <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/30 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const TechFeature = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm hover:border-primary/30 hover:bg-accent/50 transition-all">
    <Icon className="h-4 w-4 text-primary" />
    <span className="text-sm font-medium">{title}</span>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <div className="container">
        {/* Navigation */}
        <div className="py-6 flex justify-end">
          <ModeToggle />
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                <Calculator className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Your Smartest AI Math Solver — Beyond Just Calculators
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Experience an intelligent tool that solves math problems via text, voice, image, or drawing — powered by advanced AI models with step-by-step reasoning and accuracy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white border-0 px-8">
                <Link to="/solver">
                  Try It Out <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 relative">
              <div className="relative overflow-hidden rounded-2xl shadow-xl border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 to-cyan-100/30 dark:from-indigo-950/30 dark:to-cyan-950/30 backdrop-blur-sm"></div>
                <img 
                  src="/placeholder.svg" 
                  alt="Math Solver Interface" 
                  className="w-full h-auto relative rounded-2xl"
                />
                <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* What It Does Section */}
        <section className="py-16 bg-gradient-to-b from-background to-secondary/20 rounded-3xl my-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">One Tool, Every Way to Solve Math</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose your preferred method to input math problems, our AI handles it all.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Feature 
                icon={FileText}
                title="Text-based Math Input"
                description="Type your equations or math problems directly using standard notation or LaTeX."
              />
              
              <Feature 
                icon={Mic}
                title="Voice Recognition"
                description="Speak your problem aloud and let our AI understand and transcribe it accurately."
              />
              
              <Feature 
                icon={Image}
                title="Image Upload with Math OCR"
                description="Upload photos of textbook pages, handwritten notes, or worksheets."
              />
              
              <Feature 
                icon={PenTool}
                title="Drawing Pad with Handwriting"
                description="Sketch your equations directly using our digital drawing pad."
              />
            </div>
          </div>
        </section>
        
        {/* Unique Features Section */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Smarter Than the Rest — Here's Why</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our advanced features make learning math easier, faster, and more intuitive.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <TechFeature icon={CheckCircle} title="Auto Topic Detection" />
              <TechFeature icon={Calculator} title="Symbolic Math Engine" />
              <TechFeature icon={FileText} title="LaTeX Rendering" />
              <TechFeature icon={BarChart4} title="Graph Plotting" />
              <TechFeature icon={BrainCircuit} title="Concept Tagging" />
              <TechFeature icon={Lightbulb} title="Hint Mode" />
              <TechFeature icon={RefreshCw} title="Practice Generator" />
              <TechFeature icon={Globe} title="Multilingual Support" />
            </div>
            
            <div className="mt-8 p-4 bg-secondary/50 border border-border/50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                All powered by GROQ API + advanced LLMs (like Mixtral, LLaMA), OCR tools like MathPix, and AI handwriting recognition.
              </p>
            </div>
          </div>
        </section>
        
        {/* Accuracy Section */}
        <section className="py-16 my-8 bg-gradient-to-b from-secondary/20 to-background rounded-3xl">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">99% Accuracy with Human-Like Reasoning</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI doesn't just provide answers, it shows you the thought process and steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-xl backdrop-blur-sm bg-card/50">
                  <h3 className="font-medium mb-2">Step-by-Step Solutions</h3>
                  <p className="text-sm text-muted-foreground">Like having a personal math tutor, our AI breaks down problems into clear, logical steps.</p>
                </div>
                
                <div className="p-4 border border-border rounded-xl backdrop-blur-sm bg-card/50">
                  <h3 className="font-medium mb-2">Real Math Logic</h3>
                  <p className="text-sm text-muted-foreground">Based on mathematical principles and methods that experts would use to solve problems.</p>
                </div>
                
                <div className="p-4 border border-border rounded-xl backdrop-blur-sm bg-card/50">
                  <h3 className="font-medium mb-2">Continuous Improvement</h3>
                  <p className="text-sm text-muted-foreground">Our AI learns from each problem, growing more accurate and helpful over time.</p>
                </div>
                
                <div className="p-4 border border-border rounded-xl backdrop-blur-sm bg-card/50">
                  <h3 className="font-medium mb-2">Rigorously Tested</h3>
                  <p className="text-sm text-muted-foreground">Verified with 10,000+ problems from basic arithmetic to advanced calculus.</p>
                </div>
              </div>
              
              <div className="relative h-full flex items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 dark:from-indigo-600/10 dark:to-cyan-600/10 rounded-2xl"></div>
                <div className="p-6 bg-card border border-border/50 rounded-2xl shadow-lg w-full max-w-md relative z-10">
                  <div className="text-sm text-muted-foreground mb-4">Example Solution:</div>
                  <div className="font-medium mb-2">Solve: 2x + 3 = 7</div>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-secondary/50 rounded">Step 1: Subtract 3 from both sides</div>
                    <div className="p-2 bg-secondary/50 rounded">2x = 4</div>
                    <div className="p-2 bg-secondary/50 rounded">Step 2: Divide both sides by 2</div>
                    <div className="p-2 bg-primary/10 rounded font-medium">x = 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Ready to Solve Your Math Problems?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Jump right into solving your first problem — via text, voice, image, or sketch.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white border-0 px-10 py-6 h-auto text-lg">
              <Link to="/solver">
                Try It Out Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
