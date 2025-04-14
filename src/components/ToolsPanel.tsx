
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/contexts/RoomContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Pencil, 
  Eraser, 
  Type, 
  Image, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  Undo, 
  Redo, 
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Hand,
  RotateCw,
  HandMetal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tool = "select" | "pen" | "eraser" | "text" | "image";

export const ToolsPanel: React.FC = () => {
  const { lockBoard, unlockBoard, activeEditor } = useRoom();
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<Tool>("pen");
  const [handRaised, setHandRaised] = useState(false);
  
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    
    // In a real app, this would update the canvas tool
    toast({
      title: `${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`,
      description: `You are now using the ${tool} tool.`
    });
  };
  
  const handleUndo = () => {
    toast({
      description: "Undo action performed"
    });
  };
  
  const handleRedo = () => {
    toast({
      description: "Redo action performed"
    });
  };
  
  const handleReset = () => {
    toast({
      description: "Canvas has been reset"
    });
  };
  
  const handleZoomIn = () => {
    toast({
      description: "Zoomed in on canvas"
    });
  };
  
  const handleZoomOut = () => {
    toast({
      description: "Zoomed out on canvas"
    });
  };
  
  const handleSave = () => {
    toast({
      title: "Canvas saved",
      description: "Your work has been saved. You can access it from your history."
    });
  };
  
  const handleDownload = () => {
    toast({
      title: "Canvas downloaded",
      description: "Your work has been downloaded as a PNG image."
    });
  };
  
  const handleLockToggle = () => {
    if (activeEditor) {
      unlockBoard();
    } else {
      lockBoard();
    }
  };
  
  const handleHandRaise = () => {
    setHandRaised(!handRaised);
    
    toast({
      title: handRaised ? "Hand lowered" : "Hand raised",
      description: handRaised 
        ? "You've lowered your hand." 
        : "You've raised your hand. The host will be notified."
    });
  };
  
  return (
    <div className="border-t border-border p-3 flex items-center justify-between bg-card/50">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {/* Drawing tools */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === "pen" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToolSelect("pen")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pen Tool</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === "eraser" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToolSelect("eraser")}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eraser Tool</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === "text" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToolSelect("text")}
                >
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text Tool</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === "image" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToolSelect("image")}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
          </div>
          
          {/* History controls */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleUndo}>
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRedo}>
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Reset button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Canvas</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {/* Special interaction buttons */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={handRaised ? "default" : "outline"} 
                  size="icon" 
                  onClick={handleHandRaise}
                  className={handRaised ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  {handRaised ? (
                    <HandMetal className="h-4 w-4" />
                  ) : (
                    <Hand className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{handRaised ? "Lower Hand" : "Raise Hand"}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activeEditor ? "default" : "outline"} 
                  size="icon" 
                  onClick={handleLockToggle}
                  className={activeEditor ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  {activeEditor ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{activeEditor ? "Unlock Board" : "Lock Board"}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate Leader</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Export options */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  Share via Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
