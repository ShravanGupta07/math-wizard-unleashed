import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { getFormula } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Loader2 } from "lucide-react";

interface Formula {
  name: string;
  formula: string;
  description: string;
  example: string;
}

export function FormulaSheet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.error("Please enter a topic to search");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await getFormula(searchTerm);
      if (results.length === 0) {
        setError(`No formulas found for "${searchTerm}"`);
      }
      setFormulas(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch formulas";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        <div className="flex space-x-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search formulas (e.g., trigonometry, calculus)"
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchTerm}
            className="min-w-[100px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {formulas.map((formula, index) => (
            <Card key={index} className="bg-card/50 hover:bg-card/70 transition-colors">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-lg font-semibold text-primary">{formula.name}</h3>
                <div className="p-3 bg-primary/5 rounded-md overflow-x-auto">
                  <InlineMath math={formula.formula} />
                </div>
                <p className="text-sm text-muted-foreground">{formula.description}</p>
                <div className="mt-2 bg-background/50 p-3 rounded-md">
                  <p className="text-sm font-medium text-primary">Example:</p>
                  <p className="text-sm mt-1">{formula.example}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {formulas.length === 0 && !loading && !error && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            No formulas found for "{searchTerm}". Try a different search term.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 