import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserStoryQualityAnalyzer from "./pages/UserStoryQualityAnalyzer";
import UserStoryManager from "./pages/UserStoryManager"; // New import
import UserStoryForm from "./pages/UserStoryForm"; // New import
import UserStoryDetail from "./pages/UserStoryDetail"; // New import
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner
        classNames={{
          toast: "text-foreground border-border shadow-lg",
          default: "bg-card",
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
              <Route path="/user-story-manager" element={<UserStoryManager />} /> {/* New route */}
              <Route path="/user-story-manager/new" element={<UserStoryForm />} /> {/* New route */}
              <Route path="/user-story-manager/:id" element={<UserStoryDetail />} /> {/* New route */}
              <Route path="/user-story-manager/:id/edit" element={<UserStoryForm />} /> {/* New route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;