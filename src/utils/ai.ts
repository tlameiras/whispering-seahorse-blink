import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  id: string;
  text: string;
  example: string;
  ticked: boolean;
}

interface InvokeAIAnalysisPayload {
  userStory: string;
  llmModel: string;
  operationMode: "analyze" | "apply_suggestions";
  suggestions?: Suggestion[];
}

export const invokeAIAnalysis = async (payload: InvokeAIAnalysisPayload) => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-story', {
      body: payload,
    });

    if (error) {
      console.error("Error invoking Edge Function:", error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error during AI Edge Function invocation:", err);
    throw new Error("An unexpected error occurred during AI analysis.");
  }
};