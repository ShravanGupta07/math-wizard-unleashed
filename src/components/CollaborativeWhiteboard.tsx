
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoom } from "@/contexts/RoomContext";

export const CollaborativeWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { activeEditor } = useRoom();
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  
  // Initialize canvas on component mount
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas to full size of container
        const resizeCanvas = () => {
          const container = canvas.parentElement;
          if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            // Redraw grid if enabled
            if (showGrid) {
              drawGrid(ctx, canvas.width, canvas.height);
            } else {
              // Clear to white background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }
        };
        
        // Set initial size
        resizeCanvas();
        
        // Add resize listener
        window.addEventListener('resize', resizeCanvas);
        
        // Store context for drawing
        setContext(ctx);
        
        // Clean up
        return () => {
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }
  }, []);
  
  // Draw grid when showGrid changes
  useEffect(() => {
    if (context && canvasRef.current) {
      const canvas = canvasRef.current;
      
      if (showGrid) {
        drawGrid(context, canvas.width, canvas.height);
      } else {
        // Clear to white background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [showGrid, context]);
  
  // Function to draw grid pattern
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb'; // Light gray for grid lines
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  };
  
  // Draw functions for collaborative canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeEditor && activeEditor !== "user-123") {
      toast({
        title: "Board is locked",
        description: "You cannot draw while someone else is controlling the board."
      });
      return;
    }
    
    if (context && canvasRef.current) {
      setIsDrawing(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      context.beginPath();
      context.moveTo(x, y);
      context.strokeStyle = '#4f46e5'; // Indigo color for drawing
      context.lineWidth = 2;
      context.lineCap = 'round';
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };
  
  const stopDrawing = () => {
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };
  
  const toggleGrid = () => {
    setShowGrid(prev => !prev);
  };
  
  const clearCanvas = () => {
    if (context && canvasRef.current) {
      const canvas = canvasRef.current;
      
      if (showGrid) {
        drawGrid(context, canvas.width, canvas.height);
      } else {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      toast({
        title: "Canvas cleared",
        description: "The whiteboard has been cleared."
      });
    }
  };
  
  return (
    <div className="h-full w-full relative">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      
      {/* Floating controls */}
      <div className="absolute top-4 right-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleGrid}
          className="bg-background/80 backdrop-blur-sm"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="bg-background/80 backdrop-blur-sm"
        >
          Clear
        </Button>
      </div>
      
      {/* Placeholder message for demo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-muted-foreground opacity-30 text-lg font-medium">
          Collaborative whiteboard (click and drag to draw)
        </p>
      </div>
    </div>
  );
};
