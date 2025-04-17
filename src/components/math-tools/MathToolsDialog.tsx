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
import { QuickTools } from "./QuickTools";
import { BrainBooster } from "./BrainBooster";

interface MathToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tool: "unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer" | "quick-tools" | "brain-booster";
}

const toolTitles = {
  "unit-converter": "Unit Converter",
  "graphing-tool": "Graphing Tool",
  "formula-sheet": "Formula Sheet",
  "topic-explorer": "Topic Explorer",
  "quick-tools": "Quick Tools & Brain Boosters",
  "brain-booster": "Brain Booster",
};

export function MathToolsDialog({ isOpen, onClose, tool }: MathToolsDialogProps) {
  const renderTool = () => {
    switch (tool) {
      case "unit-converter":
        return <UnitConverter />;
      case "graphing-tool":
        return <GraphingTool />;
      case "formula-sheet":
        return <FormulaSheet />;
      case "topic-explorer":
        return <TopicExplorer />;
      case "quick-tools":
        return <QuickTools />;
      case "brain-booster":
        return <BrainBooster />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{toolTitles[tool]}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {renderTool()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 