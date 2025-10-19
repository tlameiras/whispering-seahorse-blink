"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check, X, Copy } from "lucide-react"; // Removed RefreshCcw icon
import { toast } from "sonner";
import { invokeAIAnalysis } from "@/utils/ai";

interface Suggestion {
  id: string;
  text: string;
  example?: string;
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

interface GeneratedStoryOutput {
  title: string;
  description: string;
}

interface StoryAssistantProps {
  currentStoryText: string;
  currentAcceptanceCriteria: Suggestion[];
  onStoryUpdate: (newStory: string, newAcceptanceCriteria: Suggestion[]) => void;
  onStoryPointsUpdate: (points: number) => void;
  mode: "analyze" | "review_and_improve" | "create_from_scratch";
  mainIdeasInput: string;
  onMainIdeasChange: (ideas: string) => void;
  onAcceptChanges: (newStory: string, newAcceptanceCriteria?: Suggestion[]) => void;
  onDeclineChanges: () => void; // Renamed to parentOnDeclineChanges internally
}

const StoryAssistant: React.FC<StoryAssistantProps> = ({
  currentStoryText,
  currentAcceptanceCriteria,
  onStoryUpdate,
  onStoryPointsUpdate,
  mode,
  mainIdeasInput,
  onMainIdeasChange,
  onAcceptChanges,
  onDeclineChanges: parentOnDeclineChanges, // Renamed prop to avoid conflict with local handler
}) => {
  const [llmModel, setLlmModel] = useState<string>("gemini-2.5-flash");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [originalContentForComparison, setOriginalContentForComparison] = useState<string | null>(null);
  const [generatedOrImprovedContent, setGeneratedOrImprovedContent] = useState<string | null>(null);

  // Reset comparison state when mode changes or story text changes significantly
  useEffect(() => {
    setOriginalContentForComparison(null);
    setGeneratedOrImprovedContent(null);
    setAnalysisResult(null); // Also reset analysis result when mode changes
  }, [mode, currentStoryText, mainIdeasInput]);

  const handleCopy = () => {
    const textToCopy = generatedOrImprovedContent || currentStoryText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Content copied to clipboard!");
    } else {
      toast.info("Nothing to copy.");
    }
  };

  const handleExecuteOperation = async () => {
    setAnalysisResult(null);
    setOriginalContentForComparison(null);
    setGeneratedOrImprovedContent(null);

    let storyInput = "";
    if (mode === "create_from_scratch") {
      storyInput = mainIdeasInput.trim();
      if (!storyInput) {
        toast.error("Please enter your main ideas to create a story.");
        return;
      }
    } else {
      storyInput = currentStoryText.trim();
      if (!storyInput) {
        toast.error("Please enter a user story to proceed.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "analyze") {
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "analyze",
        });
        setAnalysisResult(data as AnalysisResult);
        onStoryPointsUpdate((data as AnalysisResult).recommendedStoryPoints);
        onStoryUpdate(currentStoryText, (data as AnalysisResult).suggestedAcceptanceCriteria);
        toast.success("User story analysis complete!");
      } else if (mode === "review_and_improve") {
        setOriginalContentForComparison(storyInput);
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "review_and_improve",
        });
        if (data && data.newStory) {
          setGeneratedOrImprovedContent(data.newStory);
          toast.success("User story reviewed and improved!");
        } else {
          toast.error("Failed to review and improve story.");
        }
      } else if (mode === "create_from_scratch") {
        setOriginalContentForComparison(storyInput); // Main ideas for comparison
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "create_story_from_scratch",
        });
        if (data) {
          const generated = data as GeneratedStoryOutput;
          setGeneratedOrImprovedContent(`## ${generated.title}\n\n${generated.description}`);
          toast.success("User story generated from ideas!");
        } else {
          toast.error("Failed to generate story from ideas.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to perform operation.");
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
        userStory: currentStoryText,
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
        const updatedCriteria = currentAcceptanceCriteria.map(c =>
          c.id === id ? { ...c, ticked: !c.ticked } : c
        );
        onStoryUpdate(currentStoryText, updatedCriteria);
      }
    }
  };

  const handleDecline = () => {
    setOriginalContentForComparison(null);
    setGeneratedOrImprovedContent(null);
    parentOnDeclineChanges(); // Call the parent's handler
  };

  const showComparisonSection = originalContentForComparison && generatedOrImprovedContent;

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

      {mode === "create_from_scratch" && (
        <Textarea
          placeholder="Describe your main ideas for the user story here (e.g., 'As a user, I want to log in using my email and password. I need to be able to reset my password if I forget it.')."
          value={mainIdeasInput}
          onChange={(e) => onMainIdeasChange(e.target.value)}
          rows={8}
          className="mb-4 bg-[var(--textarea-bg-intermediate)]"
        />
      )}

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={handleCopy} disabled={isLoading || (!currentStoryText.trim() && !mainIdeasInput.trim())}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
        <div className="flex items-center gap-2">
          {mode === "analyze" && analysisResult && analysisResult.qualityLevel !== "Excellent" && (
            <Button type="button" onClick={handleApplySuggestions} disabled={isLoading}>
              {isLoading ? "Applying..." : "Apply Suggestions"}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleExecuteOperation}
            disabled={
              isLoading ||
              (mode === "create_from_scratch" ? !mainIdeasInput.trim() : !currentStoryText.trim())
            }
          >
            {isLoading ? "Processing..." : <><Sparkles className="mr-2 h-4 w-4" /> Execute Operation</>}
          </Button>
        </div>
      </div>

      {showComparisonSection && (
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
          <h4 className="text-lg font-semibold">Review Changes</h4>
          <div className={`grid gap-4 ${mode === "review_and_improve" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
            {mode !== "review_and_improve" && ( // Only show original if not in review_and_improve mode
              <div>
                <p className="font-medium mb-2">
                  {mode === "create_from_scratch" ? "Your Main Ideas" : "Original Story"}
                </p>
                <Textarea value={originalContentForComparison || ""} rows={10} readOnly className="bg-muted resize-none" />
              </div>
            )}
            <div>
              <p className="font-medium mb-2">
                {mode === "create_from_scratch" ? "Generated Story" : "Improved Story"}
              </p>
              <Textarea value={generatedOrImprovedContent || ""} rows={10} readOnly className="bg-muted resize-none" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleDecline} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button type="button" onClick={() => onAcceptChanges(generatedOrImprovedContent || "")} disabled={isLoading}>
              <Check className="mr-2 h-4 w-4" /> Accept
            </Button>
          </div>
        </div>
      )}

      {analysisResult && mode === "analyze" && (
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
            </>
          )}

          <h4 className="text-lg font-semibold mt-4">Suggested Acceptance Criteria</h4>
          <div className="space-y-3">
            {currentAcceptanceCriteria.map((criteria) => (
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