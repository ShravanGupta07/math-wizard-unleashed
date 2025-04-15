import React from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, Settings, History, Calculator, ChevronDown, Search, ExternalLink } from "lucide-react";

export function Sidebar() {
  return (
    <div className="flex flex-col w-[260px] bg-[#202123] h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 bg-transparent border border-white/20 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
          <ChevronDown className="h-4 w-4" />
          Today
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
            >
              <Calculator className="h-4 w-4" />
              Math Solver
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
            >
              <History className="h-4 w-4" />
              Previous Solutions
            </Button>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
              <ChevronDown className="h-4 w-4" />
              Yesterday
            </div>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
              >
                <Calculator className="h-4 w-4" />
                Quadratic Equations
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
              >
                <Calculator className="h-4 w-4" />
                Calculus Problems
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-white/20 p-3 space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
        >
          <ExternalLink className="h-4 w-4" />
          Updates & FAQ
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-sm text-white/70 hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
} 