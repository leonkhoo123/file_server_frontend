import { File, Folder, Trash2, Scissors, Copy, Clipboard, Pencil, Trash2 as TrashIcon, Info, UploadCloud, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatLastModified } from "@/utils/utils";
import type { ItemsResponse, FileInterface } from "@/api/api-file";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TruncatedText } from "@/components/custom/truncatedText";
import { useState, useCallback, useRef, useEffect } from "react";

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
  onRename: (fileName?: string) => void;
  onDelete: (fileName?: string) => void;
  onPaste: () => void;
  onProperties: (fileName?: string, isCurrentDir?: boolean) => void;
  onCreateFolder: () => void;
  clipboardItems: string[];
  clipboardItemsCount: number;
  clipboardOperation: 'cut' | 'copy' | null;
  clipboardSourceDir?: string;
  currentPath: string;
  onUploadDrop: (files: File[], targetPath: string) => void;
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
  onCreateFolder,
  clipboardItems,
  clipboardItemsCount,
  clipboardOperation,
  clipboardSourceDir,
  currentPath,
  onUploadDrop,
}: HomeFileListProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [displayItems, setDisplayItems] = useState<ItemsResponse | undefined>(items);
  const [transitioningFolder, setTransitioningFolder] = useState<string | null>(null);
  const [openDropdownName, setOpenDropdownName] = useState<string | null>(null);

  useEffect(() => {
    if (items) {
      setDisplayItems(items);
      setTransitioningFolder(null); // Reset transition state when items change
    }
  }, [items]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const traverseFileTree = async (item: any, path: string, files: File[]): Promise<void> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (item.isFile) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        item.file((file: File) => {
          // Attach custom path for folder structures on drop
          if (path) {
            Object.defineProperty(file, 'customPath', {
              value: path + file.name,
              writable: false,
            });
          }
          files.push(file);
          resolve();
        });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (item.isDirectory) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const dirReader = item.createReader();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        dirReader.readEntries(async (entries: any[]) => {
          for (const entry of entries) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-plus-operands
            await traverseFileTree(entry, path + item.name + "/", files);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (items) {
      for (const item of Array.from(items)) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseFileTree(entry, "", files);
        }
      }
    } else {
      // Fallback for older browsers
      for (const file of Array.from(e.dataTransfer.files)) {
        files.push(file);
      }
    }

    if (files.length > 0) {
      onUploadDrop(files, currentPath);
    }
  }, [currentPath, onUploadDrop]);

  const touchTimer = useRef<number | null>(null);

  const handleTouchStart = useCallback((file: FileInterface, index: number) => {
    if (touchTimer.current) {
      window.clearTimeout(touchTimer.current);
    }
    // Set a timer for 500ms to trigger right-click (context menu) behavior
    touchTimer.current = window.setTimeout(() => {
      // Trigger the selection of the item, so context menu actions apply to it
      onFileContextMenu(file, index);
      
      // Dispatch a context menu event on the element to open the Radix ContextMenu
      const el = document.getElementById(`file-item-${index}`);
      if (el) {
        // Prevent default tap behavior after a long press
        // This stops the tap from triggering a normal click
        el.setAttribute('data-long-pressed', 'true');
        window.setTimeout(() => {
          el.removeAttribute('data-long-pressed');
        }, 300);
        
        if (window.matchMedia("(pointer: coarse)").matches) {
          return;
        }

        el.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: el.getBoundingClientRect().left + 20,
          clientY: el.getBoundingClientRect().top + 20
        }));
      }
    }, 500);
  }, [onFileContextMenu]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer.current) {
      window.clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // If the user scrolls or moves their finger, cancel the long press
    if (touchTimer.current) {
      window.clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  }, []);

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  const handleItemClick = useCallback((file: FileInterface, index: number, e: React.MouseEvent) => {
    const el = e.currentTarget;
    if (el.getAttribute('data-long-pressed') === 'true') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isTouchDevice && file.type === "dir" && selectedItems.size === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Delay for animation before actually doing the action
      setTransitioningFolder(file.name);
      
      e.stopPropagation();
      e.preventDefault();

      const safeEvent = { 
        stopPropagation: () => { /* intentionally empty */ }, 
        preventDefault: () => { /* intentionally empty */ },
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      } as unknown as React.MouseEvent;
      
      setTimeout(() => {
        onFileClick(file, index, safeEvent);
      }, 75);
      return;
    }
    
    onFileClick(file, index, e);
  }, [isTouchDevice, onFileClick, selectedItems.size]);

  const handleItemDoubleClick = useCallback((file: FileInterface) => {
    if (!isTouchDevice && file.type === "dir") {
      setTransitioningFolder(file.name);
      setTimeout(() => {
        onFileDoubleClick(file);
      }, 75);
      return;
    }
    onFileDoubleClick(file);
  }, [isTouchDevice, onFileDoubleClick]);

  const fileListContainer = (
    <div className="flex-1 min-h-0 relative overflow-y-scroll p-2 md:p-4 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
      {/* Loading Overlay */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-10 ${
          isLoading && !items ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p>Loading files...</p>
        </div>
      </div>

      {/* Content Layer */}
      <div 
        className={`transition-opacity duration-300 min-h-full ${
          isLoading && !items ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[50vh]">
            <p className="text-red-500 mb-2">Failed to load directory.</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>Try Again</Button>
          </div>
        ) : !displayItems?.items || displayItems.items.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-muted-foreground min-h-[50vh] transition-opacity duration-300 ${isLoading ? 'opacity-30 pointer-events-none' : 'opacity-60'}`}>
            <Folder className="h-16 w-16 mb-4 opacity-20" />
            <p>This folder is empty.</p>
          </div>
        ) : (
            <div className={`space-y-1 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {displayItems.items.map((file, index) => {
                const isSelected = selectedItems.has(file.name);
              const isHidden = file.name.startsWith('.');
              const filePath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
              const isCut = clipboardOperation === 'cut' && clipboardItems.includes(filePath);

              const fileContent = (
                <div id={`file-item-${index}`} className="group">
                  <div
                    onClick={(e) => {
                      handleItemClick(file, index, e);
                    }}
                    onDoubleClick={() => { handleItemDoubleClick(file); }}
                    onTouchStart={() => { handleTouchStart(file, index); }}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onTouchCancel={handleTouchEnd}
                    onContextMenu={(e) => {
                      if (window.matchMedia("(pointer: coarse)").matches) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex items-center pl-4 pr-1 md:px-6 py-2 md:py-3 cursor-pointer rounded-md transition-all duration-75 ease-out select-none min-h-[64px] md:min-h-[44px] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] ${
                      transitioningFolder === file.name
                        ? 'bg-blue-300/80 dark:bg-blue-600/80 scale-[0.96]'
                        : isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/40 @media(hover:hover):hover:bg-blue-200 @media(hover:hover):dark:hover:bg-blue-900/60'
                          : 'bg-transparent @media(hover:hover):hover:bg-muted/50'
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
                            <TruncatedText className="font-medium text-foreground" text={file.name === ".cloud_delete" ? "Recycle Bin" : file.name} />
                            <TruncatedText className="text-xs mt-0.5 lg:hidden text-muted-foreground" text={formatLastModified(file.modified)} />
                          </div>
                        </>
                      ) : (
                        <>
                          <File className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="flex flex-col min-w-0 w-full text-left">
                            <TruncatedText className="text-foreground" text={file.name} />
                            <TruncatedText className="text-xs mt-0.5 lg:hidden text-muted-foreground" text={`${formatBytes(file.size)} • ${formatLastModified(file.modified)}`} />
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

                    {/* ACTIONS (mobile only) */}
                    {selectedItems.size === 0 && (
                      <div className="md:hidden ml-1 flex items-center shrink-0 relative">
                        <DropdownMenu 
                          open={openDropdownName === file.name}
                          onOpenChange={(open) => {
                            if (!open) setOpenDropdownName(null);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <div className="absolute inset-0 pointer-events-none" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48" onClick={(e) => { e.stopPropagation(); }}>
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownName(null);
                              onRename(file.name);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownName(null);
                              onDelete(file.name);
                            }} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/30">
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownName(null);
                              onProperties(file.name);
                            }}>
                              <Info className="mr-2 h-4 w-4" />
                              Info
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-8 text-muted-foreground" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownName(openDropdownName === file.name ? null : file.name);
                          }}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );

              if (isTouchDevice) {
                return (
                  <div key={file.name}>
                    {fileContent}
                  </div>
                );
              }

              return (
                <ContextMenu key={file.name} onOpenChange={(open) => {
                  if (open) {
                    onFileContextMenu(file, index);
                  }
                }}>
                  <ContextMenuTrigger asChild>
                    {fileContent}
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
            
            {/* Counts acting as spacer */}
            <div className="flex items-center justify-center text-sm text-muted-foreground h-20 md:h-12 border-t mt-2 border-border/50">
              {displayItems.folder_count !== undefined ? (
                <span>{displayItems.folder_count} folder(s), {displayItems.file_count} file(s), total {displayItems.count} item(s)</span>
              ) : (
                <span>total {displayItems.items.length} item(s)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-full w-full relative min-h-0"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-lg flex flex-col items-center justify-center pointer-events-none transition-all">
          <UploadCloud className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Drop files here to upload</h3>
          <p className="text-blue-500/80 mt-2">Uploading to: {currentPath === "/" ? "Root" : currentPath}</p>
        </div>
      )}

      {/* Table Header */}
      <div className="flex border-b font-semibold py-3 md:py-2 px-6 md:px-10 text-base md:text-sm bg-muted/30 shrink-0 overflow-y-scroll scrollbar scrollbar-thumb-transparent scrollbar-track-transparent">
        <div className="flex-1 text-left text-muted-foreground">Name</div>
        <div className="w-24 md:w-32 hidden lg:block text-right text-muted-foreground">Size</div>
        <div className="w-32 md:w-48 hidden lg:block text-right text-muted-foreground">Last Modified</div>
      </div>

      {isTouchDevice ? (
        fileListContainer
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {fileListContainer}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuItem onClick={(e) => { e.stopPropagation(); onCreateFolder(); }}>
              <Folder className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={(e) => { e.stopPropagation(); onPaste(); }} 
              disabled={clipboardItemsCount === 0 || (clipboardOperation === 'cut' && clipboardSourceDir === currentPath)}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Paste
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={(e) => { e.stopPropagation(); onProperties(undefined, true); }}>
              <Info className="mr-2 h-4 w-4" />
              Info
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </div>
  );
}
