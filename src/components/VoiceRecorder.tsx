import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, Play, Check, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

// Mathematical keywords and their LaTeX equivalents
const mathKeywords = {
  // Basic operations
  'plus': '+',
  'minus': '-',
  'times': '\\times',
  'multiplied by': '\\times',
  'divided by': '\\div',
  'equals': '=',
  'equal to': '=',
  'not equal to': '\\neq',
  'less than': '<',
  'greater than': '>',
  'less than or equal to': '\\leq',
  'greater than or equal to': '\\geq',
  
  // Powers and roots
  'squared': '^2',
  'cubed': '^3',
  'to the power of': '^',
  'square root of': '\\sqrt{',
  'cube root of': '\\sqrt[3]{',
  
  // Functions
  'sine': '\\sin',
  'cosine': '\\cos',
  'tangent': '\\tan',
  'logarithm': '\\log',
  'natural logarithm': '\\ln',
  'exponential': '\\exp',
  
  // Constants
  'pi': '\\pi',
  'infinity': '\\infty',
  
  // Calculus
  'integral of': '\\int',
  'derivative of': '\\frac{d}{dx}',
  'limit as': '\\lim_{x \\to ',
  'sum of': '\\sum',
  'product of': '\\prod',
};

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [latexExpression, setLatexExpression] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription("");
    setLatexExpression("");
    setShowConfirmation(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorderRef.current.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        
        // Process the audio for transcription
        await processAudioTranscription(audioBlob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Auto-stop after 60 seconds
        if (seconds >= 60) {
          stopRecording();
          toast.info("Maximum recording time reached (60 seconds)");
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const processAudioTranscription = async (audioBlob: Blob) => {
    setProcessingAudio(true);
    try {
      // Here you would integrate with a speech-to-text service
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated transcription result
      const rawTranscription = "solve for x: two x squared plus five x minus three equals zero";
      setTranscription(rawTranscription);
      
      // Convert transcription to LaTeX
      const latex = convertToLatex(rawTranscription);
      setLatexExpression(latex);
      
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio. Please try again.");
    } finally {
      setProcessingAudio(false);
    }
  };

  const convertToLatex = (text: string): string => {
    let latex = text.toLowerCase();
    
    // Replace mathematical keywords with their LaTeX equivalents
    Object.entries(mathKeywords).forEach(([keyword, replacement]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      latex = latex.replace(regex, replacement);
    });
    
    // Clean up the expression
    latex = latex
      .replace(/solve for \w+:/i, '') // Remove "solve for x:"
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    return latex;
  };

  const handleConfirm = async () => {
    if (!audioBlob) return;
    
    try {
      onRecordingComplete(audioBlob);
      setShowConfirmation(false);
      setTranscription("");
      setLatexExpression("");
    } catch (error) {
      console.error("Error processing voice recording:", error);
      toast.error("Failed to process your recording. Please try again.");
    }
  };

  const handleReject = () => {
    setShowConfirmation(false);
    setTranscription("");
    setLatexExpression("");
    setAudioUrl(null);
    setAudioBlob(null);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success("Recording completed! Review before solving.");
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[220px]">
          {isRecording ? (
            <>
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                    <Mic className="h-10 w-10 text-red-600" />
                  </div>
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {formatTime(recordingTime)}
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Recording your math problem...</p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Speak clearly and slowly, mentioning all mathematical symbols explicitly.
                </p>
              </div>
              
              <Button 
                variant="destructive" 
                onClick={stopRecording}
                className="mt-4"
              >
                <Square className="h-4 w-4 mr-2" /> Stop Recording
              </Button>
            </>
          ) : (
            <>
              {showConfirmation ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="mb-6 w-full">
                    <h3 className="text-lg font-semibold mb-2">Confirm Your Math Problem</h3>
                    
                    <div className="bg-muted p-3 rounded-md mb-4">
                      <p className="text-sm font-medium mb-1">Transcription:</p>
                      <p className="text-sm text-muted-foreground">{transcription}</p>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Mathematical Expression:</p>
                      <div className="text-lg overflow-x-auto">
                        <InlineMath math={latexExpression} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReject}>
                      <X className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                    <Button onClick={handleConfirm} disabled={processingAudio}>
                      <Check className="h-4 w-4 mr-2" /> Confirm & Solve
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {audioUrl ? (
                    <div className="flex flex-col items-center justify-center w-full">
                      <audio 
                        src={audioUrl} 
                        controls 
                        className="w-full max-w-[300px] mb-4" 
                      />
                      <p className="text-sm text-muted-foreground mb-4">
                        {processingAudio ? "Processing your recording..." : "Review your recording or start a new one"}
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button onClick={startRecording} variant="outline">
                          <Mic className="h-4 w-4 mr-2" /> Record Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-20 w-20 rounded-full border-dashed"
                        onClick={startRecording}
                      >
                        <Mic className="h-10 w-10 text-primary" />
                      </Button>
                      <p className="mt-4 text-sm text-center max-w-[300px] text-muted-foreground">
                        Press the button and speak your math problem clearly
                      </p>
                      <ul className="text-xs text-muted-foreground mt-3 space-y-1 list-disc list-inside max-w-[300px]">
                        <li>Say "equals" instead of "equals sign"</li>
                        <li>Say "x squared" rather than "x to the power of 2"</li>
                        <li>Speak at a moderate pace with clear pronunciation</li>
                        <li>Use mathematical terms like "integral of" or "square root of"</li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceRecorder;
