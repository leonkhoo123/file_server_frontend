// src/layouts/HomeLayout.tsx
import React from "react";
import { BottomNavbar } from "@/components/custom/BottomNavbar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen p-0">
      <main className="bottom-bar-style sm:shadow-2xl flex-grow pb-16">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}
