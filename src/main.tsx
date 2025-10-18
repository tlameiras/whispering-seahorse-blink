import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// ThemeProvider is now handled inside SessionContextProvider
// import { ThemeProvider } from "./components/ThemeProvider.tsx"; 

createRoot(document.getElementById("root")!).render(
  // ThemeProvider is now inside SessionContextProvider
  // <ThemeProvider defaultTheme="system" attribute="class">
    <App />
  // </ThemeProvider>
);