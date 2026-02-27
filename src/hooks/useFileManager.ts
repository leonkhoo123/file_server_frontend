import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchDirList, type ItemsResponse, type FileInterface, deleteTempRotate, copyFiles, moveFiles, deleteFiles, deletePermanentFiles, renameFile } from "@/api/api-file";
import { postDisqualified, renameFileMoveToDone } from "@/api/api-video";
import { wsClient, type OperationMessage } from "@/api/wsClient";
import { usePreferences } from "@/context/PreferencesContext";

export function useFileManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showHiddenFiles } = usePreferences();
  
  const [items, setItems] = useState<ItemsResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<FileInterface | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboardItems, setClipboardItems] = useState<{ items: string[], operation: 'cut' | 'copy' | null, sourceDir?: string }>({ items: [], operation: null });

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const handleRefresh = useCallback(async () => {
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
      console.error(" err.response.status: ", err?.response?.status);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.response?.status === 401) {
        void navigate("/login");
      }
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, navigate]);

  // Load files effect
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!location) return;

    const loadFiles = async () => {
      setIsLoading(true);
      setError(false);
      setSelectedItems(new Set()); // Clear selections when changing directories
      setLastSelectedIndex(null);

      try {
        const path = decodeURIComponent(location.pathname.replace("/home", "")) || "/";
        const itemsrs = await fetchDirList(path);
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
  }, [location, navigate]);

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
  };

  const handleSelectAll = () => {
    if (!items?.items) return;
    const allNames = new Set(
      items.items
        .filter(item => showHiddenFiles || !item.name.startsWith("."))
        .map(item => item.name)
    );
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

  const handleRename = async () => {
    if (selectedItems.size !== 1) {
      toast.error("Please select exactly one item to rename");
      return;
    }

    const oldName = Array.from(selectedItems)[0];
    const newName = window.prompt("Enter new name:", oldName);

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

  const handleBack = () => {
    if (currentPath === "/") return;
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? "/" + pathParts.join("/") : "/";
    void navigate("/home" + parentPath);
  };

  const handleFileClick = (fileInfo: FileInterface, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItems(prev => {
      let newSet = new Set(prev);
      
      const displayedItems = items?.items.filter(item => showHiddenFiles || !item.name.startsWith(".")) ?? [];

      if (event.shiftKey && lastSelectedIndex !== null && displayedItems.length > 0) {
        // Shift+Click: Select range and clear others
        newSet = new Set();
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSet.add(displayedItems[i].name);
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl+Click: Toggle selection
        if (newSet.has(fileInfo.name)) {
          newSet.delete(fileInfo.name);
        } else {
          newSet.add(fileInfo.name);
        }
        setLastSelectedIndex(index);
      } else {
        // Normal click: Single selection
        newSet = new Set();
        newSet.add(fileInfo.name);
        setLastSelectedIndex(index);
      }
      
      return newSet;
    });
  };

  const handleFileDoubleClick = (fileInfo: FileInterface) => {
    if (fileInfo.isVideo) {
      setSelectedVideo(fileInfo);
    } else if (fileInfo.type === "dir") {
      const newPath = currentPath === "/" ? `/${fileInfo.name}` : `${currentPath}/${fileInfo.name}`;
      void navigate("/home" + newPath);
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
    handleBack,
    handleFileClick,
    handleFileDoubleClick,
    handlePlayerClose,
    removeRotateTemp,
    handleRefresh,
  };
}
