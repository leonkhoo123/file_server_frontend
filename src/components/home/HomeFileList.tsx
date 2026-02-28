import { File, Folder, Trash2, Scissors, Copy, Clipboard, Pencil, Trash2 as TrashIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";
import { formatBytes, formatLastModified } from "@/utils/utils";
import type { ItemsResponse, FileInterface } from "@/api/api-file";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface HomeFileListProps {
  isLoading: boolean;
  error: boolean;
  items?: ItemsResponse;
  selectedItems: Set<string>;
  onRefresh: () => void;
  onFileClick: (fileInfo: FileInterface, index: number, event: React.MouseEvent) => void;
  onFileDoubleClick: (fileInfo: FileInterface) => void;
  onFileContextMenu: (fileInfo: FileInterface, index: number) => void;
  onCut: () => void;
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onPaste: () => void;
  onProperties: () => void;
  clipboardItems: string[];
  clipboardItemsCount: number;
  clipboardOperation: 'cut' | 'copy' | null;
  clipboardSourceDir?: string;
  currentPath: string;
}

export default function HomeFileList({
  isLoading,
  error,
  items,
  selectedItems,
  onRefresh,
  onFileClick,
  onFileDoubleClick,
  onFileContextMenu,
  onCut,
  onCopy,
  onRename,
  onDelete,
  onPaste,
  onProperties,
  clipboardItems,
  clipboardItemsCount,
  clipboardOperation,
  clipboardSourceDir,
  currentPath,
}: HomeFileListProps) {
  return (
    <>
      {/* Table Header */}
      <div className="flex border-b font-semibold py-2 px-6 md:px-10 text-sm bg-muted/30 shrink-0">
        <div className="flex-1 text-left text-muted-foreground">Name</div>
        <div className="w-24 md:w-32 hidden lg:block text-right text-muted-foreground">Size</div>
        <div className="w-32 md:w-48 hidden lg:block text-right text-muted-foreground">Last Modified</div>
      </div>

      {/* File List Content */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
        {isLoading && !items ? (
          <FileListTableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-red-500 mb-2">Failed to load directory.</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>Try Again</Button>
          </div>
        ) : !items?.items || items.items.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-muted-foreground ${isLoading ? 'opacity-30 pointer-events-none' : 'opacity-60'}`}>
            <Folder className="h-16 w-16 mb-4 opacity-20" />
            <p>This folder is empty.</p>
          </div>
        ) : (
          <div className={`space-y-1 ${isLoading ? 'opacity-50 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}`}>
            {items.items.map((file, index) => {
              const isSelected = selectedItems.has(file.name);
              const isHidden = file.name.startsWith('.');
              const filePath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
              const isCut = clipboardOperation === 'cut' && clipboardItems.includes(filePath);
              return (
                <ContextMenu key={file.name} onOpenChange={(open) => {
                  if (open) {
                    onFileContextMenu(file, index);
                  }
                }}>
                  <ContextMenuTrigger asChild>
                    <div id={`file-item-${index}`} className="group">
                      <div
                        onClick={(e) => { onFileClick(file, index, e); }}
                        onDoubleClick={() => { onFileDoubleClick(file); }}
                        className={`flex items-center px-4 md:px-6 py-2 md:py-3 cursor-pointer rounded-md transition-colors select-none ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                            : 'hover:bg-muted/50'
                        } ${isCut ? 'opacity-50' : ''}`}
                      >
                        {/* NAME */}
                        <div className={`flex-1 flex items-center space-x-3 min-w-0 pr-2 md:pr-4 ${isHidden ? 'opacity-60' : ''}`}>
                          {file.type === "dir" ? (
                            <>
                              {file.name === ".cloud_delete" ? (
                                <Trash2 className="h-5 w-5 shrink-0 text-blue-500" />
                              ) : (
                                <Folder className="h-5 w-5 shrink-0 text-blue-500 fill-blue-500/20" />
                              )}
                              <div className="flex flex-col min-w-0 w-full text-left">
                                <span className="truncate font-medium text-foreground">{file.name === ".cloud_delete" ? "Recycle Bin" : file.name}</span>
                                <span className="text-xs truncate mt-0.5 lg:hidden text-muted-foreground">
                                  {formatLastModified(file.modified)}
                                </span>
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
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={(e) => { e.stopPropagation(); onCut(); }} disabled={selectedItems.size === 0}>
                      <Scissors className="mr-2 h-4 w-4" />
                      Cut
                    </ContextMenuItem>
                    <ContextMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }} disabled={selectedItems.size === 0}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={(e) => { e.stopPropagation(); onPaste(); }} 
                      disabled={clipboardItemsCount === 0 || (clipboardOperation === 'cut' && clipboardSourceDir === currentPath)}
                    >
                      <Clipboard className="mr-2 h-4 w-4" />
                      Paste
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }} disabled={selectedItems.size !== 1}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={selectedItems.size === 0} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/30">
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={(e) => { e.stopPropagation(); onProperties(); }} disabled={selectedItems.size === 0}>
                      <Info className="mr-2 h-4 w-4" />
                      Info
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
