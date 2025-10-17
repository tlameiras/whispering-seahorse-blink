"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import ToolCard from "@/components/ToolCard";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background p-4">
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
        {/* Future tools can be added here */}
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default Index;