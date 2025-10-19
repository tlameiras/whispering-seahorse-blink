import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"; // Import useLocation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserStoryQualityAnalyzer from "./pages/UserStoryQualityAnalyzer";
import UserStoryManager from "./pages/UserStoryManager";
import UserStoryForm from "./pages/UserStoryForm";
import UserStoryDetail from "./pages/UserStoryDetail";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { SessionContextProvider } from "./components/SessionContextProvider";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

// Create a wrapper component to use useLocation hook
const AppContent = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <SessionContextProvider>
      <div className="min-h-screen flex flex-col">
        {!hideNavbar && <Navbar />} {/* Conditionally render Navbar */}
        <main className="flex-grow bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user-story-analyzer" element={<UserStoryQualityAnalyzer />} />
            <Route path="/user-story-manager" element={<UserStoryManager />} />
            <Route path="/user-story-manager/new" element={<UserStoryForm />} />
            <Route path="/user-story-manager/:id" element={<UserStoryDetail />} />
            <Route path="/user-story-manager/:id/edit" element={<UserStoryForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </SessionContextProvider>
  );
};

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
        <AppContent /> {/* Render the wrapper component */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;