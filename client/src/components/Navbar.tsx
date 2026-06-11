import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import AuthModal from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sun,
  Moon,
  FileText,
  LogOut,
  History,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  const isHomePage = location === "/";
  const showSolid = scrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHomePage
            ? "border-b border-border bg-background/95 backdrop-blur-lg shadow-sm supports-[backdrop-filter]:bg-background/80"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
              CS
            </div>
            <span
              className={`hidden text-lg font-bold sm:inline transition-colors duration-300 ${
                showSolid ? "text-foreground" : "text-white"
              }`}
              style={{ fontFamily: "Poppins" }}
            >
              Client Scope
            </span>
          </Link>

          {/* Navigation - Visible on all screen sizes */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <Link href="/proposals">
                <Button
                  variant="ghost"
                  className={`gap-2 transition-colors duration-300 hover:bg-secondary ${
                    showSolid
                      ? "text-foreground"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">My Proposals</span>
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            {toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`transition-colors duration-300 hover:bg-secondary ${
                  showSolid
                    ? "text-foreground"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/proposals" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      My Proposals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openAuth("login")}
                  className={`transition-colors duration-300 hover:bg-secondary ${
                    showSolid
                      ? "text-foreground"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => openAuth("signup")}
                  className={`transition-colors duration-300 rounded-2xl px-6 ${
                    showSolid
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  }`}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}