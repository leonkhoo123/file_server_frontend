import { useState, useEffect, useRef } from "react";
import { X, Clipboard, Plus, FolderPlus, Upload, FolderUp } from "lucide-react";
import DefaultLayout from "@/layouts/DefaultLayout";
import VersionTag from "@/components/custom/versionTag";
// import VideoPlayerModalV2 from "@/components/custom/videoPlayerModalV2";
import VideoPlayerModalGeneric from "@/components/custom/videoPlayerModalGeneric";
import PhotoViewerModal from "@/components/custom/photoViewerModal";
import TextViewerModal from "@/components/custom/textViewerModal";
import { useFileManager } from "@/hooks/useFileManager";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeBreadcrumb from "@/components/home/HomeBreadcrumb";
import HomeToolbar from "@/components/home/HomeToolbar";
import MobileSelectionToolbar from "@/components/home/MobileSelectionToolbar";
import HomeFileList from "@/components/home/HomeFileList";
import { OperationQueueProgress } from "@/components/custom/operationQueueProgress";
import HomePropertiesModal from "@/components/home/HomePropertiesModal";
import HomeDownloadDirDialog from "@/components/home/HomeDownloadDirDialog";
import HomeDeleteDialog from "@/components/home/HomeDeleteDialog";
import HomeRenameDialog from "@/components/home/HomeRenameDialog";
import HomeCreateFolderDialog from "@/components/home/HomeCreateFolderDialog";
import HomeDuplicateCheckDialog from "@/components/home/HomeDuplicateCheckDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { wsClient } from "@/api/wsClient";
import { checkHealth, type HealthResponse } from "@/api/api-file";
import { MusicPlayerV2 } from "@/components/custom/musicPlayerV2";

