import { File, Folder, ChevronDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModeToggle } from "@/components/mode-toggle";
import DefaultLayout from "@/layouts/DefaultLayout";
import { fetchDirList, type ItemsResponse, type FileInterface, postDisqualified, renameFileMoveToDone } from "@/api/api-file";
// --- Main Component ---
import { useState, useEffect } from 'react';
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";
import { formatBytes, formatLastModified } from "@/utils/utils";
import VideoPlayerModal from "@/components/custom/videoPlayerModal";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";


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
      } catch (err) {
        setError(true);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [location]);


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
      } else if (isNewName) {
        await renameFileMoveToDone(oriPath, newName)
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
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
          {/* 2. Header (Navbar) */}
          <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6 shrink-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Cloud Drive</h1>
            </div>
            <ModeToggle></ModeToggle>
          </header>

          {/* 3. Main Content Area */}
          <main className="flex-col p-6 overflow-auto h-full">
            <div className="flex not-last:flex-row w-full">
              {/*refresh button */}
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
              {/* navigation */}
              <div className="w-full flex justify-start items-center bg-gray-200 px-2 rounded-md mb-2">
                {/* Home button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    navigate("/home")
                  }}
                  className="p-1 bg-transparent hover:bg-transparent hover:underline dark:text-black dark:hover:bg-transparent"
                >
                  Home
                </Button>
                <div className="text-sm text-gray-600">
                  {currentPath.split("/").filter(Boolean).map((part, idx, arr) => (
                    <span key={idx}>
                      {" / "}
                      <button
                        onClick={async () => {
                          const targetPath = "/" + arr.slice(0, idx + 1).join("/");
                          navigate("/home" + targetPath)
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


            {/* Table Wrapper */}
            <div className="w-full">
              {/* Header Table */}
              <Table className="w-full border-collapse">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-full lg:w-3/5">
                      <Button variant="ghost" className="p-0 h-auto font-semibold">
                        Name
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell lg:w-1/5 text-right">
                      <Button variant="ghost" className="p-0 pr-3 h-auto font-semibold">
                        Size
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell lg:w-1/5 text-right">
                      <Button variant="ghost" className="p-0 h-auto font-semibold">
                        Last Modified
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            {isLoading ? (
              <FileListTableSkeleton />
            ) : error ? (
              <p className="text-center text-red-500 mt-10">Failed to load directory.</p>
            ) : !items || !items.items || items.items.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">
                This folder is empty.
              </p>
            ) : (
              <>
                {/* Scrollable Body */}
                <div className="max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-250px)] overflow-y-auto">
                  <Table className="w-full border-collapse">
                    <TableBody>
                      {items.items.map((file, index) => (
                        <TableRow
                          key={index}
                          onClick={() => handleFileClick(file)}
                          className="group hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer"
                        >
                          <TableCell className="font-medium py-3 lg:w-[600px] lg:max-w-[600px] overflow-hidden">
                            <div className="flex items-center space-x-3">
                              {file.type === "dir" ? (
                                <Folder className="h-5 w-5 text-blue-500 shrink-0" />
                              ) : (
                                <File className="h-5 w-5 text-gray-400 shrink-0" />
                              )}
                              <span className="hidden lg:block text-left font-normal truncate w-full">
                                {file.name}
                              </span>

                              {file.type === "dir" ? (
                                <div className="lg:hidden flex-col text-left font-normal truncate w-full">
                                  <div className="py-2 font-normal">{file.name}</div>
                                </div>
                              ) : (
                                <div className="lg:hidden flex-col text-left font-normal truncate w-full">
                                  <div className="font-normal">{file.name}</div>
                                  <div className="text-sm font-normal text-gray-400">{formatBytes(file.size)}</div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {file.type === "dir" ? (
                            <TableCell className="hidden lg:table-cell lg:w-1/5 text-right"></TableCell>
                          ) : (
                            <TableCell className="hidden lg:table-cell lg:w-1/5 text-right">
                              {formatBytes(file.size)}
                            </TableCell>
                          )}
                          <TableCell className="hidden lg:table-cell lg:w-1/5 text-right">
                            {formatLastModified(file.modified)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
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
      )}
    </DefaultLayout>

  );
}
