import { useState, useRef, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { toast } from "./ui/sonner";
import { useAuth } from "../contexts/AuthContext";
import { Camera, FileText, Mic, PenTool, Upload } from "lucide-react";
import { MathProblem } from "../lib/groq-api";
import VoiceRecorder from "./VoiceRecorder";
import DrawingCanvas from "./DrawingCanvas";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { createWorker } from 'tesseract.js';
import { groq } from "../lib/groq-api";

interface MathInputProps {
  onSubmit: (problem: MathProblem) => void;
  isLoading: boolean;
}

const MathInput: React.FC<MathInputProps> = ({ onSubmit, isLoading }) => {
  const [inputMethod, setInputMethod] = useState<"text" | "image" | "voice" | "drawing" | "file">("text");
  const [textInput, setTextInput] = useState("");
  const [latexPreview, setLatexPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Process image using Tesseract and Groq
  const processImage = async (file: File) => {
    try {
      const worker = await createWorker('eng');
      
      // Configure worker for math symbols
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789+-×÷=()[]{}<>√π∞abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      });

      const { data: { text } } = await worker.recognize(file);
      
      if (text) {
        // Use Groq to improve the recognized text
        const improvedText = await groq.recognizeMathFromText(text);
        setTextInput(improvedText);
        const latex = await groq.convertToLatex(improvedText);
        setLatexPreview(latex);
        toast.success("Text recognized and processed successfully");
      } else {
        toast.error("No text found in the image");
      }

      await worker.terminate();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    }
  };

  // Process voice recording
  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert Blob to File
      const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
      
      // Use Groq to transcribe and process the audio
      const transcription = await groq.transcribeAudio(audioFile);
      setTranscribedText(transcription);
      
      // Use Groq to convert to LaTeX
      const latex = await groq.convertToLatex(transcription);
      setLatexPreview(latex);

      toast.success("Voice processed successfully");
    } catch (error) {
      console.error("Error processing voice:", error);
      toast.error("Failed to process voice recording");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice recording complete
  const handleVoiceRecordingComplete = async () => {
    try {
      if (!transcribedText) {
        toast.error("No transcription available");
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
      
      onSubmit({
        problem: transcribedText,
        type: "voice",
        content: await readFileAsBase64(audioFile),
      });
    } catch (error) {
      console.error("Error processing voice recording:", error);
      toast.error("Failed to process your recording. Please try again.");
    }
  };

  // Handle file change for images
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    if (inputMethod === "image" && !allowedImageTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    setSelectedFile(file);
    
    // Create a preview URL for images
    if (allowedImageTypes.includes(file.type)) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
      
      // Process image
      await processImage(file);
    } else {
      setFilePreviewUrl(null);
    }
  };

  // Handle file submit
  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    try {
      const content = await readFileAsBase64(selectedFile);
      
      onSubmit({
        problem: textInput,
        type: inputMethod === "image" ? "image" : "file",
        content,
      });
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file. Please try again.");
    }
  };

  // Read file as base64
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

  // Start voice recording
  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono audio
          sampleRate: 44100, // High quality audio
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Check for best supported audio format
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log("Using audio format:", mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // 128 kbps for good quality
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true);
          toast.info("Processing your voice recording...");
          
          // Combine all chunks into a single blob
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log("Final audio size:", audioBlob.size, "bytes");
          
          if (audioBlob.size === 0) {
            throw new Error("No audio was recorded. Please try again.");
          }
          
          if (audioBlob.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error("Recording too long. Please keep it under 15 seconds.");
          }
          
          // Process the audio
          const transcription = await groq.transcribeAudio(audioBlob);
          console.log("Transcription:", transcription);
          
          if (!transcription || transcription.trim().length === 0) {
            throw new Error("No speech detected. Please speak clearly and try again.");
          }
          
          setTranscribedText(transcription);
          toast.success("Voice recording processed successfully");
          
          // Convert to LaTeX
          toast.info("Converting to mathematical notation...");
          const latex = await groq.convertToLatex(transcription);
          console.log("LaTeX:", latex);
          setLatexPreview(latex);
          
          toast.success("Ready to solve your math problem!");
        } catch (error) {
          console.error("Error processing voice:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to process voice recording";
          toast.error(errorMessage, {
            description: "Try speaking more clearly or closer to the microphone.",
            action: {
              label: "Try Again",
              onClick: () => startRecording()
            }
          });
        } finally {
          setIsProcessing(false);
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(500); // Record in half-second chunks
      setIsRecording(true);
      toast.success("Recording started", {
        description: "Speak your math problem clearly and press the button again to stop."
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing your voice...");
    }
  };

  // Handle voice submit
  const handleVoiceSubmit = async () => {
    if (!transcribedText) {
      toast.error("Please record your math problem first");
      return;
    }

    try {
      onSubmit({
        problem: transcribedText,
        type: "voice",
      });
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  // Validate mathematical expression
  const validateMathExpression = (input: string): boolean => {
    // Basic validation rules
    const hasValidParentheses = (str: string) => {
      const stack = [];
      for (let char of str) {
        if (char === '(' || char === '{' || char === '[') {
          stack.push(char);
        } else if (char === ')' || char === '}' || char === ']') {
          if (stack.length === 0) return false;
          const last = stack.pop();
          if (
            (char === ')' && last !== '(') ||
            (char === '}' && last !== '{') ||
            (char === ']' && last !== '[')
          ) {
            return false;
          }
        }
      }
      return stack.length === 0;
    };

    // Check for basic syntax errors
    const hasValidOperators = !/([\+\-\*\/]){2,}/.test(input); // No consecutive operators
    const hasValidEquals = (input.match(/=/g) || []).length <= 1; // At most one equals sign
    const hasBalancedParentheses = hasValidParentheses(input);

    return hasValidOperators && hasValidEquals && hasBalancedParentheses;
  };

  // Convert plain text to LaTeX
  const convertToLatex = (input: string): string => {
    let latex = input
      .replace(/\^(\d+)/g, "^{$1}") // Convert powers
      .replace(/sqrt\((.*?)\)/g, "\\sqrt{$1}") // Convert square roots
      .replace(/\*/g, "\\times ") // Convert multiplication
      .replace(/\//g, "\\div ") // Convert division
      .replace(/(sin|cos|tan|log|ln)\((.*?)\)/g, "\\$1($2)"); // Convert functions
    
    return latex;
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    
    // Update LaTeX preview
    groq.convertToLatex(newValue).then(latex => {
      setLatexPreview(latex);
    });
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error("Please enter a math problem");
      return;
    }

    if (!validateMathExpression(textInput)) {
      toast.error("Please check your mathematical expression for errors");
      return;
    }

    onSubmit({
      problem: textInput,
      type: "text",
    });
  };

  const handleDrawingSave = (imageData: string) => {
    try {
      onSubmit({
        problem: "Hand-drawn math problem",
        type: "drawing",
        content: imageData,
      });
    } catch (error) {
      console.error("Error processing drawing:", error);
      toast.error("Failed to process your drawing. Please try again.");
    }
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
    <Tabs defaultValue="text" className="w-full h-full flex flex-col" onValueChange={(value) => setInputMethod(value as any)}>
      <TabsList className="grid w-full grid-cols-5 bg-transparent">
        <TabsTrigger value="text" className="data-[state=active]:bg-white/10">
          Text
        </TabsTrigger>
        <TabsTrigger value="image" className="data-[state=active]:bg-white/10">
          Image
        </TabsTrigger>
        <TabsTrigger value="voice" className="data-[state=active]:bg-white/10">
          Voice
        </TabsTrigger>
        <TabsTrigger value="draw" className="data-[state=active]:bg-white/10">
          Draw
        </TabsTrigger>
        <TabsTrigger value="file" className="data-[state=active]:bg-white/10">
          File
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 p-4">
        <TabsContent value="text" className="h-full m-0">
          <div className="flex flex-col h-full space-y-4">
            <Textarea
              placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 13)"
              value={textInput}
              onChange={handleTextChange}
              className="flex-1 min-h-0 bg-transparent border-0 resize-none focus-visible:ring-0 text-lg"
            />
            <Button 
              onClick={handleTextSubmit} 
              disabled={isLoading || !textInput.trim()} 
              className="w-full"
            >
              Solve Problem
            </Button>
          </div>
        </TabsContent>

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

                  {textInput && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Recognized Text:</h3>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-lg">{textInput}</p>
                          {latexPreview && (
                            <div className="mt-2">
                              <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                              <div className="text-lg">
                                <InlineMath math={latexPreview} />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

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

        <TabsContent value="voice" className="space-y-4">
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-background rounded-lg p-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-primary hover:bg-primary/90"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
            
            <p className="mt-4 text-muted-foreground">
              {isProcessing ? "Processing..." : 
               isRecording ? "Recording... Click to stop" : 
               "Click to start recording"}
            </p>

            {transcribedText && (
              <div className="mt-8 w-full max-w-xl">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-lg font-medium">Transcribed Text:</p>
                    <p className="mt-2">{transcribedText}</p>
                    {latexPreview && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                        <div className="text-lg">
                          <InlineMath math={latexPreview} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <Button
              onClick={handleVoiceSubmit}
              disabled={!transcribedText || isLoading || isProcessing}
              className="w-full mt-4"
              size="lg"
            >
              {isLoading ? "Processing..." : "Solve Problem"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="draw" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <PenTool className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Draw Your Problem</h3>
                  <p className="text-muted-foreground mb-4">
                    Log in to use the drawing feature for your math problems.
                  </p>
                  <Button onClick={handlePremiumFeatureClick}>Log in to Access</Button>
                </div>
              ) : (
                <DrawingCanvas onSave={handleDrawingSave} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
      </div>
    </Tabs>
  );
};

export default MathInput;
