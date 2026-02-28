import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { fetchDirList, type ItemsResponse } from "@/api/api-file";
import { wsClient, type OperationMessage } from "@/api/wsClient";
import { usePreferences } from "@/context/PreferencesContext";
import { decodeUrlToPath } from "@/utils/utils";

export function useFileSystem() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showHidden } = usePreferences();
  
  const [items, setItems] = useState<ItemsResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>("/");

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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!location) return;

    const loadFiles = async () => {
      setIsLoading(true);
      setError(false);
      setItems(undefined); // Clear items to show skeleton on directory change

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

  return {
    items,
    setItems,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentPath,
    handleRefresh
  };
}
