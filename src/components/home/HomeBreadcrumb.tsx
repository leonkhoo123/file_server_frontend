import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { encodePathToUrl } from "@/utils/utils";

interface HomeBreadcrumbProps {
  currentPath: string;
  onToggleSidebar?: () => void;
}

export default function HomeBreadcrumb({ currentPath, onToggleSidebar }: HomeBreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="h-14 border-b flex items-center px-4 md:px-6 bg-background shrink-0 gap-2">
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-1 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { void navigate("/home"); }}
          className="p-1 h-auto bg-transparent hover:bg-transparent hover:underline text-foreground"
        >
          Home
        </Button>
        {currentPath.split("/").filter(Boolean).map((part, idx, arr) => {
          const isHidden = part.startsWith('.');
          return (
            <span key={idx} className="flex items-center">
              <span className="mx-1 text-muted-foreground/50">/</span>
              <button
                onClick={() => {
                  const targetPath = "/" + arr.slice(0, idx + 1).join("/");
                  void navigate("/home" + encodePathToUrl(targetPath));
                }}
                className={`hover:underline hover:text-foreground transition-colors ${isHidden ? 'opacity-60' : ''}`}
              >
                {part === '.cloud_delete' ? 'Recycle Bin' : part}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
