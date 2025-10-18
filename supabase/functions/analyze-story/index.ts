import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userStory, llmModel, operationMode, suggestions } = await req.json();

    if (!userStory) {
      return new Response(JSON.stringify({ error: 'User story is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Supabase client (if needed for database interactions within the function)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    let apiUrl = "";
    let headers: Record<string, string> = {};
    let requestBody: any = {};
    let modelToUse = llmModel || "gpt-4o"; // Default to gpt-4o if not specified

    let promptContent = "";
    let responseFormat: "application/json" | "text/plain" = "application/json";

    if (operationMode === "analyze") {
      promptContent = `Analyze the following user story for quality, provide improvement suggestions, suggest acceptance criteria, and find similar historical stories. Return the output as a JSON object with the following structure:
      {
        "qualityScore": number (0-100),
        "qualityLevel": string ("Excellent" , "Good", "Needs Improvements", "Poor"),
        "recommendedStoryPoints": number,
        "improvementSuggestions": [{ "id": string, "text": string, "example": string, "ticked": boolean }],
        "suggestedAcceptanceCriteria": [{ "id": string, "text": string, "example": string, "ticked": boolean }],
        "similarHistoricalStories": [{ "id": string, "title": string, "status": string, "featureId": string, "featureName": string, "matchingPercentage": number }]
      }
      
      User Story: "${userStory}"
      
      Ensure all 'id' fields are unique strings. For 'ticked', default to true for suggestions/criteria that are generally good practices or directly applicable, and false for more advanced or optional ones. For 'similarHistoricalStories', generate 3 plausible mock stories with varying matching percentages.`;
      responseFormat = "application/json";
    } else if (operationMode === "apply_suggestions") {
        promptContent = `Given the original user story and a list of suggestions, rewrite the user story to incorporate the suggestions. Return only the new user story text as a string.
        Original User Story: "${userStory}"
        Suggestions: ${JSON.stringify(suggestions || [])}`;
        responseFormat = "text/plain";
    } else if (operationMode === "review_and_improve") {
        promptContent = `Review the following user story for grammatical errors, clarity, and minor wording improvements. Do not make significant changes to the meaning or scope. Return only the improved user story text as a string.
        User Story: "${userStory}"`;
        responseFormat = "text/plain";
    } else if (operationMode === "create_story_from_scratch") {
        promptContent = `Generate a user story based on the following main ideas. The output should be a JSON object with a 'title' and a 'description'. The 'description' should be comprehensive, including the user story itself, a 'Details:' section for context, a 'Scope:' section for actionable items, and an 'Acceptance Criteria:' section with bullet points for what will be checked to accept the story when completed.
        
        Main Ideas: "${userStory}"
        
        Return the output as a JSON object with the following structure:
        {
          "title": "string",
          "description": "string" // This string should include the user story, 'Details:', 'Scope:', and 'Acceptance Criteria:' sections.
        }
        
        Ensure the acceptance criteria are formatted as bullet points within the 'Acceptance Criteria:' section of the description.`;
        responseFormat = "application/json";
    } else {
        return new Response(JSON.stringify({ error: 'Invalid operation mode.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    if (modelToUse.startsWith("gpt")) {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set in Supabase secrets.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      };
      requestBody = {
        model: modelToUse,
        messages: [{ role: 'user', content: promptContent }],
        temperature: 0.7,
      };
      if (responseFormat === "application/json") {
        requestBody.response_format = { type: "json_object" };
      }
    } else if (modelToUse.startsWith("gemini")) {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiApiKey) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in Supabase secrets.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiApiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      requestBody = {
        contents: [{
          parts: [{ text: promptContent }]
        }],
        generationConfig: {
          responseMimeType: responseFormat,
          temperature: 0.7,
        },
      };
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported LLM model.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LLM API error:", errorData);
      return new Response(JSON.stringify({ error: `LLM API error: ${errorData.error?.message || response.statusText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const data = await response.json();
    let llmOutput;

    if (modelToUse.startsWith("gpt")) {
      llmOutput = data.choices[0].message.content;
    } else if (modelToUse.startsWith("gemini")) {
      llmOutput = data.candidates[0].content.parts[0].text;
    }

    if (operationMode === "apply_suggestions" || operationMode === "review_and_improve") {
        return new Response(JSON.stringify({ newStory: llmOutput }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // For 'analyze' and 'create_story_from_scratch', parse JSON
    const parsedOutput = JSON.parse(llmOutput);

    return new Response(JSON.stringify(parsedOutput), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});