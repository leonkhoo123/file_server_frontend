import { File, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";
import { formatBytes, formatLastModified } from "@/utils/utils";
import type { ItemsResponse, FileInterface } from "@/api/api-file";

interface HomeFileListProps {
  isLoading: boolean;
  error: boolean;
  items?: ItemsResponse;
  selectedItems: Set<string>;
  onRefresh: () => void;
  onFileClick: (fileInfo: FileInterface, index: number, event: React.MouseEvent) => void;
  onFileDoubleClick: (fileInfo: FileInterface) => void;
}

export default function HomeFileList({
  isLoading,
  error,
  items,
  selectedItems,
  onRefresh,
  onFileClick,
  onFileDoubleClick,
}: HomeFileListProps) {
  return (
    <>
      {/* Table Header */}
      <div className="flex border-b font-semibold py-2 px-2 md:px-4 text-sm bg-muted/30 shrink-0">
        <div className="flex-1 text-left text-muted-foreground">Name</div>
        <div className="w-24 md:w-32 hidden lg:block text-right text-muted-foreground">Size</div>
        <div className="w-32 md:w-48 hidden lg:block text-right text-muted-foreground">Last Modified</div>
      </div>

      {/* File List Content */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
        {isLoading ? (
          <FileListTableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-red-500 mb-2">Failed to load directory.</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>Try Again</Button>
          </div>
        ) : !items?.items || items.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
            <Folder className="h-16 w-16 mb-4 opacity-20" />
            <p>This folder is empty.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.items.map((file, index) => {
              const isSelected = selectedItems.has(file.name);
              const isHidden = file.name.startsWith('.');
              return (
                <div key={index} className="group">
                  <div
                    onClick={(e) => { onFileClick(file, index, e); }}
                    onDoubleClick={() => { onFileDoubleClick(file); }}
                    className={`flex items-center px-2 md:px-4 py-2 md:py-3 cursor-pointer rounded-md transition-colors select-none ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* NAME */}
                    <div className={`flex-1 flex items-center space-x-3 min-w-0 pr-2 md:pr-4 ${isHidden ? 'opacity-60' : ''}`}>
                      {file.type === "dir" ? (
                        <>
                          <Folder className="h-5 w-5 shrink-0 text-blue-500 fill-blue-500/20" />
                          <div className="flex flex-col min-w-0 w-full text-left">
                            <span className="truncate font-medium text-foreground">{file.name}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <File className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="flex flex-col min-w-0 w-full text-left">
                            <span className="truncate text-foreground">{file.name}</span>
                            <span className="text-xs truncate mt-0.5 lg:hidden text-muted-foreground">
                              {formatBytes(file.size)} • {formatLastModified(file.modified)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* SIZE (desktop only) */}
                    <div className={`w-24 md:w-32 hidden lg:block text-right text-sm text-muted-foreground ${isHidden ? 'opacity-60' : ''}`}>
                      {file.type === "dir" ? "--" : formatBytes(file.size)}
                    </div>

                    {/* LAST MODIFIED (desktop only) */}
                    <div className={`w-32 md:w-48 hidden lg:block text-right text-sm text-muted-foreground ${isHidden ? 'opacity-60' : ''}`}>
                      {formatLastModified(file.modified)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
