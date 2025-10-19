"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { invokeAIAnalysis } from "@/utils/ai";

interface Suggestion {
  id: string;
  text: string;
  example?: string;
  ticked: boolean;
  type?: "improvement" | "acceptance"; // Add this type property
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

interface ModeSpecificResults {
  analysisResult: AnalysisResult | null;
  originalContentForComparison: string | null;
  generatedTitle: string | null; // For create_from_scratch and apply_suggestions
  generatedDescription: string | null; // For create_from_scratch and apply_suggestions
  improvedStoryText: string | null; // For review_and_improve (plain text)
  isApplyingSuggestionsReview: boolean; // New flag for apply suggestions comparison
}

const initialModeResults: ModeSpecificResults = {
  analysisResult: null,
  originalContentForComparison: null,
  generatedTitle: null,
  generatedDescription: null,
  improvedStoryText: null,
  isApplyingSuggestionsReview: false,
};

interface StoryAssistantProps {
  currentStoryText: string;
  currentAcceptanceCriteria: Suggestion[];
  onStoryUpdate: (newStory: string, newAcceptanceCriteria: Suggestion[], newTitle?: string) => void; // Updated signature
  onStoryPointsUpdate: (points: number) => void;
  mode: "analyze" | "review_and_improve" | "create_from_scratch";
  onAcceptChanges: (newStory: string, newTitle?: string) => void; // Updated to pass newTitle
  onDeclineChanges: (originalContent: string | null) => void;
}

const StoryAssistant: React.FC<StoryAssistantProps> = ({
  currentStoryText,
  currentAcceptanceCriteria,
  onStoryUpdate,
  onStoryPointsUpdate,
  mode,
  onAcceptChanges,
  onDeclineChanges,
}) => {
  const [llmModel, setLlmModel] = useState<string>("gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State to store results for each mode
  const [analyzeModeState, setAnalyzeModeState] = useState<ModeSpecificResults>(initialModeResults);
  const [reviewModeState, setReviewModeState] = useState<ModeSpecificResults>(initialModeResults);
  const [createModeState, setCreateModeState] = useState<ModeSpecificResults>(initialModeResults);

  // State for currently displayed results
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentOriginalContentForComparison, setCurrentOriginalContentForComparison] = useState<string | null>(null);
  const [currentGeneratedOrImprovedContent, setCurrentGeneratedOrImprovedContent] = useState<string | null>(null);

  // Effect to update displayed results when mode changes
  useEffect(() => {
    if (mode === "analyze") {
      setCurrentAnalysisResult(analyzeModeState.analysisResult);
      setCurrentOriginalContentForComparison(analyzeModeState.originalContentForComparison);
      setCurrentGeneratedOrImprovedContent(
        analyzeModeState.generatedTitle && analyzeModeState.generatedDescription
          ? `## ${analyzeModeState.generatedTitle}\n\n${analyzeModeState.generatedDescription}`
          : null
      );
    } else if (mode === "review_and_improve") {
      setCurrentAnalysisResult(reviewModeState.analysisResult); // Will be null for this mode
      setCurrentOriginalContentForComparison(reviewModeState.originalContentForComparison);
      setCurrentGeneratedOrImprovedContent(reviewModeState.improvedStoryText); // Plain text
    } else if (mode === "create_from_scratch") {
      setCurrentAnalysisResult(createModeState.analysisResult); // Will be null for this mode
      setCurrentOriginalContentForComparison(createModeState.originalContentForComparison);
      // Format for display from stored title/description
      setCurrentGeneratedOrImprovedContent(
        createModeState.generatedTitle && createModeState.generatedDescription
          ? `## ${createModeState.generatedTitle}\n\n${createModeState.generatedDescription}`
          : null
      );
    }
  }, [mode, analyzeModeState, reviewModeState, createModeState]);

  const handleCopy = () => {
    const textToCopy = currentGeneratedOrImprovedContent || currentStoryText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Content copied to clipboard!");
    } else {
      toast.info("Nothing to copy.");
    }
  };

