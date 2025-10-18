"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Sparkles, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

// Mock data interfaces (will be replaced by actual LLM output)
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

const UserStoryQualityAnalyzer: React.FC = () => {
  const [userStory, setUserStory] = useState<string>("");
  const [operationMode, setOperationMode] = useState<string>("analyze");
  const [llmModel, setLlmModel] = useState<string>("gemini-2.5-flash"); // Changed default to "gemini-2.5-flash"
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userStory);
    toast.success("User story copied to clipboard!");
  };

  const invokeEdgeFunction = async (mode: string, story: string, suggestions?: Suggestion[]) => {
    setIsLoading(true);
    try {
      const payload: { userStory: string; llmModel: string; operationMode: string; suggestions?: Suggestion[] } = {
        userStory: story,
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
        toast.error(`Analysis failed: ${error.message}`);
        setAnalysisResult(null);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error during Edge Function invocation:", err);
      toast.error("An unexpected error occurred during analysis.");
      setAnalysisResult(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeStory = async () => {
    const data = await invokeEdgeFunction("analyze", userStory);
    if (data) {
      setAnalysisResult(data as AnalysisResult);
      toast.success("User story analysis complete!");
    }
  };

  const handleReset = () => {
    setUserStory("");
    setAnalysisResult(null);
    setIsLoading(false);
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4 text-center">User Story Quality Analyzer</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Enhance your user stories with AI-powered analysis, suggestions, and acceptance criteria generation.
      </p>

      {/* Dynamic Header Section */}
      {analysisResult && (
        <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex items-center justify-between">
          {analysisResult.qualityLevel === "Excellent" ? (
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">Story ready to go! 🎉</span>
          ) : (
            <Button onClick={handleApplySuggestions} disabled={isLoading}>
              {isLoading ? "Applying..." : "Apply Suggestions"}
            </Button>
          )}
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
              {/* Other modes will be added here */}
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
        <h2 className="text-2xl font-semibold mb-4">Enter Your User Story</h2>
        <Textarea
          placeholder="Paste or type your user story here..."
          value={userStory}
          onChange={(e) => setUserStory(e.target.value)}
          rows={8}
          className="mb-4 bg-[var(--textarea-bg-intermediate)]"
        />
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <div className="space-x-2">
            <Button onClick={handleAnalyzeStory} disabled={isLoading || !userStory}>
              {isLoading ? "Analyzing..." : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Story</>}
            </Button>
            <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Analysis Results Section */}
      {analysisResult && (
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

      {/* Similar Historical Stories Section */}
      {analysisResult && analysisResult.similarHistoricalStories.length > 0 && (
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Similar Historical Stories</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Story ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Feature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Matching %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analysisResult.similarHistoricalStories
                  .sort((a, b) => b.matchingPercentage - a.matchingPercentage)
                  .map((story) => (
                    <tr key={story.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {story.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {story.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {story.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {story.featureName} ({story.featureId})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <span className="font-semibold">{story.matchingPercentage}%</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStoryQualityAnalyzer;