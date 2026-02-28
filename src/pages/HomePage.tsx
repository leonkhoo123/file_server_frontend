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

export default function HomePage() {
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
    handleFileDoubleClick,
    handlePlayerClose,
    removeRotateTemp,
    handleRefresh,
  } = useFileManager();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [renameInput, setRenameInput] = useState("");
  const [folderInput, setFolderInput] = useState("");

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

  const isRenameExists = items?.items.some(item => item.name.toLowerCase() === renameInput.toLowerCase() && item.name.toLowerCase() !== itemToRename?.toLowerCase());
  const isFolderExists = items?.items.some(item => item.name.toLowerCase() === folderInput.toLowerCase());

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

  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  return (
    <DefaultLayout>
      <div className="flex flex-1 w-full overflow-hidden relative">
        <HomeSidebar isOpen={isSidebarOpen} onClose={() => { setIsSidebarOpen(false); }} />

        <div className="flex-1 flex flex-col min-w-0 bg-background" onClick={handleClearSelection}>
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
          />

          <HomeFileList
            isLoading={isLoading}
            error={error}
            items={items}
            selectedItems={selectedItems}
            onRefresh={handleRefresh}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
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
            <Button variant="destructive" onClick={() => { void confirmDelete(); }} disabled={isLoading}>
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
    </DefaultLayout>
  );
}
