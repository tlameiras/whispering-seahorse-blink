"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { invokeAIAnalysis } from "@/utils/ai";

interface Suggestion {
  id: string;
  text: string;
  example: string;
  ticked: boolean;
}

interface SimilarStory {
  id: string;
  title: string;
  status: string;
  featureId: string;
  featureName: string;
  matchingPercentage: number;
}

interface AnalysisResult {
  qualityScore: number;
  qualityLevel: string;
  recommendedStoryPoints: number;
  improvementSuggestions: Suggestion[];
  suggestedAcceptanceCriteria: Suggestion[];
  similarHistoricalStories: SimilarStory[];
}

interface StoryAssistantProps {
  storyText: string;
  acceptanceCriteria: Suggestion[];
  onStoryUpdate: (newStory: string, newAcceptanceCriteria: Suggestion[]) => void;
  onStoryPointsUpdate: (points: number) => void;
}

const StoryAssistant: React.FC<StoryAssistantProps> = ({
  storyText,
  acceptanceCriteria,
  onStoryUpdate,
  onStoryPointsUpdate,
}) => {
  const [llmModel, setLlmModel] = useState<string>("gemini-2.5-flash");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Reset analysis result if story text changes significantly
    // This is a simple heuristic, can be improved
    if (analysisResult && analysisResult.qualityScore && storyText.length > 0 && !storyText.includes(analysisResult.qualityLevel)) {
      setAnalysisResult(null);
    }
  }, [storyText]);

  const handleAnalyzeStory = async () => {
    if (!storyText.trim()) {
      toast.error("Please enter a user story to analyze.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await invokeAIAnalysis({
        userStory: storyText,
        llmModel,
        operationMode: "analyze",
      });
      setAnalysisResult(data as AnalysisResult);
      onStoryPointsUpdate((data as AnalysisResult).recommendedStoryPoints);
      onStoryUpdate(storyText, (data as AnalysisResult).suggestedAcceptanceCriteria);
      toast.success("User story analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze story.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestions = async () => {
    if (!analysisResult) return;

    const tickedSuggestions = analysisResult.improvementSuggestions.filter(s => s.ticked);
    if (tickedSuggestions.length === 0) {
      toast.info("No suggestions selected to apply.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await invokeAIAnalysis({
        userStory: storyText,
        llmModel,
        operationMode: "apply_suggestions",
        suggestions: tickedSuggestions,
      });

      if (data && data.newStory) {
        onStoryUpdate(data.newStory, analysisResult.suggestedAcceptanceCriteria);
        setAnalysisResult(null); // Reset analysis to allow re-analysis of the new story
        toast.success("Suggestions applied and new story generated!");
      } else {
        toast.error("Failed to apply suggestions.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to apply suggestions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionToggle = (type: "improvement" | "acceptance", id: string) => {
    if (analysisResult) {
      if (type === "improvement") {
        setAnalysisResult({
          ...analysisResult,
          improvementSuggestions: analysisResult.improvementSuggestions.map(s =>
            s.id === id ? { ...s, ticked: !s.ticked } : s
          ),
        });
      } else {
        const updatedCriteria = acceptanceCriteria.map(c =>
          c.id === id ? { ...c, ticked: !c.ticked } : c
        );
        onStoryUpdate(storyText, updatedCriteria);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">AI Assistant</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="llm-model" className="text-sm font-medium text-muted-foreground">
            Model:
          </label>
          <Select value={llmModel} onValueChange={setLlmModel}>
            <SelectTrigger id="llm-model" className="w-[180px] bg-card">
              <SelectValue placeholder="Select LLM model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleAnalyzeStory} disabled={isLoading || !storyText.trim()} className="w-full">
        {isLoading ? "Analyzing..." : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Story</>}
      </Button>

      {analysisResult && (
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-xl font-bold">{analysisResult.qualityScore}/100</p>
            </div>
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Level</p>
              <p className="text-xl font-bold">{analysisResult.qualityLevel}</p>
            </div>
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Story Points</p>
              <p className="text-xl font-bold">{analysisResult.recommendedStoryPoints}</p>
            </div>
          </div>

          {analysisResult.qualityLevel !== "Excellent" && (
            <>
              <h4 className="text-lg font-semibold mt-4">Improvement Suggestions</h4>
              <div className="space-y-3">
                {analysisResult.improvementSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-start space-x-2 p-2 border rounded-md bg-secondary">
                    <input
                      type="checkbox"
                      checked={suggestion.ticked}
                      onChange={() => handleSuggestionToggle("improvement", suggestion.id)}
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium">{suggestion.text}</p>
                      {suggestion.example && (
                        <p className="text-xs text-muted-foreground italic">Example: "{suggestion.example}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleApplySuggestions} disabled={isLoading} className="w-full mt-4">
                {isLoading ? "Applying..." : "Apply Selected Suggestions"}
              </Button>
            </>
          )}

          <h4 className="text-lg font-semibold mt-4">Suggested Acceptance Criteria</h4>
          <div className="space-y-3">
            {acceptanceCriteria.map((criteria) => (
              <div key={criteria.id} className="flex items-start space-x-2 p-2 border rounded-md bg-secondary">
                <input
                  type="checkbox"
                  checked={criteria.ticked}
                  onChange={() => handleSuggestionToggle("acceptance", criteria.id)}
                  className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <p className="font-medium">{criteria.text}</p>
              </div>
            ))}
          </div>

          {analysisResult.similarHistoricalStories.length > 0 && (
            <>
              <h4 className="text-lg font-semibold mt-4">Similar Historical Stories</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {analysisResult.similarHistoricalStories
                  .sort((a, b) => b.matchingPercentage - a.matchingPercentage)
                  .map((story) => (
                    <p key={story.id}>
                      <span className="font-medium">{story.title}</span> (Matching: {story.matchingPercentage}%)
                    </p>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryAssistant;