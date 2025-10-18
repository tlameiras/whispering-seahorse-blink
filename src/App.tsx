import { Toaster } from "@/components/ui/toaster";
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
      <Toaster />
      <Sonner
        classNames={{
          // Base styles for all toasts (text color, border, shadow)
          toast: "group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          // Specific styles for default/info toasts
          default: "group-[.toaster]:bg-card",
          // Specific styles for success toasts
          success: "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success",
          // Specific styles for error toasts
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
        }}
      />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar /> {/* Use the Navbar component here */}
          <main className="flex-grow bg-background text-foreground">
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