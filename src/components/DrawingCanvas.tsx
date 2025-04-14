
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2, Save, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial canvas style
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#000000";

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grid pattern for math
    drawGrid(ctx, canvas.width, canvas.height);

    // Save initial state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialState]);
    setHistoryIndex(0);

    setContext(ctx);
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "#e5e7eb"; // Light gray grid
    ctx.lineWidth = 0.5;
    
    // Draw horizontal lines
    const gridSize = 20;
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !context) return;

      // Save current drawing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Redraw white background
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Redraw grid
      drawGrid(context, canvas.width, canvas.height);
      
      // Restore drawing
      context.putImageData(imageData, 0, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [context]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling when drawing on touch devices
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (tool === "eraser") {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 20;
    } else {
      context.strokeStyle = "#000000";
      context.lineWidth = lineWidth;
    }
    
    context.lineTo(x, y);
    context.stroke();
    setHasDrawing(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    context.closePath();
    setIsDrawing(false);
    
    // Save state for undo
    const canvas = canvasRef.current;
    const newImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Remove any redo states
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    newHistory.push(newImageData);
    
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;
    
    const newIndex = historyIndex - 1;
    const imageData = drawingHistory[newIndex];
    
    context.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
    
    // Check if we're back to initial state
    if (newIndex === 0) {
      setHasDrawing(false);
    }
  };

  const handleClear = () => {
    if (!context || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw grid
    drawGrid(context, canvas.width, canvas.height);
    
    // Save cleared state
    const clearedState = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Keep only the initial state and add the cleared state
    setDrawingHistory([drawingHistory[0], clearedState]);
    setHistoryIndex(1);
    setHasDrawing(false);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    if (!hasDrawing) {
      toast.error("Please draw your math problem before solving");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");
      onSave(imageData);
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to process drawing. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row md:justify-between gap-2">
        <div className="flex space-x-2 flex-wrap gap-y-2">
          <Button 
            variant={tool === "pen" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setTool("pen")}
          >
            Pen
          </Button>
          <Button 
            variant={tool === "eraser" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setTool("eraser")}
          >
            <Eraser className="h-4 w-4 mr-1" /> Eraser
          </Button>
          <div className="flex items-center space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
              disabled={lineWidth <= 1}
              className="px-2"
            >
              -
            </Button>
            <span className="text-xs w-12 text-center">Thickness: {lineWidth}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLineWidth(Math.min(10, lineWidth + 1))}
              disabled={lineWidth >= 10}
              className="px-2"
            >
              +
            </Button>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}>
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
      
      <div className="border border-input rounded-md overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: "300px" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <p className="text-xs text-muted-foreground">
          Tips for better recognition:
        </p>
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          <li>Write clearly with appropriate spacing</li>
          <li>For fractions, draw a clear horizontal line between numerator and denominator</li>
          <li>Write one complete equation or expression</li>
          <li>Use the grid for alignment</li>
        </ul>
        
        <Button 
          onClick={handleSave} 
          disabled={isProcessing || !hasDrawing}
          className="mt-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" /> Solve Problem
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
