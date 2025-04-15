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

interface MathToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tool: "unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer";
}

const toolTitles = {
  "unit-converter": "Unit Converter",
  "graphing-tool": "Graphing Tool",
  "formula-sheet": "Formula Sheet",
  "topic-explorer": "Topic Explorer",
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