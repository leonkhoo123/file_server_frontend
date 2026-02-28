// src/layouts/DefaultLayout.tsx
import { logout } from "@/api/api-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCcw, Settings, Sun, Moon, Monitor, Eye, EyeOff } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";
import { usePreferences } from "@/context/PreferencesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const updateSW = registerSW()
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { showHidden, setShowHidden } = usePreferences();

  const handleReload = async () => {
    console.log("Force reloaded");
    await updateSW(true) // force service worker update + reload
    toast.success("App Reloaded");
  }

  const handleLogout = async () => {
    await logout();
    toast.success("Logged Out");
    console.log("Logged Out");
    void navigate("/login")
  }

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-0 .main-view">
      <main className="sm:shadow-2xl grow">
        {/* 2. Header (Navbar) */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Cloud Drive</h1>
          </div>
          <div className="space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-[1.2rem] w-[1.2rem] transition-all" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}>
                  {theme === "light" && <Sun className="mr-2 h-4 w-4" />}
                  {theme === "dark" && <Moon className="mr-2 h-4 w-4" />}
                  {theme === "system" && <Monitor className="mr-2 h-4 w-4" />}
                  <span>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => { setShowHidden(!showHidden); }}>
                  {showHidden ? (
                    <Eye className="mr-2 h-4 w-4" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" />
                  )}
                  <span>{showHidden ? "Hide Hidden Files" : "Show Hidden Files"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleReload}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  <span>Reload App</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/30">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </header>
        {children}
      </main>
    </div>
  );
}
