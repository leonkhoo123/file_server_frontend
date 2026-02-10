import { BrushCleaning, File, Folder, RefreshCcw, ArrowLeft, Plus, Copy, Scissors, Clipboard, CheckSquare, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DefaultLayout from "@/layouts/DefaultLayout";
import { fetchDirList, type ItemsResponse, type FileInterface, deleteTempRotate, copyFiles, moveFiles, deleteFiles, renameFile } from "@/api/api-file";
// --- Main Component ---
import { useState, useEffect } from 'react';
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";
import { formatBytes, formatLastModified } from "@/utils/utils";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import VersionTag from "@/components/custom/versionTag";
import { postDisqualified, renameFileMoveToDone } from "@/api/api-video";
import VideoPlayerModalV2 from "@/components/custom/videoPlayerModalV2";


// --- Main Component ---
export default function HomePage() {
  const location = useLocation();
  const [items, setItems] = useState<ItemsResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<FileInterface | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboardItems, setClipboardItems] = useState<{ items: string[], operation: 'cut' | 'copy' | null, sourceDir?: string }>({ items: [], operation: null });
  const navigate = useNavigate();

  // Function to toggle item selection                                                                                  // Function to toggle item selection
  const toggleItemSelection = (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click from firing
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  // Select all items
  const handleSelectAll = () => {
    if (!items?.items) return;
    const allNames = new Set(items.items.map(item => item.name));
    setSelectedItems(allNames);
  };

  // Cut operation
  const handleCut = () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected");
      return;
    }
    const sources = Array.from(selectedItems).map(name =>
      currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
    );
    setClipboardItems({ items: sources, operation: 'cut', sourceDir: currentPath });
    toast.success(`${selectedItems.size} item(s) cut`);
  };

  // Copy operation
  const handleCopy = () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected");
      return;
    }
    const sources = Array.from(selectedItems).map(name =>
      currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
    );
    setClipboardItems({ items: sources, operation: 'copy', sourceDir: currentPath });
    toast.success(`${selectedItems.size} item(s) copied`);
  };

  // Paste operation
  const handlePaste = async () => {
    if (clipboardItems.items.length === 0 || !clipboardItems.operation) {
      toast.error("Clipboard is empty");
      return;
    }

    try {
      setIsLoading(true);
      if (clipboardItems.operation === 'copy') {
        await copyFiles(clipboardItems.items, currentPath);
        toast.success(`Copied ${clipboardItems.items.length} item(s)`);
      } else {
        await moveFiles(clipboardItems.items, currentPath);
        toast.success(`Moved ${clipboardItems.items.length} item(s)`);
      }
      setClipboardItems({ items: [], operation: null }); // Clear clipboard after successful paste
      await handleRefresh();
    } catch (error) {
      console.error("Paste failed:", error);
      toast.error("Paste operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete operation
  const handleDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const sources = Array.from(selectedItems).map(name =>
        currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
      );
      await deleteFiles(sources);
      toast.success(`Moved ${selectedItems.size} item(s) to recycle bin`);
      setSelectedItems(new Set());
      await handleRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Delete operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Rename operation
  const handleRename = async () => {
    if (selectedItems.size !== 1) {
      toast.error("Please select exactly one item to rename");
      return;
    }

    const oldName = Array.from(selectedItems)[0];
    const newName = prompt("Enter new name:", oldName);

    if (!newName || newName === oldName) return;

    try {
      setIsLoading(true);
      const source = currentPath === "/" ? `/${oldName}` : `${currentPath}/${oldName}`;
      await renameFile(source, newName);
      toast.success("Item renamed successfully");
      setSelectedItems(new Set());
      await handleRefresh();
    } catch (error) {
      console.error("Rename failed:", error);
      toast.error("Rename operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Back navigation
  const handleBack = () => {
    if (currentPath === "/") return;
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? "/" + pathParts.join("/") : "/";
    void navigate("/home" + parentPath);
  };

  // Function to handle a row click
  const handleFileClick = (fileInfo: FileInterface) => {
    if (fileInfo.isVideo) {
      setSelectedVideo(fileInfo);
    } else if (fileInfo.type === "dir") {
      const newPath = currentPath === "/" ? `/${fileInfo.name}` : `${currentPath}/${fileInfo.name}`;
      void navigate("/home" + newPath)
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!location) return;

    const loadFiles = async () => {
      setIsLoading(true);
      setError(false);
      setSelectedItems(new Set()); // Clear selections when changing directories

      try {
        const currentPath = decodeURIComponent(location.pathname.replace("/home", "")) || "/";
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        setCurrentPath(itemsrs.path);
      } catch (err: any) {
        console.error("MyErr: ", err);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error("err.message: ", err.message);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error(" err.response.status: ", err.response.status);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (err?.response?.status === 401) {
          void navigate("/login");
        }
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFiles();
  }, [location, navigate]);

  const handlePlayerClose = async (isDisqualified: boolean, oriPath: string, isNewName: boolean, newName: string, rotation: number): Promise<void> => {
    setSelectedVideo(null);
    try {
      if (isDisqualified) {
        await postDisqualified(oriPath)
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Disqualified");
      } else if (isNewName) {
        setIsLoading(true)
        await renameFileMoveToDone(oriPath, newName, rotation)
        setIsLoading(false)
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Rename Done");
      }
    } catch (error) {
      console.error("Failed to move or rename file:", error);
    }
  }

  const removeRotateTemp = async () => {
    console.log("Removing temp_rotate")
    try {
      setIsLoading(true);
      await deleteTempRotate(currentPath)
      const itemsrs = await fetchDirList(currentPath);
      setItems(itemsrs);
      toast.success("Successfully Clean Up");
    } catch (error: any) {
      setError(true);
      toast.error("Failed to Clean Up");
      console.log("Failed to remove rotate_temp", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const itemsrs = await fetchDirList(currentPath);
      setItems(itemsrs);
    } catch (err: any) {
      console.error("MyErr: ", err);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error("err.message: ", err.message);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error(" err.response.status: ", err.response.status);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.response?.status === 401) {
        void navigate("/login");
      }
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }
  // --- Main Layout Render ---
  return (
    <DefaultLayout>
      <div className="flex">
        {/* Assuming Sidebar is now part of DefaultLayout or excluded for simplicity */}

        <div className="flex flex-col flex-1">
          {/* 3. Main Content Area */}
          <main className="flex-col p-6 overflow-auto h-full">
            {/* Toolbar */}
            <div className="flex flex-row w-full mb-2">
              {/* Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentPath === "/"}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50"
                title="Back"
              >
                <ArrowLeft />
              </Button>

              {/* Select All button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300"
                title="Select All"
              >
                <CheckSquare />
              </Button>

              {/* Cut button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCut}
                disabled={selectedItems.size === 0}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50"
                title="Cut"
              >
                <Scissors />
              </Button>

              {/* Copy button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={selectedItems.size === 0}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50"
                title="Copy"
              >
                <Copy />
              </Button>

              {/* Paste button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                disabled={
                  clipboardItems.items.length === 0 ||
                  (clipboardItems.operation === 'cut' && clipboardItems.sourceDir === currentPath)
                }
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50"
                title="Paste"
              >
                <Clipboard />
              </Button>

              {/* Rename button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRename}
                disabled={selectedItems.size !== 1}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50"
                title="Rename"
              >
                <Pencil className="h-5 w-5" />
              </Button>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={selectedItems.size === 0}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300 disabled:opacity-50 text-red-500 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </Button>

              {/* Add/Upload button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Add/Upload functionality - to be implemented")}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300"
                title="Add/Upload"
              >
                <Plus />
              </Button>

              {/* Divider */}
              <div className="border-l border-gray-400 mx-2" />

              {/* Clearning button */}
              <Button
                variant="ghost" size="sm"
                onClick={removeRotateTemp}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300"
                title="Clean Up"
              ><BrushCleaning /></Button>
              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300"
                title="Refresh"
              >
                <RefreshCcw />
              </Button>



              {/* Navigation path */}
              <div className="w-full flex justify-start items-center bg-gray-200 px-2 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/home")}
                  className="p-1 bg-transparent hover:bg-transparent hover:underline dark:text-black dark:hover:bg-transparent"
                >
                  Home
                </Button>
                <div className="text-sm text-gray-600 truncate">
                  {currentPath.split("/").filter(Boolean).map((part, idx, arr) => (
                    <span key={idx}>
                      {" / "}
                      <button
                        onClick={() => {
                          const targetPath = "/" + arr.slice(0, idx + 1).join("/");
                          void navigate("/home" + targetPath);
                        }}
                        className="hover:underline"
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 border-b font-semibold py-2 px-2 text-sm sticky top-0 z-10">
              <div className="col-span-12 lg:col-span-6 text-left">Name</div>
              <div className="col-span-3 hidden lg:block text-right pr-3">Size</div>
              <div className="col-span-3 hidden lg:block text-right pr-4">Last Modified</div>
            </div>

            {/* Content */}
            {isLoading ? (
              <FileListTableSkeleton />
            ) : error ? (
              <p className="text-center text-red-500 mt-10">Failed to load directory.</p>
            ) : !items?.items || items.items.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">This folder is empty.</p>
            ) : (
              <div className="max-h-[calc(100vh-200px)] scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/30 dark:scrollbar-thumb-white/30 scrollbar-track-white/0 overflow-y-scroll">
                {items.items.map((file, index) => {
                  const isSelected = selectedItems.has(file.name);
                  return (
                    <div key={index}>
                      <div
                        onClick={() => { handleFileClick(file); }}
                        className={`group grid grid-cols-12 items-center px-2 py-3 cursor-pointer rounded-md transition-colors ${isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                          : 'hover:bg-gray-500/20'
                          }`}
                      >
                        {/* CHECKBOX */}
                        <div className="col-span-1 flex items-center justify-center">
                          <div
                            onClick={(e) => toggleItemSelection(file.name, e)}
                            className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="h-5 w-5"
                            />
                          </div>
                        </div>

                        {/* NAME */}
                        <div className="col-span-11 lg:col-span-5 flex items-center space-x-3 min-w-0">
                          {file.type === "dir" ? (
                            <div className="flex flex-row space-x-3 py-2 lg:py-0">
                              <Folder className="h-5 w-5 text-blue-500 shrink-0" />
                              <div className="flex flex-col min-w-0 w-full text-left">
                                <span className="truncate">{file.name}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <File className="h-5 w-5 text-gray-400 shrink-0" />
                              <div className="flex flex-col min-w-0 w-full text-left">
                                <span className="truncate">{file.name}</span>

                                <span className="text-sm text-gray-400 lg:hidden truncate">
                                  {formatBytes(file.size)}
                                </span>
                              </div>
                            </>
                          )}

                        </div>

                        {/* SIZE (desktop only) */}
                        <div className="hidden lg:block lg:col-span-3 text-right text-sm ">
                          {file.type === "dir" ? "" : formatBytes(file.size)}
                        </div>

                        {/* LAST MODIFIED (desktop only) */}
                        <div className="hidden lg:block lg:col-span-3 text-right text-sm">
                          {formatLastModified(file.modified)}
                        </div>

                      </div>
                      <div className="w-full border-b" />
                    </div>
                  )
                })}

              </div>
            )}
          </main>
        </div>

      </div >
      {selectedVideo && (
        <VideoPlayerModalV2
          file={selectedVideo}
          isOpen={!!selectedVideo}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClose={handlePlayerClose} // Close modal by clearing state
        />
        // <VideoPlayerCompressModal
        //   file={selectedVideo}
        //   isOpen={!!selectedVideo}
        //   onClose={handlePlayerClose} // Close modal by clearing state
        // />
      )
      }
      <VersionTag />
    </DefaultLayout >

  );
}
