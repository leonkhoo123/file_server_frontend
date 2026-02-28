import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { type ItemsResponse, type FileInterface } from "@/api/api-file";
import { encodePathToUrl } from "@/utils/utils";

export function useFileSelection(
  items: ItemsResponse | undefined, 
  currentPath: string,
  setSelectedVideo: (video: FileInterface | null) => void
) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);

  // Clear selections when changing directories
  useEffect(() => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
    setSelectionAnchorIndex(null);
  }, [location]);

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

  return {
    selectedItems,
    setSelectedItems,
    lastSelectedIndex,
    setLastSelectedIndex,
    selectionAnchorIndex,
    setSelectionAnchorIndex,
    handleClearSelection,
    handleSelectAll,
    handleFileClick,
    handleFileContextMenu,
    handleFileDoubleClick
  };
}
