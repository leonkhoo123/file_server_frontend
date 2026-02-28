import { useState } from 'react';
import { toast } from "sonner";
import { 
  copyFiles, moveFiles, deleteFiles, deletePermanentFiles, 
  renameFile, createFolder, getFileProperties, 
  type PropertiesResponse 
} from "@/api/api-file";

export function useFileOperations({
  currentPath,
  selectedItems,
  setSelectedItems,
  handleRefresh,
  setIsLoading
}: {
  currentPath: string;
  selectedItems: Set<string>;
  setSelectedItems: (items: Set<string>) => void;
  handleRefresh: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
}) {
  const [clipboardItems, setClipboardItems] = useState<{ items: string[], operation: 'cut' | 'copy' | null, sourceDir?: string }>({ items: [], operation: null });
  const [itemsToDelete, setItemsToDelete] = useState<Set<string> | null>(null);
  const [itemToRename, setItemToRename] = useState<string | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState<PropertiesResponse | null>(null);
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);

  const isDeleteDialogOpen = itemsToDelete !== null;
  const setIsDeleteDialogOpen = (open: boolean) => {
    if (!open) setItemsToDelete(null);
  };

  const isRenameDialogOpen = itemToRename !== null;
  const setIsRenameDialogOpen = (open: boolean) => {
    if (!open) setItemToRename(null);
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
        toast.success(`Added ${clipboardItems.items.length} item(s) to copy queue`);
      } else {
        await moveFiles(clipboardItems.items, currentPath);
        toast.success(`Added ${clipboardItems.items.length} item(s) to move queue`);
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

  const handleCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
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

  return {
    clipboardItems,
    handleCut,
    handleCopy,
    handlePaste,
    itemsToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDelete,
    confirmDelete,
    itemToRename,
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    handleRename,
    confirmRename,
    isCreateFolderDialogOpen,
    setIsCreateFolderDialogOpen,
    handleCreateFolder,
    confirmCreateFolder,
    propertiesData,
    isPropertiesDialogOpen,
    setIsPropertiesDialogOpen,
    isPropertiesLoading,
    handleProperties
  };
}
