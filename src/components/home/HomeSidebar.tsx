import { Folder, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { decodeUrlToPath } from "@/utils/utils";

interface HomeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSidebar({ isOpen, onClose }: HomeSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    void navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    let currentPath = decodeURIComponent(location.pathname.replace("/home", "")) || "/";
    currentPath = decodeUrlToPath(currentPath);
    return currentPath === path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar/Drawer */}
      <aside 
        className={`
          fixed md:relative z-30 h-full
          bg-muted/10 flex flex-col flex-shrink-0
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen 
            ? "translate-x-0 w-72 border-r" 
            : "-translate-x-full w-72 md:w-0 md:translate-x-0 border-transparent md:border-r-0"}
        `}
      >
        <div className="w-72 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between h-14 shrink-0">
            <h2 className="font-semibold text-sm text-foreground/80">Pinned Folders</h2>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 flex-1 overflow-auto space-y-1 pb-16">
            <div 
              className={`flex items-center gap-3 text-sm px-3 py-2 rounded-md transition-colors cursor-pointer
                ${isActive("/.cloud_delete") 
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                  : "text-foreground hover:bg-muted/50"
                }`}
              onClick={() => { handleNavigate("/home/recycle_bin"); }}
            >
              <Trash2 className={`h-4 w-4 shrink-0 ${isActive("/.cloud_delete") ? "text-blue-500" : "text-gray-500"}`} />
              <span className="truncate">Recycle Bin</span>
            </div>

            {/* Placeholder Items */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
              <Folder className="h-4 w-4 text-blue-400/50 shrink-0" />
              <span className="truncate">Projects</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
              <Folder className="h-4 w-4 text-blue-400/50 shrink-0" />
              <span className="truncate">Documents</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/50 cursor-not-allowed transition-colors" title="Feature coming soon">
              <Folder className="h-4 w-4 text-blue-400/50 shrink-0" />
              <span className="truncate">Downloads</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
