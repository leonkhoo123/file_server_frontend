import { useState } from 'react';
import { toast } from "sonner";
import { postDisqualified, renameFileMoveToDone } from "@/api/api-video";
import { deleteTempRotate, fetchDirList, type ItemsResponse, type FileInterface } from "@/api/api-file";

export function useVideoOperations({
  currentPath,
  setItems,
  setIsLoading,
  setError
}: {
  currentPath: string;
  setItems: (items: ItemsResponse | undefined) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
}) {
  const [selectedVideo, setSelectedVideo] = useState<FileInterface | null>(null);

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

  return { selectedVideo, setSelectedVideo, handlePlayerClose, removeRotateTemp };
}
