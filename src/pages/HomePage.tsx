import { useState, useEffect, useRef } from "react";
import { X, Clipboard, Plus, FolderPlus, Upload, FolderUp } from "lucide-react";
import DefaultLayout from "@/layouts/DefaultLayout";
import VersionTag from "@/components/custom/versionTag";
import VideoPlayerModalV2 from "@/components/custom/videoPlayerModalV2";
import { useFileManager } from "@/hooks/useFileManager";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeBreadcrumb from "@/components/home/HomeBreadcrumb";
import HomeToolbar from "@/components/home/HomeToolbar";
import MobileSelectionToolbar from "@/components/home/MobileSelectionToolbar";
import HomeFileList from "@/components/home/HomeFileList";
import { OperationQueueProgress } from "@/components/custom/operationQueueProgress";
import HomePropertiesModal from "@/components/home/HomePropertiesModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { wsClient } from "@/api/wsClient";
import { checkHealth, type HealthResponse } from "@/api/api-file";

export default function HomePage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  
  const {
    items,
    isLoading,
    error,
    selectedVideo,
    currentPath,
    selectedItems,
    clipboardItems,
    handleClearSelection,
    handleSelectAll,
    handleCut,
    handleCopy,
    handlePaste,
    handleClearClipboard,
    handleDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    itemsToDelete,
    handleRename,
    confirmRename,
    itemToRename,
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    handleCreateFolder,
    confirmCreateFolder,
    isCreateFolderDialogOpen,
    setIsCreateFolderDialogOpen,
    handleBack,
    handleFileClick,
    handleFileContextMenu,
    handleFileDoubleClick,
    handlePlayerClose,
    removeRotateTemp,
    handleRefresh,
    handleProperties,
    propertiesData,
    isPropertiesDialogOpen,
    setIsPropertiesDialogOpen,
    handleUploadFiles,
  } = useFileManager({ uploadChunkSize: healthData?.upload_chunk_size });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [renameInput, setRenameInput] = useState("");
  const [folderInput, setFolderInput] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isHealthConnected, setIsHealthConnected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleUploadFiles(Array.from(e.target.files), currentPath);
    }
    // reset input so the same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  useEffect(() => {
    const performHealthCheck = async () => {
      const isHealthy = await checkHealth();
      setHealthData(isHealthy);
      setIsHealthConnected(isHealthy !== null);
    };

    const unsubscribeWs = wsClient.subscribeStatus((connected) => {
      setIsWsConnected(connected);
      void performHealthCheck();
    });

    const handleWsReconnect = () => {
      void handleRefresh();
    };
    window.addEventListener('ws-reconnected', handleWsReconnect);

    const healthInterval = setInterval(() => {
      void performHealthCheck();
    }, 30000);

    return () => {
      unsubscribeWs();
      window.removeEventListener('ws-reconnected', handleWsReconnect);
      clearInterval(healthInterval);
    };
  }, [handleRefresh]);

  useEffect(() => {
    if (isRenameDialogOpen && itemToRename) {
      setRenameInput(itemToRename);
    } else {
      setRenameInput("");
    }
  }, [isRenameDialogOpen, itemToRename]);

  useEffect(() => {
    if (isCreateFolderDialogOpen) {
      setFolderInput("New Folder");
    } else {
      setFolderInput("");
    }
  }, [isCreateFolderDialogOpen]);

  const isRenameExists = (items?.items ?? []).some(item => item.name.toLowerCase() === renameInput.toLowerCase() && item.name.toLowerCase() !== itemToRename?.toLowerCase());
  const isFolderExists = (items?.items ?? []).some(item => item.name.toLowerCase() === folderInput.toLowerCase());

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, etc.
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // F5 or Ctrl/Cmd + R for refresh
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) {
        e.preventDefault();
        void handleRefresh();
        return;
      }

      // Only handle these if no dialogs or video player are open
      if (
        isRenameDialogOpen ||
        isCreateFolderDialogOpen ||
        isDeleteDialogOpen ||
        isPropertiesDialogOpen ||
        !!selectedVideo
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSelectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        void handlePaste();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleRefresh,
    handleSelectAll,
    handleCopy,
    handleCut,
    handlePaste,
    handleBack,
    isRenameDialogOpen,
    isCreateFolderDialogOpen,
    isDeleteDialogOpen,
    isPropertiesDialogOpen,
    selectedVideo,
  ]);

  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  return (
    <DefaultLayout>
      <div className="flex flex-1 w-full overflow-hidden relative">
        {!selectedVideo && (
          <HomeSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => { setIsSidebarOpen(false); }} 
            isWsConnected={isWsConnected}
            isHealthConnected={isHealthConnected}
            titleName={healthData?.title_name}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden" onClick={(e) => {
          // Prevent clearing selection if clicking inside a toolbar button, menu, dialog, or popover
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('[role="menuitem"]') ||
            target.closest('[role="dialog"]') ||
            target.closest('[data-radix-popper-content-wrapper]')
          ) {
            return;
          }
          handleClearSelection();
        }}>
          <div className="md:hidden">
            {selectedItems.size > 0 ? (
              <MobileSelectionToolbar
                selectedItemsSize={selectedItems.size}
                onCancel={handleClearSelection}
                onSelectAll={handleSelectAll}
                onCut={handleCut}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onProperties={() => { void handleProperties(); }}
              />
            ) : (
              <HomeBreadcrumb currentPath={currentPath} onToggleSidebar={toggleSidebar} />
            )}
          </div>

          <div className="hidden md:block">
            <HomeBreadcrumb currentPath={currentPath} onToggleSidebar={toggleSidebar} />
          </div>

          <div className="hidden md:block">
            <HomeToolbar
              currentPath={currentPath}
              selectedItemsSize={selectedItems.size}
              clipboardItemsCount={clipboardItems.items.length}
              clipboardOperation={clipboardItems.operation}
              clipboardSourceDir={clipboardItems.sourceDir}
              onBack={handleBack}
              onSelectAll={handleSelectAll}
              onCut={handleCut}
              onCopy={handleCopy}
              onPaste={() => { void handlePaste(); }}
              onRename={handleRename}
              onDelete={handleDelete}
              onCleanUp={removeRotateTemp}
              onRefresh={() => { void handleRefresh(); }}
              onCreateFolder={handleCreateFolder}
              onUploadFiles={(files) => { void handleUploadFiles(files, currentPath); }}
            />
          </div>

          <HomeFileList
            isLoading={isLoading}
            error={error}
            items={items}
            selectedItems={selectedItems}
            onRefresh={() => { void handleRefresh(); }}
            onFileClick={handleFileClick}
            onFileContextMenu={handleFileContextMenu}
            onFileDoubleClick={handleFileDoubleClick}
            onCut={handleCut}
            onCopy={handleCopy}
            onRename={handleRename}
            onDelete={handleDelete}
            onPaste={() => { void handlePaste(); }}
            onProperties={(name, isCurrentDir) => { void handleProperties(name, isCurrentDir); }}
            onCreateFolder={handleCreateFolder}
            clipboardItems={clipboardItems.items}
            clipboardItemsCount={clipboardItems.items.length}
            clipboardOperation={clipboardItems.operation}
            clipboardSourceDir={clipboardItems.sourceDir}
            currentPath={currentPath}
            onUploadDrop={(files, path) => { void handleUploadFiles(files, path); }}
          />
        </div>

        {!selectedVideo && <OperationQueueProgress />}

        {/* Mobile Clipboard Toast */}
        {!selectedVideo && clipboardItems.items.length > 0 && (
          <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-popover text-popover-foreground border border-border/50 p-2 pl-4 rounded-full shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-muted-foreground" />
              <span className="text-base font-medium">
                {clipboardItems.items.length} item(s) {clipboardItems.operation === 'cut' ? 'cut' : 'copied'}
              </span>
            </div>
            <div className="h-5 w-[1px] bg-border mx-1" />
            <Button
              size="sm"
              variant="default"
              className="h-9 px-6 text-sm rounded-full font-medium"
              onClick={(e) => {
                e.stopPropagation();
                void handlePaste();
              }}
              disabled={clipboardItems.operation === 'cut' && clipboardItems.sourceDir === currentPath}
            >
              Paste
            </Button>
            <button
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleClearClipboard();
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Mobile Floating Action Button */}
        {!selectedVideo && (
          <div className="md:hidden absolute bottom-4 right-4 z-50">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <input 
              type="file" 
              className="hidden" 
              ref={folderInputRef} 
              {...{ webkitdirectory: "", directory: "" } as any} 
              onChange={handleFileChange} 
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div 
                  role="button"
                  className="w-14 h-14 bg-background text-foreground shadow-lg rounded-full border flex items-center justify-center cursor-pointer hover:bg-muted transition-all duration-300"
                >
                  <Plus className="w-7 h-7" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12}>
                <DropdownMenuItem onClick={handleCreateFolder}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  <span>Create Folder</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload File</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
                  <FolderUp className="mr-2 h-4 w-4" />
                  <span>Upload Folder</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {selectedVideo && (
        <VideoPlayerModalV2
          file={selectedVideo}
          isOpen={!!selectedVideo}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClose={handlePlayerClose}
        />
      )}
      <VersionTag />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
            <DialogDescription>
              {currentPath.startsWith("/.cloud_delete") 
                ? `Are you sure you want to permanently delete ${itemsToDelete?.size ?? 0} item(s)? This action cannot be undone.`
                : `Are you sure you want to move ${itemsToDelete?.size ?? 0} item(s) to the recycle bin?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); }}>
              Cancel
            </Button>
            <Button autoFocus variant="destructive" onClick={() => { void confirmDelete(); }} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription>
              Enter a new name for the item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={renameInput}
              onChange={(e) => { setRenameInput(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenameExists) void confirmRename(renameInput);
              }}
              placeholder="New name"
              autoFocus
            />
            {isRenameExists && (
              <p className="text-destructive text-sm mt-2">A file or folder with this name already exists.</p>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => { setIsRenameDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={() => { void confirmRename(renameInput); }} disabled={isLoading || !renameInput || renameInput === itemToRename || isRenameExists}>
              {isLoading ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={folderInput}
              onChange={(e) => { setFolderInput(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isFolderExists) void confirmCreateFolder(folderInput);
              }}
              placeholder="Folder name"
              autoFocus
            />
            {isFolderExists && (
              <p className="text-destructive text-sm mt-2">A file or folder with this name already exists.</p>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => { setIsCreateFolderDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={() => { void confirmCreateFolder(folderInput); }} disabled={isLoading || !folderInput || isFolderExists}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <HomePropertiesModal
        isOpen={isPropertiesDialogOpen}
        onOpenChange={setIsPropertiesDialogOpen}
        data={propertiesData}
      />

    </DefaultLayout>
  );
}
