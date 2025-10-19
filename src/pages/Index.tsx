"use client";

import ToolCard from "@/components/ToolCard";
import { Sparkles, ListTodo } from "lucide-react"; // Import ListTodo icon

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4"> {/* Removed min-h-screen */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900 dark:text-foreground">
          Welcome to Your Internal Tools Hub
        </h1>
        <p className="text-xl text-gray-700 dark:text-muted-foreground max-w-2xl mx-auto">
          Select a tool below to get started with improving your team's efficiency and quality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ToolCard
          icon={<Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />}
          title="User Story Quality Analyzer"
          description="Analyze and improve the quality of your user stories."
          bulletPoints={[
            "Get a quality score and level",
            "Receive improvement suggestions",
            "Generate acceptance criteria",
            "Find similar historical stories",
          ]}
          linkTo="/user-story-analyzer"
        />
        <ToolCard
          icon={<ListTodo className="h-8 w-8 text-purple-600 dark:text-purple-400" />}
          title="User Story Manager"
          description="Manage your user stories from creation to completion."
          bulletPoints={[
            "List, filter, and sort stories",
            "Create new stories with AI help",
            "View and edit story details",
            "Track status and progress",
          ]}
          linkTo="/user-story-manager"
        />
        {/* Future tools can be added here */}
      </div>
    </div>
  );
};

export default Index;