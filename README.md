# Internal Tools Hub

## Project Description
This application serves as an internal tools hub, currently featuring a User Story Quality Analyzer. It leverages AI to analyze user stories, provide improvement suggestions, generate acceptance criteria, and find similar historical stories, aiming to enhance team efficiency and product quality.

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
*   Node.js (v18 or higher)
*   npm or yarn

### Installation
1.  Navigate to the project directory.
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables
This project uses Supabase and requires environment variables for its client and Edge Functions.
Create a `.env` file in the root of your project and add the following:

```
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
# For Edge Functions, API keys like OPENAI_API_KEY and GEMINI_API_KEY are managed as Supabase secrets.
# You do not need to set them in your local .env file for the Edge Function to access them.
```
Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project URL and public anon key.

### Running the Application
To start the development server:
```bash
npm run dev
# or
yarn dev
```
The application will typically run on `http://localhost:8080`.

## Available Scripts
*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run build:dev`: Builds the application in development mode.
*   `npm run lint`: Lints the project files.
*   `npm run preview`: Serves the production build locally.
*   `npm run debug`: Starts the development server in debug mode.

## Tech Stack
*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, shadcn/ui
*   **Routing**: React Router
*   **State Management**: React Query
*   **Backend/Database**: Supabase (Auth, Edge Functions)
*   **LLM Integration**: OpenAI (GPT models), Google Gemini (Gemini models) via Supabase Edge Functions

## Supabase Integration
This application integrates with Supabase for:
*   **Edge Functions**: For AI-powered user story analysis and suggestions, securely interacting with LLM APIs.

## Documentation
For a detailed explanation of the application's functionality, architecture, and how to extend it, please refer to the [App Guide](docs/APP_GUIDE.md).

## Contributing
Contributions are welcome! Please refer to the [App Guide](docs/APP_GUIDE.md) for more details on the project structure and logic.