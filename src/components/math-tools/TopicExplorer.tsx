import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { exploreTopic } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { Badge } from "../ui/badge";
import { Loader2, BookOpen, ListChecks, BookMarked, ArrowRight } from "lucide-react";

interface TopicInfo {
  topic: string;
  definition: string;
  keyPoints: string[];
  example: {
    problem: string;
    solution: string;
  };
  relatedTopics: string[];
}

export function TopicExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.error("Please enter a topic to explore");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const info = await exploreTopic(searchTerm);
      if (!info?.topic) {
        setError(`No information found for "${searchTerm}"`);
        setTopicInfo(null);
      } else {
        setTopicInfo(info);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch topic information";
      setError(errorMessage);
      toast.error(errorMessage);
      setTopicInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRelatedTopicClick = (topic: string) => {
    setSearchTerm(topic);
    handleSearch();
  };

  const renderKeyPoints = () => {
    if (!topicInfo?.keyPoints?.length) {
      return <p className="text-muted-foreground">No key points available.</p>;
    }

    return (
      <ul className="space-y-2">
        {topicInfo.keyPoints.map((point, index) => (
          <li key={index} className="flex items-start space-x-2">
            <ArrowRight className="h-4 w-4 mt-1 text-primary" />
            <span className="text-muted-foreground">{point}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderExample = () => {
    if (!topicInfo?.example) {
      return <p className="text-muted-foreground">No example available.</p>;
    }

    return (
      <div className="space-y-4">
        <Card className="bg-card/50 hover:bg-card/70 transition-colors">
          <CardContent className="p-4">
            <p className="font-medium text-primary mb-2">Problem:</p>
            <p className="text-muted-foreground mb-4 bg-background/50 p-3 rounded-md">
              {topicInfo.example.problem}
            </p>
            <p className="font-medium text-primary mb-2">Solution:</p>
            <p className="text-muted-foreground bg-background/50 p-3 rounded-md">
              {topicInfo.example.solution}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRelatedTopics = () => {
    if (!topicInfo?.relatedTopics?.length) {
      return <p className="text-muted-foreground">No related topics available.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {topicInfo.relatedTopics.map((topic, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => handleRelatedTopicClick(topic)}
          >
            {topic}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6" aria-describedby="topic-explorer-description">
        <div id="topic-explorer-description" className="sr-only">
          Topic Explorer - Search and explore mathematical topics
        </div>

        <div className="flex space-x-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a math topic (e.g., derivatives, matrices)"
            className="flex-1"
            aria-label="Search topic"
          />
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchTerm}
            className="min-w-[100px]"
            aria-label={loading ? "Searching..." : "Search topic"}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explore"}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8" role="status" aria-label="Loading">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 text-muted-foreground" role="alert">
            {error}
          </div>
        )}

        {topicInfo && (
          <div className="space-y-6">
            <div className="bg-card/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-primary">{topicInfo.topic}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{topicInfo.definition || 'No definition available.'}</p>
            </div>

            <div className="bg-card/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-primary">Key Points</h3>
              </div>
              {renderKeyPoints()}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-3">
                <BookMarked className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-primary">Example</h3>
              </div>
              {renderExample()}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Related Topics</h3>
              {renderRelatedTopics()}
            </div>
          </div>
        )}

        {!topicInfo && !loading && !error && searchTerm && (
          <div className="text-center py-8 text-muted-foreground" role="status">
            No information found for "{searchTerm}". Try a different topic.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 