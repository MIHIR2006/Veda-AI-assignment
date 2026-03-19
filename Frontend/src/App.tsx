import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import AssignmentsPage from "./pages/AssignmentsPage";
import CreateAssignmentPage from "./pages/CreateAssignmentPage";
import GroupsPage from "./pages/GroupsPage";
import ToolkitPage from "./pages/ToolkitPage";
import LibraryPage from "./pages/LibraryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/create" element={<CreateAssignmentPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/toolkit" element={<ToolkitPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
