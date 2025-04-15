import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { generateGraphData } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function GraphingTool() {
  const [expression, setExpression] = useState("");
  const [range, setRange] = useState({ start: -10, end: 10, step: 0.5 });
  const [data, setData] = useState<{ x: number; y: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGraph = async () => {
    if (!expression) {
      toast.error("Please enter an expression");
      return;
    }

    setLoading(true);
    try {
      const points = await generateGraphData(expression, range);
      setData(points);
    } catch (error) {
      toast.error("Failed to generate graph. Please check your expression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Expression</label>
          <Input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter mathematical expression (e.g., x^2 + 2x + 1)"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start X</label>
            <Input
              type="number"
              value={range.start}
              onChange={(e) => setRange({ ...range, start: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End X</label>
            <Input
              type="number"
              value={range.end}
              onChange={(e) => setRange({ ...range, end: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Step</label>
            <Input
              type="number"
              value={range.step}
              onChange={(e) => setRange({ ...range, step: parseFloat(e.target.value) })}
              step={0.1}
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleGraph}
          disabled={loading || !expression}
        >
          {loading ? "Generating..." : "Generate Graph"}
        </Button>

        {data.length > 0 && (
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['auto', 'auto']} 
                  label={{ value: 'X', position: 'bottom' }} 
                />
                <YAxis 
                  type="number" 
                  domain={['auto', 'auto']} 
                  label={{ value: 'Y', angle: -90, position: 'left' }} 
                />
                <Tooltip 
                  formatter={(value: any) => [value.toFixed(2)]}
                  labelFormatter={(label: any) => `x = ${label.toFixed(2)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke="#8884d8" 
                  dot={false} 
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 