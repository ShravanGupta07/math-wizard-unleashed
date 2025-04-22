import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { UnitConverter } from "./UnitConverter";
import { GraphingTool } from "./GraphingTool";
import { FormulaSheet } from "./FormulaSheet";
import { TopicExplorer } from "./TopicExplorer";
import { StoryProblemGenerator } from "./StoryProblemGenerator";
import { BrainBooster } from "./BrainBooster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Calculator, BookText, Brain } from "lucide-react";

interface MathToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tool: "unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer" | "story-problem-generator" | "brain-booster";
}

const toolTitles = {
  "unit-converter": "Unit Converter",
  "graphing-tool": "Graphing Tool",
  "formula-sheet": "Formula Sheet",
  "topic-explorer": "Topic Explorer",
  "story-problem-generator": "Story Problem Generator",
  "brain-booster": "Brain Booster",
};

export function MathToolsDialog({ isOpen, onClose, tool }: MathToolsDialogProps) {
  const getTitle = () => {
    switch (tool) {
      case "unit-converter":
        return "Unit Converter";
      case "graphing-tool":
        return "Graphing Tool";
      case "formula-sheet":
        return "Formula Sheet";
      case "topic-explorer":
        return "Topic Explorer";
      case "story-problem-generator":
        return "Story Problem Generator";
      case "brain-booster":
        return "Brain Booster";
      default:
        return "Math Tools";
    }
  };

  const renderContent = () => {
    switch (tool) {
      case "unit-converter":
        return <UnitConverter />;
      case "graphing-tool":
        return <GraphingTool />;
      case "formula-sheet":
        return <FormulaSheet />;
      case "topic-explorer":
        return <TopicExplorer />;
      case "story-problem-generator":
        return (
          <div className="p-4">
            <StoryProblemGenerator />
          </div>
        );
      case "brain-booster":
        return (
          <div className="p-4">
            <BrainBooster />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
} 