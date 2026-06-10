import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  User,
  History,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

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
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
              CS
            </div>
            <span
              className="hidden text-lg font-bold text-foreground sm:inline"
              style={{ fontFamily: "Poppins" }}
            >
              Client Scope
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-4 md:flex">
            {user && (
              <Link href="/proposals">
                <Button variant="ghost" className="gap-2 text-foreground hover:bg-secondary">
                  <History className="h-4 w-4" />
                  My Proposals
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            {toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:bg-secondary"
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
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
                  className="text-foreground hover:bg-secondary"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => openAuth("signup")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="space-y-2 px-4 py-4">
                {user && (
                  <Link href="/proposals">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-foreground"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <History className="h-4 w-4" />
                      My Proposals
                    </Button>
                  </Link>
                )}

                {toggleTheme && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-foreground"
                    onClick={() => {
                      toggleTheme();
                      setShowMobileMenu(false);
                    }}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" /> Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" /> Dark Mode
                      </>
                    )}
                  </Button>
                )}

                <div className="border-t border-border pt-2">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-2 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive"
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-center"
                        onClick={() => {
                          openAuth("login");
                          setShowMobileMenu(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => {
                          openAuth("signup");
                          setShowMobileMenu(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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