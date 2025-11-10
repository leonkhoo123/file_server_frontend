import { File, Folder, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/layouts/DefaultLayout";
import { fetchDirList, type ItemsResponse, type FileInterface, postDisqualified, renameFileMoveToDone } from "@/api/api-file";
// --- Main Component ---
import { useState, useEffect } from 'react';
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";
import { formatBytes, formatLastModified } from "@/utils/utils";
import VideoPlayerModal from "@/components/custom/videoPlayerModal";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import VersionTag from "@/components/custom/versionTag";


// --- Main Component ---
export default function HomePage() {
  const location = useLocation();
  const [items, setItems] = useState<ItemsResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<FileInterface | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const navigate = useNavigate();

  // Function to handle a row click
  const handleFileClick = async (fileInfo: FileInterface) => {
    if (fileInfo.isVideo) {
      setSelectedVideo(fileInfo);
    } else if (fileInfo.type === "dir") {
      const newPath = currentPath === "/" ? `/${fileInfo.name}` : `${currentPath}/${fileInfo.name}`;
      navigate("/home" + newPath)
    }
  };

  useEffect(() => {
    if (!location) return;

    const loadFiles = async () => {
      setIsLoading(true);
      setError(false);

      try {
        const currentPath = decodeURIComponent(location.pathname.replace("/home", "")) || "/";
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        setCurrentPath(itemsrs.path);
      } catch (err: any) {
        console.error("MyErr: ", err);
        console.error("err.message: ", err.message);
        console.error(" err.response.status: ", err.response.status);
        if (err && err.response && err.response.status === 401) {
          navigate("/login");
        }
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [location, navigate]);


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-red-600">
        Error: {error}
      </div>
    );
  }

  const handlePlayerClose = async (isDisqualified: boolean, oriPath: string, isNewName: boolean, newName: string) => {
    setSelectedVideo(null);
    try {
      if (isDisqualified) {
        await postDisqualified(oriPath)
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Disqualified");
      } else if (isNewName) {
        await renameFileMoveToDone(oriPath, newName)
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Rename Done");
      }
    } catch (error) {
      console.error("Failed to move or rename file:", error);
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
              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  setError(false);
                  const itemsrs = await fetchDirList(currentPath);
                  setItems(itemsrs);
                  setIsLoading(false);
                }}
                className="p-1 mr-2 bg-transparent hover:bg-gray-300"
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
                          navigate("/home" + targetPath);
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
            ) : !items || !items.items || items.items.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">This folder is empty.</p>
            ) : (
              <div className="max-h-[calc(100vh-200px)] scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/30 dark:scrollbar-thumb-white/30 scrollbar-track-white/0 overflow-y-scroll">
                {items.items.map((file, index) => (
                  <>
                    <div
                      key={index}
                      onClick={() => handleFileClick(file)}
                      className="group grid grid-cols-12 items-center px-2 py-3 hover:bg-gray-500/20 cursor-pointer rounded-md"
                    >
                      {/* NAME */}
                      <div className="col-span-12 lg:col-span-6 flex items-center space-x-3 min-w-0">
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
                    <div className="w-full border-b border-gray-300 dark:border-white/20" />
                  </>
                ))}
              </div>
            )}
          </main>
        </div>

      </div>
      {selectedVideo && (
        <VideoPlayerModal
          file={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={handlePlayerClose} // Close modal by clearing state
        />
        // <VideoPlayerCompressModal
        //   file={selectedVideo}
        //   isOpen={!!selectedVideo}
        //   onClose={handlePlayerClose} // Close modal by clearing state
        // />
      )}
      <VersionTag />
    </DefaultLayout>

  );
}
