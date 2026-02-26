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
    handleRename,
    handleBack,
    handleFileClick,
    handleFileDoubleClick,
    handlePlayerClose,
    removeRotateTemp,
    handleRefresh,
  } = useFileManager();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden relative">
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
    </DefaultLayout>
  );
}
