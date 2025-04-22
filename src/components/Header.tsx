import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calculator, History, BarChart3, User, Settings, BookOpen, LogOut, Beaker, BarChart2, Trophy, Sparkles, Wand2, LockIcon } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/use-mobile";
import { useToast } from "../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NavItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive,
  disabled = false,
  requiresAuth = false
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string;
  isActive: boolean;
  disabled?: boolean;
  requiresAuth?: boolean;
}) => {
  const itemContent = (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200",
        isActive 
          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_24px_#a855f7] border border-purple-400 hover:brightness-110"
          : "text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-accent-foreground/20",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {requiresAuth && disabled && <LockIcon className="h-3 w-3 ml-1" />}
    </div>
  );

  if (disabled) {
    if (requiresAuth) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed">
                {itemContent}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Please sign in to access this feature</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <div className="cursor-not-allowed">
        {itemContent}
      </div>
    );
  }

  return (
    <Link to={to}>
      {itemContent}
    </Link>
  );
};

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isDeveloper, signOut } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Math Wizard</span>
          </Link>
          
          {!isMobile && (
            <nav className="flex items-center space-x-4">
              <NavItem 
                to="/solver" 
                icon={Calculator} 
                label="Solver" 
                isActive={location.pathname === "/solver"}
              />
              <NavItem 
                to="/math-mentor" 
                icon={Calculator} 
                label="Mentor" 
                isActive={location.pathname === "/math-mentor"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/practice" 
                icon={BookOpen} 
                label="Practice" 
                isActive={location.pathname === "/practice"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/math-oracle" 
                icon={Wand2} 
                label="Oracle" 
                isActive={location.pathname === "/math-oracle"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/math-chaos" 
                icon={Sparkles} 
                label="Chaos" 
                isActive={location.pathname === "/math-chaos"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/science-calculators" 
                icon={Beaker} 
                label="Science" 
                isActive={location.pathname === "/science-calculators"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              
              {(isAdmin() || isDeveloper()) && (
                <NavItem 
                  to="/dashboard" 
                  icon={BarChart2} 
                  label="Dashboard" 
                  isActive={location.pathname === "/dashboard"}
                />
              )}
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
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
                  <Link to="/badges" className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2" />
                    Badges
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
    </header>
  );
};

export default Header;
