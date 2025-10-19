"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Sparkles, RefreshCcw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Import Card components

// Mock data interfaces (will be replaced by actual LLM output)
interface Suggestion {
  id: string;
  text: string;
  example?: string; // example is optional
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
  description: string; // Now includes Acceptance Criteria
}

const UserStoryQualityAnalyzer: React.FC = () => {
  const [userStory, setUserStory] = useState<string>(""); // For existing story analysis/improvement
  const [mainIdeas, setMainIdeas] = useState<string>(""); // For creating story from scratch
  const [operationMode, setOperationMode] = useState<string>("analyze");
  const [llmModel, setLlmModel] = useState<string>("gemini-2.5-flash");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [originalStoryForComparison, setOriginalStoryForComparison] = useState<string | null>(null);
  const [improvedStory, setImprovedStory] = useState<string | null>(null);
  const [generatedStoryOutput, setGeneratedStoryOutput] = useState<GeneratedStoryOutput | null>(null); // Keep for internal data structure

  const handleCopy = () => {
    // Copy either the current userStory or the improvedStory if it's being reviewed
    const textToCopy = improvedStory || userStory;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Content copied to clipboard!");
    } else {
      toast.info("Nothing to copy.");
    }
  };

  const invokeEdgeFunction = async (mode: string, storyInput: string, suggestions?: Suggestion[]) => {
    setIsLoading(true);
    try {
      const payload: { userStory: string; llmModel: string; operationMode: string; suggestions?: Suggestion[] } = {
        userStory: storyInput,
        llmModel,
        operationMode: mode,
      };
      if (suggestions) {
        payload.suggestions = suggestions;
      }

      const { data, error } = await supabase.functions.invoke('analyze-story', {
        body: payload,
      });

      if (error) {
        console.error("Error invoking Edge Function:", error);
        toast.error(`Operation failed: ${error.message}`);
        setAnalysisResult(null);
        setImprovedStory(null);
        setOriginalStoryForComparison(null);
        setGeneratedStoryOutput(null);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error during Edge Function invocation:", err);
      toast.error("An unexpected error occurred during the operation.");
      setAnalysisResult(null);
      setImprovedStory(null);
      setOriginalStoryForComparison(null);
      setGeneratedStoryOutput(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteOperation = async () => {
    // Clear all previous results before new operation
    setAnalysisResult(null);
    setImprovedStory(null);
    setOriginalStoryForComparison(null);
    setGeneratedStoryOutput(null);

    let storyInput = "";
    if (operationMode === "create_story_from_scratch") {
      storyInput = mainIdeas.trim();
      if (!storyInput) {
        toast.error("Please enter your main ideas to create a story.");
        return;
      }
    } else {
      storyInput = userStory.trim();
      if (!storyInput) {
        toast.error("Please enter a user story to proceed.");
        return;
      }
    }

    if (operationMode === "analyze") {
      const data = await invokeEdgeFunction("analyze", storyInput);
      if (data) {
        setAnalysisResult(data as AnalysisResult);
        toast.success("User story analysis complete!");
      }
    } else if (operationMode === "review_and_improve") {
      setOriginalStoryForComparison(storyInput); // Store original for comparison
      const data = await invokeEdgeFunction("review_and_improve", storyInput);
      if (data && data.newStory) {
        setImprovedStory(data.newStory);
        toast.success("User story reviewed and improved!");
      } else {
        toast.error("Failed to review and improve story.");
      }
    } else if (operationMode === "create_story_from_scratch") {
      const data = await invokeEdgeFunction("create_story_from_scratch", storyInput);
      if (data) {
        const generated = data as GeneratedStoryOutput;
        setGeneratedStoryOutput(generated); // Store the structured output
        setOriginalStoryForComparison(mainIdeas); // Original input for comparison
        // Format the generated story for side-by-side display
        setImprovedStory(`## ${generated.title}\n\n${generated.description}`);
        toast.success("User story generated from ideas!");
      } else {
        toast.error("Failed to generate story from ideas.");
      }
    }
  };

  const handleReset = () => {
    setUserStory("");
    setMainIdeas("");
    setAnalysisResult(null);
    setIsLoading(false);
    setOriginalStoryForComparison(null);
    setImprovedStory(null);
    setGeneratedStoryOutput(null);
    toast.info("Analyzer reset to initial state.");
  };

  const handleApplySuggestions = async () => {
    if (!analysisResult) return;

    const tickedSuggestions = analysisResult.improvementSuggestions.filter(s => s.ticked);
    const data = await invokeEdgeFunction("apply_suggestions", userStory, tickedSuggestions);
    
    if (data && data.newStory) {
      setUserStory(data.newStory);
      setAnalysisResult(null); // Reset analysis to allow re-analysis of the new story
      toast.success("Suggestions applied and new story generated!");
    } else {
        toast.error("Failed to apply suggestions.");
    }
  };

  const handleAcceptChanges = () => {
    if (operationMode === "review_and_improve" && improvedStory) {
      setUserStory(improvedStory);
      setImprovedStory(null);
      setOriginalStoryForComparison(null);
      toast.success("Improved story accepted!");
    } else if (operationMode === "create_story_from_scratch" && generatedStoryOutput) {
      setUserStory(generatedStoryOutput.description); // Set the description as the main story
      // Optionally, you could also set the title if you had a separate title field for userStory
      setImprovedStory(null);
      setOriginalStoryForComparison(null);
      setGeneratedStoryOutput(null);
      setMainIdeas(""); // Clear main ideas after accepting
      setOperationMode("analyze"); // Switch to analyze mode after accepting
      toast.success("Generated story accepted and loaded!");
    }
  };

  const handleDeclineChanges = () => {
    setImprovedStory(null);
    setOriginalStoryForComparison(null);
    setGeneratedStoryOutput(null); // Clear generated output as well
    if (operationMode === "create_story_from_scratch") {
      setMainIdeas(""); // Clear main ideas if declined
    }
    toast.info("Changes declined.");
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
        setAnalysisResult({
          ...analysisResult,
          suggestedAcceptanceCriteria: analysisResult.suggestedAcceptanceCriteria.map(s =>
            s.id === id ? { ...s, ticked: !s.ticked } : s
          ),
        });
      }
    }
  };

  const showComparisonSection = (improvedStory && originalStoryForComparison) && 
                               (operationMode === "review_and_improve" || operationMode === "create_story_from_scratch");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4 text-center">User Story Quality Analyzer</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Enhance your user stories with AI-powered analysis, suggestions, and acceptance criteria generation.
      </p>

      {/* Dynamic Header Section - Removed Apply Suggestions button from here */}
      {analysisResult && operationMode === "analyze" && analysisResult.qualityLevel === "Excellent" && (
        <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex items-center justify-center">
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">Story ready to go! 🎉</span>
        </div>
      )}

      {/* Operation Mode and LLM Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label htmlFor="operation-mode" className="block text-sm font-medium text-foreground mb-2">
            Operation Mode
          </label>
          <Select value={operationMode} onValueChange={setOperationMode}>
            <SelectTrigger id="operation-mode" className="bg-card">
              <SelectValue placeholder="Select operation mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analyze">Analyze the quality of the story</SelectItem>
              <SelectItem value="review_and_improve">Review and improve the story</SelectItem>
              <SelectItem value="create_story_from_scratch">Create story from scratch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="llm-model" className="block text-sm font-medium text-foreground mb-2">
            LLM Model
          </label>
          <Select value={llmModel} onValueChange={setLlmModel}>
            <SelectTrigger id="llm-model" className="bg-card">
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

      {/* User Story Input Section */}
      <div className="mb-8 p-6 border rounded-lg bg-card shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">
          {operationMode === "create_story_from_scratch" ? "Enter Main Ideas" : "Enter Your User Story"}
        </h2>
        <Textarea
          placeholder={
            operationMode === "create_story_from_scratch"
              ? "Describe your main ideas for the user story here (e.g., 'As a user, I want to log in using my email and password. I need to be able to reset my password if I forget it.')."
              : "Paste or type your user story here..."
          }
          value={operationMode === "create_story_from_scratch" ? mainIdeas : userStory}
          onChange={(e) =>
            operationMode === "create_story_from_scratch"
              ? setMainIdeas(e.target.value)
              : setUserStory(e.target.value)
          }
          rows={8}
          className="mb-4 bg-[var(--textarea-bg-intermediate)]"
        />
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleCopy} disabled={isLoading}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <div className="flex items-center gap-2"> {/* Changed to flex items-center gap-2 */}
            {/* Moved Apply Suggestions button here */}
            {analysisResult && operationMode === "analyze" && analysisResult.qualityLevel !== "Excellent" && (
              <Button onClick={handleApplySuggestions} disabled={isLoading}>
                {isLoading ? "Applying..." : "Apply Suggestions"}
              </Button>
            )}
            <Button onClick={handleExecuteOperation} disabled={isLoading || (operationMode === "create_story_from_scratch" ? !mainIdeas.trim() : !userStory.trim())}>
              {isLoading ? "Processing..." : <><Sparkles className="mr-2 h-4 w-4" /> Execute Operation</>}
            </Button>
            <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Section (for both review_and_improve and create_story_from_scratch) */}
      {showComparisonSection && (
        <div className="mb-8 p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">
            {operationMode === "create_story_from_scratch" ? "Review Generated Story" : "Review Improvements"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {operationMode === "create_story_from_scratch" ? "Main Ideas" : "Original Story"}
              </h3>
              <Textarea
                value={originalStoryForComparison || ""}
                rows={10}
                readOnly
                className="bg-muted resize-none"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {operationMode === "create_story_from_scratch" ? "Generated Story" : "Improved Story"}
              </h3>
              <Textarea
                value={improvedStory || ""}
                rows={10}
                readOnly
                className="bg-muted resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDeclineChanges} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" /> Decline Changes
            </Button>
            <Button onClick={handleAcceptChanges} disabled={isLoading}>
              <Check className="mr-2 h-4 w-4" /> Accept Changes
            </Button>
          </div>
        </div>
      )}

      {/* Analysis Results Section */}
      {analysisResult && operationMode === "analyze" && (
        <div className="mb-8 p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold">{analysisResult.qualityScore}/100</p>
            </div>
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Quality Level</p>
              <p className="text-2xl font-bold">{analysisResult.qualityLevel}</p>
            </div>
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Recommended Story Points</p>
              <p className="text-2xl font-bold">{analysisResult.recommendedStoryPoints}</p>
            </div>
          </div>

          {analysisResult.qualityLevel !== "Excellent" && (
            <>
              <h3 className="text-xl font-semibold mb-4">Improvement Suggestions</h3>
              <div className="space-y-4 mb-6">
                {analysisResult.improvementSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-start space-x-2 p-3 border rounded-md bg-secondary">
                    <input
                      type="checkbox"
                      checked={suggestion.ticked}
                      onChange={() => handleSuggestionToggle("improvement", suggestion.id)}
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium">{suggestion.text}</p>
                      {suggestion.example && (
                        <p className="text-sm text-muted-foreground italic">Example: "{suggestion.example}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold mb-4">Suggested Acceptance Criteria</h3>
              <div className="space-y-4 mb-6">
                {analysisResult.suggestedAcceptanceCriteria.map((criteria) => (
                  <div key={criteria.id} className="flex items-start space-x-2 p-3 border rounded-md bg-secondary">
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
            </>
          )}
        </div>
      )}

      {/* Similar Historical Stories Section - Refactored to use Cards */}
      {analysisResult && analysisResult.similarHistoricalStories.length > 0 && operationMode === "analyze" && (
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Similar Historical Stories</h2>
          <div className="space-y-4">
            {analysisResult.similarHistoricalStories
              .sort((a, b) => b.matchingPercentage - a.matchingPercentage)
              .map((story) => (
                <Card key={story.id} className="w-full">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg font-bold">{story.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {story.id} | {story.status}
                      </CardDescription>
                      <CardDescription className="text-sm text-muted-foreground">
                        {story.featureName} | {story.featureId}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{story.matchingPercentage}%</p>
                      <p className="text-sm text-muted-foreground">Matching</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStoryQualityAnalyzer;