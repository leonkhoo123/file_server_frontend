// src/layouts/DefaultLayout.tsx
import React from "react";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen p-0">
      <main className="mobile-view sm:shadow-2xl grow">
        {children}
      </main>
    </div>
  );
}
