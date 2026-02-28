import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchDirList, type ItemsResponse, type FileInterface, deleteTempRotate, copyFiles, moveFiles, deleteFiles, deletePermanentFiles, renameFile, createFolder, getFileProperties, type PropertiesResponse } from "@/api/api-file";
import { postDisqualified, renameFileMoveToDone } from "@/api/api-video";
import { wsClient, type OperationMessage } from "@/api/wsClient";
import { usePreferences } from "@/context/PreferencesContext";
import { encodePathToUrl, decodeUrlToPath } from "@/utils/utils";

export function useFileManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showHidden } = usePreferences();
  
  const [items, setItems] = useState<ItemsResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<FileInterface | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboardItems, setClipboardItems] = useState<{ items: string[], operation: 'cut' | 'copy' | null, sourceDir?: string }>({ items: [], operation: null });

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const itemsrs = await fetchDirList(currentPath, showHidden);
      setItems(itemsrs);
    } catch (err: any) {
      console.error("MyErr: ", err);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error("err.message: ", err.message);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error(" err.response.status: ", err?.response?.status);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.response?.status === 401) {
        void navigate("/login");
      }
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, showHidden, navigate]);

  // Load files effect
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!location) return;

    const loadFiles = async () => {
      setIsLoading(true);
      setError(false);
      setItems(undefined); // Clear items to show skeleton on directory change
      setSelectedItems(new Set()); // Clear selections when changing directories
      setLastSelectedIndex(null);

      try {
        const rawPath = decodeURIComponent(location.pathname.replace("/home", "")) || "/";
        const path = decodeUrlToPath(rawPath);
        const itemsrs = await fetchDirList(path, showHidden);
        setItems(itemsrs);
        setCurrentPath(itemsrs.path);
      } catch (err: any) {
        console.error("MyErr: ", err);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error("err.message: ", err.message);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error(" err.response.status: ", err?.response?.status);
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
  }, [location, showHidden, navigate]);

  // Listen for websocket operations completion to auto-refresh
  useEffect(() => {
    const unsubscribe = wsClient.subscribe((msg: OperationMessage) => {
      if (msg.opStatus === 'completed' && msg.destDir === currentPath) {
        void handleRefresh();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentPath, handleRefresh]);

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
    setSelectionAnchorIndex(null);
  };

  const handleSelectAll = () => {
    if (!items?.items) return;
    const allNames = new Set(items.items.map(item => item.name));
    setSelectedItems(allNames);
  };

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

  const [itemsToDelete, setItemsToDelete] = useState<Set<string> | null>(null);
  const isDeleteDialogOpen = itemsToDelete !== null;
  const setIsDeleteDialogOpen = (open: boolean) => {
    if (!open) setItemsToDelete(null);
  };

  const handleDelete = () => {
    if (selectedItems.size === 0) return;
    setItemsToDelete(new Set(selectedItems));
  };

  const confirmDelete = async () => {
    if (!itemsToDelete || itemsToDelete.size === 0) return;
    try {
      setItemsToDelete(null); // close modal immediately
      setIsLoading(true);
      const sources = Array.from(itemsToDelete).map(name =>
        currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
      );
      
      if (currentPath.startsWith("/.cloud_delete") || currentPath === "/.cloud_delete") {
        await deletePermanentFiles(sources);
        toast.success(`Permanently deleted ${itemsToDelete.size} item(s)`);
      } else {
        await deleteFiles(sources);
        toast.success(`Moved ${itemsToDelete.size} item(s) to recycle bin`);
      }

      setSelectedItems(new Set());
      await handleRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Delete operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const [itemToRename, setItemToRename] = useState<string | null>(null);
  const isRenameDialogOpen = itemToRename !== null;
  const setIsRenameDialogOpen = (open: boolean) => {
    if (!open) setItemToRename(null);
  };

  const handleRename = () => {
    if (selectedItems.size !== 1) {
      toast.error("Please select exactly one item to rename");
      return;
    }
    const oldName = Array.from(selectedItems)[0];
    setItemToRename(oldName);
  };

  const confirmRename = async (newName: string) => {
    if (!itemToRename || !newName || newName === itemToRename) {
      setItemToRename(null);
      return;
    }

    try {
      const oldName = itemToRename;
      setItemToRename(null);
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

  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);

  const handleCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
  };

  const [propertiesData, setPropertiesData] = useState<PropertiesResponse | null>(null);
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);

  const handleProperties = async () => {
    if (selectedItems.size === 0) return;
    try {
      setIsPropertiesLoading(true);
      const sources = Array.from(selectedItems).map(name =>
        currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
      );
      const data = await getFileProperties(sources);
      setPropertiesData(data);
      setIsPropertiesDialogOpen(true);
    } catch (error) {
      console.error("Get properties failed:", error);
      toast.error("Failed to get properties");
    } finally {
      setIsPropertiesLoading(false);
    }
  };

  const confirmCreateFolder = async (folderName: string) => {
    if (!folderName) {
      setIsCreateFolderDialogOpen(false);
      return;
    }

    try {
      setIsCreateFolderDialogOpen(false);
      setIsLoading(true);
      await createFolder(currentPath, folderName);
      toast.success("Folder created successfully");
      await handleRefresh();
    } catch (error) {
      console.error("Create folder failed:", error);
      toast.error("Create folder failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentPath === "/") return;
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? "/" + pathParts.join("/") : "/";
    void navigate("/home" + encodePathToUrl(parentPath));
  };

  const handleFileClick = (fileInfo: FileInterface, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItems(prev => {
      let newSet = new Set(prev);
      
      if (event.shiftKey && selectionAnchorIndex !== null && items?.items) {
        // Shift+Click: Select range and clear others
        newSet = new Set();
        const start = Math.min(selectionAnchorIndex, index);
        const end = Math.max(selectionAnchorIndex, index);
        for (let i = start; i <= end; i++) {
          newSet.add(items.items[i].name);
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl+Click: Toggle selection
        if (newSet.has(fileInfo.name)) {
          newSet.delete(fileInfo.name);
        } else {
          newSet.add(fileInfo.name);
        }
        setSelectionAnchorIndex(index);
      } else {
        // Normal click: Single selection
        newSet = new Set();
        newSet.add(fileInfo.name);
        setSelectionAnchorIndex(index);
      }
      
      setLastSelectedIndex(index);
      return newSet;
    });
  };

  const handleFileContextMenu = (fileInfo: FileInterface, index: number) => {
    // We don't prevent default here because ContextMenu from radix handles it,
    // but we do need to update selection if the item is not already selected.
    setSelectedItems(prev => {
      if (prev.has(fileInfo.name)) {
        return prev;
      }
      const newSet = new Set<string>();
      newSet.add(fileInfo.name);
      setSelectionAnchorIndex(index);
      setLastSelectedIndex(index);
      return newSet;
    });
  };

  const handleFileDoubleClick = (fileInfo: FileInterface) => {
    if (fileInfo.isVideo) {
      setSelectedVideo(fileInfo);
    } else if (fileInfo.type === "dir") {
      const newPath = currentPath === "/" ? `/${fileInfo.name}` : `${currentPath}/${fileInfo.name}`;
      void navigate("/home" + encodePathToUrl(newPath));
    }
  };

  const handlePlayerClose = async (isDisqualified: boolean, oriPath: string, isNewName: boolean, newName: string, rotation: number): Promise<void> => {
    setSelectedVideo(null);
    try {
      if (isDisqualified) {
        await postDisqualified(oriPath);
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Disqualified");
      } else if (isNewName) {
        setIsLoading(true);
        await renameFileMoveToDone(oriPath, newName, rotation);
        setIsLoading(false);
        const itemsrs = await fetchDirList(currentPath);
        setItems(itemsrs);
        toast.success("Video Rename Done");
      }
    } catch (error) {
      console.error("Failed to move or rename file:", error);
    }
  };

  const removeRotateTemp = async () => {
    console.log("Removing temp_rotate");
    try {
      setIsLoading(true);
      await deleteTempRotate(currentPath);
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
  };

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.hasAttribute("contenteditable")) {
        return;
      }
      
      // Don't interfere if a dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      // We only care about specific keys
      const isArrowUp = e.key === 'ArrowUp';
      const isArrowDown = e.key === 'ArrowDown';
      const isEnter = e.key === 'Enter';
      const isDelete = e.key === 'Delete';
      const isEscape = e.key === 'Escape';
      const isA = e.key.toLowerCase() === 'a';
      
      if (!isArrowUp && !isArrowDown && !isEnter && !isDelete && !isEscape && !isA) {
        return;
      }

      // Ctrl+A / Cmd+A
      if (isA && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      if (isEscape) {
        e.preventDefault();
        handleClearSelection();
        return;
      }

      if (isDelete && selectedItems.size > 0) {
        e.preventDefault();
        handleDelete();
        return;
      }

      if (!items?.items || items.items.length === 0) return;

      if (isEnter) {
        if (selectedItems.size === 1 && lastSelectedIndex !== null) {
          e.preventDefault();
          handleFileDoubleClick(items.items[lastSelectedIndex]);
        }
        return;
      }

      if (isArrowUp || isArrowDown) {
        e.preventDefault(); // Prevent page scrolling

        let nextIndex = 0;

        if (lastSelectedIndex !== null) {
          nextIndex = isArrowDown ? lastSelectedIndex + 1 : lastSelectedIndex - 1;
          nextIndex = Math.max(0, Math.min(nextIndex, items.items.length - 1));
        } else {
          nextIndex = isArrowDown ? 0 : items.items.length - 1;
        }

        if (e.shiftKey) {
          const anchor = selectionAnchorIndex ?? lastSelectedIndex ?? nextIndex;
          const newSet = new Set<string>();
          const start = Math.min(anchor, nextIndex);
          const end = Math.max(anchor, nextIndex);
          for (let i = start; i <= end; i++) {
            newSet.add(items.items[i].name);
          }
          setSelectedItems(newSet);
          if (selectionAnchorIndex === null) {
            setSelectionAnchorIndex(anchor);
          }
        } else {
          const newSet = new Set<string>();
          newSet.add(items.items[nextIndex].name);
          setSelectedItems(newSet);
          setSelectionAnchorIndex(nextIndex);
        }
        
        setLastSelectedIndex(nextIndex);

        // Scroll into view
        setTimeout(() => {
          const element = document.getElementById(`file-item-${nextIndex}`);
          if (element) {
            element.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [items, lastSelectedIndex, selectionAnchorIndex, selectedItems, handleSelectAll, handleClearSelection, handleDelete, handleFileDoubleClick]);

  return {
    items,
    isLoading,
    error,
    selectedVideo,
    setSelectedVideo,
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
    isPropertiesLoading,
  };
}
