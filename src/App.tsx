import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserStoryQualityAnalyzer from "./pages/UserStoryQualityAnalyzer";
import { ThemeToggle } from "./components/ThemeToggle"; // Import ThemeToggle

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <header className="flex justify-end p-4 border-b bg-background">
            <ThemeToggle />
          </header>
          <main className="flex-grow bg-background text-foreground"> {/* Added bg-background and text-foreground */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/user-story-analyzer" element={<UserStoryQualityAnalyzer />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;