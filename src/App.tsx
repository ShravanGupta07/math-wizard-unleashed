import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import Layout from "./components/Layout";
import Solver from "./pages/Solver";
import History from "./pages/History";
import Examples from "./pages/Examples";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PracticeIt from "./pages/PracticeIt";
import SolveTogether from "./pages/SolveTogether";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BackgroundFX from "./components/BackgroundFX";
import ScienceCalculatorsPage from './pages/ScienceCalculators';
import FAQ from './pages/FAQ';
import Documentation from './pages/Documentation';

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <HistoryProvider>
            <BackgroundFX />
            <Toaster />
            <Sonner />
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Solver />} />
                  <Route path="solver" element={<Solver />} />
                  <Route path="practice" element={<PracticeIt />} />
                  <Route path="history" element={<History />} />
                  <Route path="examples" element={<Examples />} />
                  <Route path="solve-together" element={<SolveTogether />} />
                  <Route path="about" element={<About />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="science-calculators" element={<ScienceCalculatorsPage />} />
                  <Route path="faq" element={<FAQ />} />
                  <Route path="documentation" element={<Documentation />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </HistoryProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
