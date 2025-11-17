import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import OTPSignIn from "./pages/OTPSignIn";
import TOTPSetup from "./pages/TOTPSetup";
import Dashboard from "./pages/Dashboard";
import TransactionHistory from "./pages/TransactionHistory";
import ExplainabilityCenter from "./pages/ExplainabilityCenter";
import Profile from "./pages/Profile";
import KnowledgeBase from "./pages/KnowledgeBase";
import ManualPrediction from "./pages/ManualPrediction";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp-signin" element={<OTPSignIn />} />
          <Route path="/totp-setup" element={<TOTPSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/explainability" element={<ExplainabilityCenter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/manual-prediction" element={<ManualPrediction />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