  const handleExecuteOperation = async () => {
    // Clear current mode's comparison results before executing a new operation
    if (mode === "analyze") {
      setAnalyzeModeState(prev => ({ ...prev, originalContentForComparison: null, generatedTitle: null, generatedDescription: null, isApplyingSuggestionsReview: false }));
    } else if (mode === "review_and_improve") {
      setReviewModeState(initialModeResults);
    } else if (mode === "create_from_scratch") {
      setCreateModeState(initialModeResults);
    }

    const storyInput = currentStoryText.trim();
    if (!storyInput) {
      toast.error(
        mode === "create_from_scratch"
          ? "Please enter your main ideas in the Description field to create a story."
          : "Please enter a user story in the Description field to proceed."
      );
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "analyze") {
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "analyze",
        });
        setAnalyzeModeState(prev => ({ ...prev, analysisResult: data as AnalysisResult }));
        onStoryPointsUpdate((data as AnalysisResult).recommendedStoryPoints);
        onStoryUpdate(currentStoryText, (data as AnalysisResult).suggestedAcceptanceCriteria);
        toast.success("User story analysis complete!");
      } else if (mode === "review_and_improve") {
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "review_and_improve",
        });
        if (data && data.newStory) {
          setReviewModeState(prev => ({ ...prev, originalContentForComparison: storyInput, improvedStoryText: data.newStory }));
          toast.success("User story reviewed and improved!");
        } else {
          toast.error("Failed to review and improve story.");
        }
      } else if (mode === "create_from_scratch") {
        const data = await invokeAIAnalysis({
          userStory: storyInput,
          llmModel,
          operationMode: "create_story_from_scratch",
        });
        if (data) {
          const generated = data as GeneratedStoryOutput;
          setCreateModeState(prev => ({
            ...prev,
            originalContentForComparison: storyInput,
            generatedTitle: generated.title,
            generatedDescription: generated.description,
          }));
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
    if (!currentAnalysisResult) return;

    const combinedTickedSuggestions = [
      ...currentAnalysisResult.improvementSuggestions.filter(s => s.ticked).map(s => ({ ...s, type: "improvement" as const })),
      ...currentAcceptanceCriteria.filter(c => c.ticked).map(c => ({ ...c, type: "acceptance" as const })),
    ];

    if (combinedTickedSuggestions.length === 0) {
      toast.info("No suggestions or acceptance criteria selected to apply.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await invokeAIAnalysis({
        userStory: currentStoryText,
        llmModel,
        operationMode: "apply_suggestions",
        suggestions: combinedTickedSuggestions, // Send the combined array
      });

      if (data && data.title && data.description) { // Expecting title and description
        setAnalyzeModeState(prev => ({
          ...prev,
          originalContentForComparison: currentStoryText, // Store the current story from the form
          generatedTitle: data.title,
          generatedDescription: data.description,
          isApplyingSuggestionsReview: true, // Set flag to true for comparison
        }));
        toast.success("Suggestions applied! Review the generated story below.");
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
    if (currentAnalysisResult) {
      if (type === "improvement") {
        setAnalyzeModeState(prev => ({
          ...prev,
          analysisResult: prev.analysisResult ? {
            ...prev.analysisResult,
            improvementSuggestions: prev.analysisResult.improvementSuggestions.map(s =>
              s.id === id ? { ...s, ticked: !s.ticked } : s
            ),
          } : null,
        }));
      } else {
        const updatedCriteria = currentAcceptanceCriteria.map(c =>
          c.id === id ? { ...c, ticked: !c.ticked } : c
        );
        onStoryUpdate(currentStoryText, updatedCriteria);
      }
    }
  };

  const handleDecline = () => {
    let originalContentToRestore: string | null = null;
    if (mode === "analyze") {
      originalContentToRestore = analyzeModeState.originalContentForComparison;
      setAnalyzeModeState(prev => ({
        ...prev,
        originalContentForComparison: null,
        generatedTitle: null,
        generatedDescription: null,
        isApplyingSuggestionsReview: false, // Reset flag
      }));
    } else if (mode === "review_and_improve") {
      originalContentToRestore = reviewModeState.originalContentForComparison;
      setReviewModeState(initialModeResults);
    } else if (mode === "create_from_scratch") {
      originalContentToRestore = createModeState.originalContentForComparison;
      setCreateModeState(initialModeResults);
    }
    onDeclineChanges(originalContentToRestore); // Pass the original content back
  };

  const handleAccept = () => {
    let newContent = "";
    let newTitle: string | undefined = undefined;

    if (mode === "review_and_improve" && reviewModeState.improvedStoryText) {
      newContent = reviewModeState.improvedStoryText;
    } else if (mode === "create_from_scratch" && createModeState.generatedDescription) {
      newContent = createModeState.generatedDescription;
      newTitle = createModeState.generatedTitle || undefined;
    } else if (mode === "analyze" && analyzeModeState.generatedDescription) { // For apply_suggestions flow
      newContent = analyzeModeState.generatedDescription;
      newTitle = analyzeModeState.generatedTitle || undefined;
    }

    if (newContent) {
      onAcceptChanges(newContent, newTitle); // Pass newTitle
      // Clear the state for the current mode after accepting
      if (mode === "analyze") {
        setAnalyzeModeState(prev => ({
          ...prev,
          originalContentForComparison: null,
          generatedTitle: null,
          generatedDescription: null,
          isApplyingSuggestionsReview: false, // Reset flag
        }));
      } else if (mode === "review_and_improve") {
        setReviewModeState(initialModeResults);
      } else if (mode === "create_from_scratch") {
        setCreateModeState(initialModeResults);
      }
    } else {
      toast.error("No content to accept.");
    }
  };

  const showComparisonSection = currentOriginalContentForComparison && currentGeneratedOrImprovedContent;

  // Determine if the comparison should be single column (only generated/improved story)
  const isSingleColumnComparison = mode === "review_and_improve" || mode === "create_from_scratch" || (mode === "analyze" && analyzeModeState.isApplyingSuggestionsReview);

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

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={handleCopy} disabled={isLoading || !currentStoryText.trim()}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
        <div className="flex items-center gap-2">
          {mode === "analyze" && currentAnalysisResult && currentAnalysisResult.qualityLevel !== "Excellent" && !analyzeModeState.isApplyingSuggestionsReview && (
            <Button type="button" onClick={handleApplySuggestions} disabled={isLoading}>
              {isLoading ? "Applying..." : "Apply Suggestions"}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleExecuteOperation}
            disabled={isLoading || !currentStoryText.trim()}
          >
            {isLoading ? "Processing..." : <><Sparkles className="mr-2 h-4 w-4" /> Execute Operation</>}
          </Button>
        </div>
      </div>

      {showComparisonSection && (
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
          <h4 className="text-lg font-semibold">Review Changes</h4>
          <div className={`grid gap-4 ${isSingleColumnComparison ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
            {!isSingleColumnComparison && (
              <div>
                <p className="font-medium mb-2">
                  {mode === "create_from_scratch" ? "Your Main Ideas" : "Original Story"}
                </p>
                <Textarea value={currentOriginalContentForComparison || ""} rows={10} readOnly className="bg-muted resize-none" />
              </div>
            )}
            <div>
              <p className="font-medium mb-2">
                {mode === "create_from_scratch" || (mode === "analyze" && analyzeModeState.generatedDescription) ? "Generated Story" : "Improved Story"}
              </p>
              <Textarea value={currentGeneratedOrImprovedContent || ""} rows={10} readOnly className="bg-muted resize-none" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleDecline} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button type="button" onClick={handleAccept} disabled={isLoading}>
              <Check className="mr-2 h-4 w-4" /> Accept Changes
            </Button>
          </div>
        </div>
      )}

      {currentAnalysisResult && mode === "analyze" && (
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-xl font-bold">{currentAnalysisResult.qualityScore}/100</p>
            </div>
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Level</p>
              <p className="text-xl font-bold">{currentAnalysisResult.qualityLevel}</p>
            </div>
            <div className="p-3 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Story Points</p>
              <p className="text-xl font-bold">{currentAnalysisResult.recommendedStoryPoints}</p>
            </div>
          </div>

          {currentAnalysisResult.qualityLevel !== "Excellent" && (
            <>
              <h4 className="text-lg font-semibold mt-4">Improvement Suggestions</h4>
              <div className="space-y-3">
                {currentAnalysisResult.improvementSuggestions.map((suggestion) => (
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

          {currentAnalysisResult.similarHistoricalStories.length > 0 && (
            <>
              <h4 className="text-lg font-semibold mt-4">Similar Historical Stories</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {currentAnalysisResult.similarHistoricalStories
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