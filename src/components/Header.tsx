
import { Link, useLocation } from "react-router-dom";
import { Calculator, History, BarChart3, Info, User, Settings, BookOpen } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const NavItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive 
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string;
  isActive: boolean;
}) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </Link>
);

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Calculator className="h-5 w-5 text-primary" />
            <span>MathWizard</span>
          </Link>
          
          {!isMobile && (
            <nav className="ml-8 flex items-center space-x-1">
              <NavItem 
                to="/solver" 
                icon={Calculator} 
                label="Solver" 
                isActive={location.pathname === "/" || location.pathname === "/solver"}
              />
              <NavItem 
                to="/practice" 
                icon={BookOpen} 
                label="Practice It" 
                isActive={location.pathname === "/practice"}
              />
              <NavItem 
                to="/history" 
                icon={History} 
                label="History" 
                isActive={location.pathname === "/history"}
              />
              <NavItem 
                to="/examples" 
                icon={BarChart3} 
                label="Examples" 
                isActive={location.pathname === "/examples"}
              />
              <NavItem 
                to="/about" 
                icon={Info} 
                label="About" 
                isActive={location.pathname === "/about"}
              />
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && <ModeToggle />}
          
          {isAuthenticated ? (
            <Button variant="outline" asChild size="sm">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild size="sm">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
          
          {!isMobile && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
