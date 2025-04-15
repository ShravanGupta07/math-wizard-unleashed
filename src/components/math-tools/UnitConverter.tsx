import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { convertUnits } from "../../lib/groq-api";
import { toast } from "../ui/sonner";

const commonUnits = {
  length: ["meters", "kilometers", "centimeters", "millimeters", "inches", "feet", "yards", "miles"],
  mass: ["grams", "kilograms", "milligrams", "pounds", "ounces"],
  time: ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
  temperature: ["celsius", "fahrenheit", "kelvin"],
  area: ["square meters", "square kilometers", "square feet", "square yards", "acres", "hectares"],
  volume: ["cubic meters", "liters", "milliliters", "cubic feet", "gallons", "quarts", "cups"],
};

export function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof commonUnits>("length");
  const [value, setValue] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!value || !fromUnit || !toUnit) {
      toast.error("Please fill in all fields");
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      toast.error("Please enter a valid number");
      return;
    }

    setLoading(true);
    try {
      const convertedValue = await convertUnits(numericValue, fromUnit, toUnit);
      setResult(convertedValue);
    } catch (error) {
      toast.error("Failed to convert units. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={(value: keyof typeof commonUnits) => {
            setCategory(value);
            setFromUnit("");
            setToUnit("");
            setResult(null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(commonUnits).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {commonUnits[category].map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {commonUnits[category].map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Value</label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
          />
        </div>

        <Button 
          className="w-full" 
          onClick={handleConvert}
          disabled={loading || !value || !fromUnit || !toUnit}
        >
          {loading ? "Converting..." : "Convert"}
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-center">
              <span className="text-lg font-medium">{value} {fromUnit}</span>
              <span className="mx-2">=</span>
              <span className="text-lg font-medium">{result.toFixed(4)} {toUnit}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 