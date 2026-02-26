import { Folder } from "lucide-react";

export default function HomeSidebar() {
  return (
    <aside className="w-64 border-r bg-muted/10 hidden md:flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b flex items-center h-14 shrink-0">
        <h2 className="font-semibold text-sm text-foreground/80">Pinned Folders</h2>
      </div>
      <div className="p-3 flex-1 overflow-auto space-y-1">
        {/* Placeholder Items */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
          <Folder className="h-4 w-4 text-blue-400/50" />
          <span>Projects</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
          <Folder className="h-4 w-4 text-blue-400/50" />
          <span>Documents</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
          <Folder className="h-4 w-4 text-blue-400/50" />
          <span>Downloads</span>
        </div>
      </div>
    </aside>
  );
}
