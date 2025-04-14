
import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, FileText, Mic, PenTool, Upload } from "lucide-react";
import { MathProblem } from "@/lib/groq-api";

interface MathInputProps {
  onSubmit: (problem: MathProblem) => void;
  isLoading: boolean;
}

const MathInput: React.FC<MathInputProps> = ({ onSubmit, isLoading }) => {
  const [inputMethod, setInputMethod] = useState<"text" | "image" | "voice" | "drawing" | "file">("text");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error("Please enter a math problem");
      return;
    }

    onSubmit({
      problem: textInput,
      type: "text",
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedDocTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/csv"];
    
    // Check if the file type is allowed
    if (inputMethod === "image" && !allowedImageTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    if (inputMethod === "file" && !allowedDocTypes.includes(file.type)) {
      toast.error("Please select a valid file (PDF, DOCX, CSV)");
      return;
    }
    
    setSelectedFile(file);
    
    // Create a preview URL for images
    if (allowedImageTypes.includes(file.type)) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    try {
      let fileType: "pdf" | "docx" | "csv" | undefined = undefined;
      
      if (selectedFile.type === "application/pdf") {
        fileType = "pdf";
      } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        fileType = "docx";
      } else if (selectedFile.type === "text/csv") {
        fileType = "csv";
      }

      const content = await readFileAsBase64(selectedFile);
      
      onSubmit({
        problem: selectedFile.name,
        type: inputMethod === "image" ? "image" : "file",
        fileType,
        content,
      });
      
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to process the file. Please try again.");
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePremiumFeatureClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to use this feature", {
        description: "Create an account to unlock all premium features.",
        action: {
          label: "Log in",
          onClick: () => {
            // This would trigger the login dialog, but for now we'll just show another toast
            toast.info("Click the Login button in the header to get started");
          },
        },
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="text" onClick={() => setInputMethod("text")}>
            Text
          </TabsTrigger>
          <TabsTrigger 
            value="image" 
            onClick={() => {
              if (isAuthenticated) {
                setInputMethod("image");
              } else {
                handlePremiumFeatureClick();
              }
            }}
            disabled={!isAuthenticated}
          >
            Image
          </TabsTrigger>
          <TabsTrigger 
            value="voice" 
            onClick={() => {
              if (isAuthenticated) {
                setInputMethod("voice");
              } else {
                handlePremiumFeatureClick();
              }
            }}
            disabled={!isAuthenticated}
          >
            Voice
          </TabsTrigger>
          <TabsTrigger 
            value="drawing" 
            onClick={() => {
              if (isAuthenticated) {
                setInputMethod("drawing");
              } else {
                handlePremiumFeatureClick();
              }
            }}
            disabled={!isAuthenticated}
          >
            Draw
          </TabsTrigger>
          <TabsTrigger 
            value="file" 
            onClick={() => {
              if (isAuthenticated) {
                setInputMethod("file");
              } else {
                handlePremiumFeatureClick();
              }
            }}
            disabled={!isAuthenticated}
          >
            File
          </TabsTrigger>
        </TabsList>

        {/* Text Input */}
        <TabsContent value="text" className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 13)"
            className="min-h-[120px]"
          />
          <Button onClick={handleTextSubmit} disabled={isLoading} className="w-full">
            {isLoading ? "Solving..." : "Solve Problem"}
          </Button>
        </TabsContent>

        {/* Image Input */}
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <Camera className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                  <p className="text-muted-foreground mb-4">Log in to upload and solve math problems from images.</p>
                  <Button onClick={handlePremiumFeatureClick}>Log in to Access</Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 mb-4">
                    {filePreviewUrl ? (
                      <div className="relative w-full">
                        <img 
                          src={filePreviewUrl} 
                          alt="Selected" 
                          className="mx-auto max-h-[300px] rounded-md object-contain"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreviewUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 text-primary/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Drag & drop an image of your math problem here, or click to browse
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" /> Choose Image
                        </Button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <Button 
                    onClick={handleFileSubmit} 
                    disabled={!selectedFile || isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : "Solve from Image"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Input - Premium Feature Placeholder */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Mic className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Voice Input</h3>
                <p className="text-muted-foreground mb-4">
                  {isAuthenticated 
                    ? "This feature is coming soon! You'll be able to speak your math problems." 
                    : "Log in to use voice input for your math problems."}
                </p>
                {!isAuthenticated && <Button onClick={handlePremiumFeatureClick}>Log in to Access</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drawing Input - Premium Feature Placeholder */}
        <TabsContent value="drawing" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <PenTool className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Draw Your Problem</h3>
                <p className="text-muted-foreground mb-4">
                  {isAuthenticated 
                    ? "This feature is coming soon! You'll be able to draw math problems directly." 
                    : "Log in to use the drawing feature for your math problems."}
                </p>
                {!isAuthenticated && <Button onClick={handlePremiumFeatureClick}>Log in to Access</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Input - Premium Feature */}
        <TabsContent value="file" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                  <p className="text-muted-foreground mb-4">Log in to upload and solve math problems from PDF, DOCX, or CSV files.</p>
                  <Button onClick={handlePremiumFeatureClick}>Log in to Access</Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 mb-4">
                    {selectedFile ? (
                      <div className="w-full">
                        <div className="flex items-center p-3 bg-muted rounded-md">
                          <FileText className="h-8 w-8 text-primary mr-3" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-12 w-12 text-primary/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Upload PDF, DOCX, or CSV files to extract and solve math problems
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" /> Choose File
                        </Button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.docx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"
                      onChange={handleFileChange}
                    />
                  </div>
                  <Button 
                    onClick={handleFileSubmit} 
                    disabled={!selectedFile || isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : "Extract & Solve"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MathInput;