export default function HomePage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  
  const {
    items,
    isLoading,
    error,
    selectedVideo,
    selectedPhoto,
    setSelectedPhoto,
    selectedMusic,
    setSelectedMusic,
    selectedDocument,
    setSelectedDocument,
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
    handleEmptyRecycleBin,
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
    executeUpload,
    isUploadDuplicateCheckDialogOpen,
    setIsUploadDuplicateCheckDialogOpen,
    isUploadDuplicateChecking,
    uploadDuplicateItems,
    setPendingUploads,
    handleDownload,
    isDownloadDirDialogOpen,
    setIsDownloadDirDialogOpen,
    confirmDownloadDir,
    isDuplicateCheckDialogOpen,
    setIsDuplicateCheckDialogOpen,
    isDuplicateChecking,
    duplicateItems,
    executePaste,
  } = useFileManager({ uploadChunkSize: healthData?.upload_chunk_size });

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
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
    const handleResize = () => {
      if (window.innerWidth < 1024) {
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
        isDownloadDirDialogOpen ||
        !!selectedVideo ||
        !!selectedPhoto
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
    isDownloadDirDialogOpen,
    selectedVideo,
    selectedPhoto,
  ]);

  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  return (
    <DefaultLayout>
      <div className="flex flex-1 w-full overflow-hidden relative">
        {!selectedVideo && !selectedPhoto && (
          <HomeSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => { setIsSidebarOpen(false); }} 
            isWsConnected={isWsConnected}
            isHealthConnected={isHealthConnected}
            titleName={healthData?.service_name}
            storageUsage={items?.storage}
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
                onDownload={handleDownload}
                isRecycleBin={currentPath === '/.cloud_delete' || currentPath.startsWith('/.cloud_delete/')}
                isRecycleBinSelected={selectedItems.has('.cloud_delete')}
              />
            ) : (
              <HomeBreadcrumb 
                currentPath={currentPath} 
                isFolderEmpty={!items?.items || items.items.length === 0}
                onToggleSidebar={toggleSidebar} 
                onProperties={(name, isCurrentDir) => { void handleProperties(name, isCurrentDir); }}
                onRefresh={() => { void handleRefresh(); }}
                onDownload={() => { handleDownload(); }}
                onEmptyRecycleBin={() => { handleEmptyRecycleBin((items?.items ?? []).map(i => i.name)); }}
              />
            )}
          </div>

          <div className="hidden md:block">
            <HomeBreadcrumb 
              currentPath={currentPath} 
              onToggleSidebar={toggleSidebar} 
              onProperties={(name, isCurrentDir) => { void handleProperties(name, isCurrentDir); }}
              onRefresh={() => { void handleRefresh(); }}
              onEmptyRecycleBin={() => { handleEmptyRecycleBin((items?.items ?? []).map(i => i.name)); }}
            />
          </div>

          <div className="hidden md:block">
            <HomeToolbar
              currentPath={currentPath}
              selectedItemsSize={selectedItems.size}
              clipboardItemsCount={clipboardItems.items.length}
              clipboardOperation={clipboardItems.operation}
              clipboardSourceDir={clipboardItems.sourceDir}
              isFolderEmpty={!items?.items || items.items.length === 0}
              onBack={handleBack}
              onSelectAll={handleSelectAll}
              onCut={handleCut}
              onCopy={handleCopy}
              onPaste={() => { void handlePaste(); }}
              onRename={handleRename}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onCleanUp={removeRotateTemp}
              onRefresh={() => { void handleRefresh(); }}
              onCreateFolder={handleCreateFolder}
              onUploadFiles={(files) => { void handleUploadFiles(files, currentPath); }}
              isRecycleBinSelected={selectedItems.has('.cloud_delete')}
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
            onDownload={(name) => { handleDownload(name); }}
            onCreateFolder={handleCreateFolder}
            clipboardItems={clipboardItems.items}
            clipboardItemsCount={clipboardItems.items.length}
            clipboardOperation={clipboardItems.operation}
            clipboardSourceDir={clipboardItems.sourceDir}
            currentPath={currentPath}
            onUploadDrop={(files, path) => { void handleUploadFiles(files, path); }}
          />
        </div>

        {!selectedVideo && !selectedPhoto && (
          <div className={clipboardItems.items.length > 0 ? "hidden md:block" : ""}>
            <OperationQueueProgress />
          </div>
        )}

        {/* Mobile Clipboard Toast */}
        {!selectedVideo && !selectedPhoto && clipboardItems.items.length > 0 && (
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
        {!selectedVideo && !selectedPhoto && (
          <div className={`md:hidden absolute bottom-4 right-4 z-50 ${clipboardItems.items.length > 0 ? 'hidden' : ''}`}>
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
        <>
          {/* <VideoPlayerModalV2
            file={selectedVideo}
            isOpen={!!selectedVideo}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClose={handlePlayerClose}
          /> */}
          <VideoPlayerModalGeneric
            file={selectedVideo}
            isOpen={!!selectedVideo}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClose={handlePlayerClose}
          />
        </>
      )}
      
      {selectedPhoto && (
        <PhotoViewerModal
          initialFile={selectedPhoto}
          allItems={items?.items ?? []}
          isOpen={!!selectedPhoto}
          onClose={() => { setSelectedPhoto(null); }}
        />
      )}
      <VersionTag />

      <HomeDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemsToDeleteSize={itemsToDelete?.size ?? 0}
        currentPath={currentPath}
        isLoading={isLoading}
      />

      <HomeRenameDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={confirmRename}
        itemToRename={itemToRename}
        isLoading={isLoading}
        existingNames={(items?.items ?? []).map(item => item.name)}
      />

      <HomeCreateFolderDialog
        isOpen={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
        onConfirm={confirmCreateFolder}
        isLoading={isLoading}
        existingNames={(items?.items ?? []).map(item => item.name)}
      />

      <HomePropertiesModal
        isOpen={isPropertiesDialogOpen}
        onOpenChange={setIsPropertiesDialogOpen}
        data={propertiesData}
      />

      <HomeDownloadDirDialog
        isOpen={isDownloadDirDialogOpen}
        onOpenChange={setIsDownloadDirDialogOpen}
        onConfirm={confirmDownloadDir}
        currentPath={currentPath}
      />

      <HomeDuplicateCheckDialog
        isOpen={isDuplicateCheckDialogOpen}
        onOpenChange={setIsDuplicateCheckDialogOpen}
        onConfirm={executePaste}
        onCancel={() => { setIsDuplicateCheckDialogOpen(false); }}
        duplicates={duplicateItems}
        isLoading={isLoading}
        isChecking={isDuplicateChecking}
      />

      <HomeDuplicateCheckDialog
        isOpen={isUploadDuplicateCheckDialogOpen}
        onOpenChange={setIsUploadDuplicateCheckDialogOpen}
        onConfirm={executeUpload}
        onCancel={() => { setIsUploadDuplicateCheckDialogOpen(false); setPendingUploads(null); }}
        duplicates={uploadDuplicateItems}
        isLoading={false}
        isChecking={isUploadDuplicateChecking}
      />

      {selectedMusic && (
        <MusicPlayerV2
          file={selectedMusic} 
          playlist={(items?.items ?? []).filter(item => item.type !== 'dir' && (item.name.toLowerCase().endsWith('.mp3') || item.name.toLowerCase().endsWith('.wav') || item.name.toLowerCase().endsWith('.flac') || item.name.toLowerCase().endsWith('.ogg') || item.name.toLowerCase().endsWith('.m4a') || item.name.toLowerCase().endsWith('.aac')))}
          onSelectMusic={setSelectedMusic}
          onClose={() => { setSelectedMusic(null); }} 
          forcePause={!!selectedVideo}
        />
      )}

      {selectedDocument && (
        <TextViewerModal
          file={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => { setSelectedDocument(null); }}
        />
      )}
    </DefaultLayout>
  );
}
