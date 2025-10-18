# App Guide: Internal Tools Hub

This document provides a comprehensive overview of the Internal Tools Hub application, focusing on its purpose, architecture, and instructions for maintenance and extension.

## What the App Does
The Internal Tools Hub is designed to centralize various internal utilities. Currently, its primary feature is the **User Story Quality Analyzer**. This tool allows users to:
*   Input a user story.
*   Receive an AI-generated quality score and level for the story.
*   Get actionable improvement suggestions.
*   Generate relevant acceptance criteria.
*   Discover similar historical user stories from a mock dataset (can be extended to a real database).
*   Apply selected suggestions to automatically rewrite the user story.

The goal is to streamline the user story refinement process, improve story quality, and foster consistency across projects.

## How It Works (Architecture Overview)

The application follows a client-server architecture, with a React frontend interacting with a Supabase backend.

1.  **Frontend (React Application)**:
    *   Built with React and TypeScript using Vite.
    *   Uses Tailwind CSS and `shadcn/ui` for a modern, responsive user interface.
    *   React Router handles client-side navigation.
    *   The `UserStoryQualityAnalyzer` page (`src/pages/UserStoryQualityAnalyzer.tsx`) is the core UI for the analysis feature.
    *   It captures user input (user story, selected LLM model) and displays the analysis results.
    *   It communicates with the Supabase Edge Function for all AI-related processing.

2.  **Backend (Supabase Edge Function)**:
    *   A Deno-based serverless function (`supabase/functions/analyze-story/index.ts`) hosted on Supabase.
    *   Acts as an intermediary between the React frontend and external Large Language Models (LLMs).
    *   Crucially, it handles sensitive API keys for LLMs, preventing their exposure on the client-side.
    *   Performs the actual calls to OpenAI or Google Gemini APIs.

3.  **Large Language Models (LLMs)**:
    *   The Edge Function supports integration with OpenAI (e.g., GPT-4o) and Google Gemini (e.g., Gemini 1.5 Pro).
    *   It sends carefully crafted prompts to the selected LLM to perform user story analysis or rewriting.

4.  **Supabase Client Integration**:
    *   The `src/integrations/supabase/client.ts` file initializes the Supabase client, used by the frontend to invoke the Edge Function.

## Core Logic and Components

### `src/pages/UserStoryQualityAnalyzer.tsx`
*   **State Management**: Uses `useState` hooks for `userStory`, `operationMode`, `llmModel`, `analysisResult`, and `isLoading`.
*   **`invokeEdgeFunction`**: An asynchronous function responsible for calling the Supabase Edge Function. It constructs the payload with the user story, selected LLM model, and operation mode (e.g., "analyze", "apply_suggestions").
*   **`handleAnalyzeStory`**: Triggers the `invokeEdgeFunction` in "analyze" mode and updates `analysisResult` with the parsed JSON response.
*   **`handleApplySuggestions`**: Filters `ticked` suggestions from `analysisResult` and calls `invokeEdgeFunction` in "apply_suggestions" mode to get a rewritten story.
*   **`handleSuggestionToggle`**: Manages the `ticked` state of individual improvement suggestions and acceptance criteria.
*   **UI Structure**: Organizes input fields, action buttons, and displays analysis results in a clear, responsive layout using `shadcn/ui` components (e.g., `Textarea`, `Button`, `Select`, `Card`).

### `supabase/functions/analyze-story/index.ts` (Supabase Edge Function)
*   **Entry Point**: `serve(async (req) => { ... })` handles incoming HTTP requests.
*   **CORS Handling**: Includes `corsHeaders` and an `OPTIONS` request handler to allow cross-origin requests from the frontend.
*   **Request Parsing**: Extracts `userStory`, `llmModel`, `operationMode`, and `suggestions` from the request body.
*   **LLM API Selection**: Dynamically sets `apiUrl`, `headers`, and `requestBody` based on the `llmModel` (GPT or Gemini).
*   **Prompt Construction**: Generates specific prompts for "analyze" and "apply_suggestions" operations, guiding the LLM's output format and content.
    *   **"analyze" prompt**: Requests a JSON object with quality score, level, story points, suggestions, acceptance criteria, and mock similar stories.
    *   **"apply_suggestions" prompt**: Requests a plain string representing the rewritten user story.
*   **API Key Management**: Retrieves `OPENAI_API_KEY` or `GEMINI_API_KEY` from Deno environment variables (which are mapped to Supabase secrets).
*   **Error Handling**: Catches errors from LLM API calls and provides informative responses.
*   **Supabase Client (within Edge Function)**: `createClient` is used if the function needs to interact with the Supabase database directly (e.g., to fetch real historical stories or save analysis results). Currently, it's initialized but not actively used for database operations in the provided code.

## Instructions to Update/Extend

### Adding New LLM Models
1.  **Frontend (`src/pages/UserStoryQualityAnalyzer.tsx`)**:
    *   Add a new `SelectItem` to the "LLM Model" `SelectContent` with the `value` corresponding to your new model's identifier (e.g., `llama-3`).
2.  **Edge Function (`supabase/functions/analyze-story/index.ts`)**:
    *   Add a new `else if` block to handle your new `llmModel`.
    *   Define the `apiUrl`, `headers`, and `requestBody` specific to your new LLM provider's API.
    *   Ensure any required API keys are added as [Supabase Secrets](https://supabase.com/dashboard/project/txxrnhaelqdjlmpbrxyr/edge-functions/secrets) and retrieved using `Deno.env.get('YOUR_NEW_API_KEY')`.
    *   Adjust the `llmOutput` parsing logic if the new LLM's response structure differs.

### Modifying LLM Prompts
*   **Edge Function (`supabase/functions/analyze-story/index.ts`)**:
    *   Locate the `promptContent` variable.
    *   Modify the string templates for `operationMode === "analyze"` or `operationMode === "apply_suggestions"` to refine the AI's behavior or output format.
    *   **Important**: If you change the expected JSON structure for "analyze" mode, ensure the frontend (`UserStoryQualityAnalyzer.tsx`) is updated to match the new interface (`AnalysisResult`).

### Updating UI Components
*   **Frontend (`src/pages/UserStoryQualityAnalyzer.tsx`)**:
    *   To change the appearance or layout, modify the JSX and Tailwind CSS classes within this file.
    *   Utilize existing `shadcn/ui` components or create new ones in `src/components/` if custom functionality is needed.
    *   For global styling changes, refer to `src/globals.css` and `tailwind.config.ts`.

### Supabase Secrets Management
*   LLM API keys (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`) are stored as secrets in Supabase.
*   To add or update secrets, navigate to your Supabase project dashboard:
    <resource-link type="supabase-secrets">Project -> Edge Functions -> Manage Secrets</resource-link>
*   These secrets are automatically available as environment variables within your Edge Functions.

### Deploying Edge Functions
*   When you make changes to files within the `supabase/functions/` directory and these changes are written using `<dyad-write>`, Dyad will automatically handle the deployment of these Edge Functions to your Supabase project. You do not need to run any manual deployment commands.

### Adding New Tools to the Hub
1.  **Create a new page**: In `src/pages/`, create a new `.tsx` file for your tool (e.g., `src/pages/NewTool.tsx`).
2.  **Create a `ToolCard`**: In `src/pages/Index.tsx`, add a new `<ToolCard />` component, linking to your new page.
3.  **Add a route**: In `src/App.tsx`, add a new `<Route />` for your new page.
4.  **Add to Navbar**: In `src/components/Navbar.tsx`, add a new `NavigationMenuItem` to link to your new tool.

This guide should provide a solid foundation for understanding and extending the Internal Tools Hub application.