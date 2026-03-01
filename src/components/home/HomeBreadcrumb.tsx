import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, RefreshCcw, Settings, Sun, Moon, Monitor, Eye, EyeOff, ArrowLeft, MoreVertical, FolderPlus, Clipboard, Info } from "lucide-react";
import { encodePathToUrl } from "@/utils/utils";
import { logout } from "@/api/api-auth";
import { useTheme } from "@/components/theme-provider";
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

interface HomeBreadcrumbProps {
  currentPath: string;
  onToggleSidebar?: () => void;
  onCreateFolder?: () => void;
  onPaste?: () => void;
  onProperties?: (fileName?: string, isCurrentDir?: boolean) => void;
  onRefresh?: () => void;
  clipboardItemsCount?: number;
  clipboardOperation?: 'cut' | 'copy' | null;
  clipboardSourceDir?: string;
}

export default function HomeBreadcrumb({ 
  currentPath, 
  onToggleSidebar,
  onCreateFolder,
  onPaste,
  onProperties,
  onRefresh,
  clipboardItemsCount = 0,
  clipboardOperation = null,
  clipboardSourceDir,
}: HomeBreadcrumbProps) {
  const navigate = useNavigate();
  const updateSW = registerSW();
  const { theme, setTheme } = useTheme();
  const { showHidden, setShowHidden } = usePreferences();

  const handleReload = async () => {
    console.log("Force reloaded");
    await updateSW(true); // force service worker update + reload
    toast.success("App Reloaded");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged Out");
    console.log("Logged Out");
    void navigate("/login");
  };

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
    <div className="h-16 md:h-14 border-b flex items-center justify-between px-2 md:px-6 bg-background shrink-0 gap-2">
      <div className="flex items-center gap-2 overflow-hidden">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={`mr-1 h-12 w-12 md:h-8 md:w-8 text-muted-foreground hover:text-foreground shrink-0 ${currentPath !== "/" ? "hidden md:flex" : ""}`}
          >
            <Menu className="h-8 w-8 md:h-5 md:w-5" />
          </Button>
        )}
        <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { void navigate("/home"); }}
            className="p-1 h-auto bg-transparent hover:bg-transparent hover:underline text-foreground shrink-0 hidden md:inline-flex"
          >
            Home
          </Button>
          <div className="hidden md:flex items-center">
            {currentPath.split("/").filter(Boolean).map((part, idx, arr) => {
              const isHidden = part.startsWith('.');
              return (
                <span key={idx} className="flex items-center shrink-0">
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
          <div className="md:hidden flex items-center shrink-0">
            {currentPath !== "/" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const parts = currentPath.split("/").filter(Boolean);
                  parts.pop();
                  const targetPath = "/" + parts.join("/");
                  void navigate("/home" + encodePathToUrl(targetPath));
                }}
                className="mr-1 h-12 w-12 md:h-8 md:w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="h-8 w-8 md:h-5 md:w-5" />
              </Button>
            )}
            <span className="font-semibold text-foreground text-lg md:text-base">
              {currentPath === "/" 
                ? "Home" 
                : currentPath.split("/").filter(Boolean).pop() === '.cloud_delete' 
                  ? 'Recycle Bin' 
                  : currentPath.split("/").filter(Boolean).pop()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Settings Button */}
        <div className={currentPath !== "/" ? "hidden md:flex" : "flex"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 md:h-9 md:w-9">
                <Settings className="h-8 w-8 md:h-[1.2rem] md:w-[1.2rem] transition-all" />
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

        {/* 3-Dot Mobile Menu for Current Directory */}
        <div className="md:hidden flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground">
                <MoreVertical className="h-6 w-6" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onCreateFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onPaste} 
                disabled={clipboardItemsCount === 0 || (clipboardOperation === 'cut' && clipboardSourceDir === currentPath)}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Paste
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRefresh}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onProperties?.(undefined, true)}>
                <Info className="mr-2 h-4 w-4" />
                Info
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
