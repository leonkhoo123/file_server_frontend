import { useState, useEffect } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import VersionTag from "@/components/custom/versionTag";
import VideoPlayerModalV2 from "@/components/custom/videoPlayerModalV2";
import { useFileManager } from "@/hooks/useFileManager";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeBreadcrumb from "@/components/home/HomeBreadcrumb";
import HomeToolbar from "@/components/home/HomeToolbar";
import HomeFileList from "@/components/home/HomeFileList";
import { OperationQueueProgress } from "@/components/custom/operationQueueProgress";
import HomePropertiesModal from "@/components/home/HomePropertiesModal";
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
        <HomeSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => { setIsSidebarOpen(false); }} 
          isWsConnected={isWsConnected}
          isHealthConnected={isHealthConnected}
          titleName={healthData?.title_name}
        />

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
          <HomeBreadcrumb currentPath={currentPath} onToggleSidebar={toggleSidebar} />

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
            onPaste={handlePaste}
            onRename={handleRename}
            onDelete={handleDelete}
            onCleanUp={removeRotateTemp}
            onRefresh={handleRefresh}
            onCreateFolder={handleCreateFolder}
            onUploadFiles={(files) => { void handleUploadFiles(files, currentPath); }}
          />

          <HomeFileList
            isLoading={isLoading}
            error={error}
            items={items}
            selectedItems={selectedItems}
            onRefresh={handleRefresh}
            onFileClick={handleFileClick}
            onFileContextMenu={handleFileContextMenu}
            onFileDoubleClick={handleFileDoubleClick}
            onCut={handleCut}
            onCopy={handleCopy}
            onRename={handleRename}
            onDelete={handleDelete}
            onPaste={handlePaste}
            onProperties={handleProperties}
            clipboardItems={clipboardItems.items}
            clipboardItemsCount={clipboardItems.items.length}
            clipboardOperation={clipboardItems.operation}
            clipboardSourceDir={clipboardItems.sourceDir}
            currentPath={currentPath}
            onUploadDrop={(files, path) => { void handleUploadFiles(files, path); }}
          />
        </div>

        <OperationQueueProgress />
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
