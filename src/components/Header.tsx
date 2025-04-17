import { Link, useLocation } from "react-router-dom";
import { Calculator, History, BarChart3, User, Settings, BookOpen, Users, LogOut, Beaker } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const NavItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive,
  disabled = false
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string;
  isActive: boolean;
  disabled?: boolean;
}) => (
  disabled ? (
    <span
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 opacity-50 pointer-events-none select-none",
        isActive 
          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_24px_#a855f7] border border-purple-400"
          : "text-muted-foreground hover:text-foreground border border-transparent"
      )}
      aria-disabled="true"
      tabIndex={-1}
      title="Please sign in to access this feature"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </span>
  ) : (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200",
        isActive 
          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_24px_#a855f7] border border-purple-400 hover:brightness-110"
          : "text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-accent-foreground/20"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
);

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 dark:bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-foreground hover:text-primary transition-colors">
              <Calculator className="h-5 w-5 text-primary" />
              <span>MathWizard</span>
            </Link>
            
            {!isMobile && (
              <nav className="flex items-center space-x-4">
                <NavItem 
                  to="/solver" 
                  icon={Calculator} 
                  label="Solver" 
                  isActive={location.pathname === "/" || location.pathname === "/solver"}
                />
                <NavItem 
                  to="/science-calculators" 
                  icon={Beaker} 
                  label="Science" 
                  isActive={location.pathname === "/science-calculators"}
                />
                <NavItem 
                  to="/practice" 
                  icon={BookOpen} 
                  label="Practice" 
                  isActive={location.pathname === "/practice"}
                  disabled={!isAuthenticated}
                />
                <NavItem 
                  to="/examples" 
                  icon={BarChart3} 
                  label="Examples" 
                  isActive={location.pathname === "/examples"}
                  disabled={!isAuthenticated}
                />
                <NavItem 
                  to="/solve-together" 
                  icon={Users} 
                  label="Collaborate" 
                  isActive={location.pathname === "/solve-together"}
                  disabled={!isAuthenticated}
                />
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isMobile && <ModeToggle />}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-accent-foreground">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="flex items-center">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" asChild size="sm" className="hover:bg-accent hover:text-accent-foreground">
                <Link to="/login">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
