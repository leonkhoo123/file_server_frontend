// src/layouts/DefaultLayout.tsx
import { logout } from "@/api/api-auth";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCcw } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register"


export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const updateSW = registerSW()
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col min-h-screen p-0 .main-view">
      <main className="sm:shadow-2xl grow">
        {/* 2. Header (Navbar) */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Cloud Drive</h1>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline" size="icon"
              onClick={handleReload}
            ><RefreshCcw className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" /></Button>
            <ModeToggle></ModeToggle>
            <Button
              variant="outline" size="icon"
              onClick={handleLogout}
              className="bg-red-500/30 hover:bg-red-500/80 dark:bg-red-500/30 dark:hover:bg-red-500/80"
            ><LogOut className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" /></Button>
          </div>

        </header>
        {children}
      </main>
    </div>
  );
}
