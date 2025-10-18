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
          // Common styles for all toasts (text color, border, shadow)
          toast: "text-foreground border-border shadow-lg",
          // Specific styles for default/info toasts
          default: "bg-card",
          // Specific styles for success toasts, using !important for background
          success: "bg-success text-success-foreground border-success !bg-success",
          // Specific styles for error toasts, using !important for background
          error: "bg-destructive text-destructive-foreground border-destructive !bg-destructive",
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