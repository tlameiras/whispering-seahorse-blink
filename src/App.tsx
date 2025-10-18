import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserStoryQualityAnalyzer from "./pages/UserStoryQualityAnalyzer";
import Navbar from "./components/Navbar"; // Import Navbar

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner
        classNames={{
          toast: "text-foreground border-border shadow-lg",
          default: "bg-card",
          // Testing with direct Tailwind colors to diagnose the issue
          success: "bg-green-500 text-white border-green-600 !bg-green-500",
          error: "bg-red-500 text-white border-red-600 !bg-red-500",
        }}
      />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/user-story-analyzer" element={<UserStoryQualityAnalyzer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;