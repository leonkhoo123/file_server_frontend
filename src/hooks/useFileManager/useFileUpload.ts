import { useCallback } from 'react';
import { toast } from "sonner";
import { uploadFile, type UploadProgressEvent } from "@/api/api-file";
import { useOperationProgress } from "@/context/OperationProgressContext";
import { formatBytes } from "@/utils/utils";

export function useFileUpload(handleRefresh: () => Promise<void>, uploadChunkSize?: number) {
  const { addOrUpdateOperation } = useOperationProgress();

  const handleUploadFiles = useCallback(async (files: File[], targetPath: string) => {
    const newUploads = files.map(file => ({
      id: "upload-" + Math.random().toString(36).substring(7),
      name: file.name,
    }));

    // Initialize all uploads in context
    newUploads.forEach(upload => {
      addOrUpdateOperation({
        opId: upload.id,
        opType: 'upload',
        opName: `Uploading ${upload.name}`,
        opStatus: 'queued',
        destDir: targetPath,
        opPercentage: 0,
      });
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const upload = newUploads[i];

      addOrUpdateOperation({
        opId: upload.id,
        opType: 'upload',
        opName: `Uploading ${upload.name}`,
        opStatus: 'in-progress',
        destDir: targetPath,
        opPercentage: 0,
      });

      try {
        await uploadFile(targetPath, file, (progressEvent: UploadProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            let speedText = progressEvent.rate ? `${formatBytes(progressEvent.rate)}/s` : '';
            if (progressEvent.estimated) {
                const est = progressEvent.estimated;
                const minutes = Math.floor(est / 60);
                const seconds = Math.floor(est % 60);
                const timeStr = minutes > 0 ? `${String(minutes)}m ${String(seconds)}s` : `${String(seconds)}s`;
                speedText += speedText ? ` • ${timeStr}` : timeStr;
            }
            const opSpeed = speedText || undefined;
            addOrUpdateOperation({
              opId: upload.id,
              opType: 'upload',
              opName: `Uploading ${upload.name}`,
              opStatus: 'in-progress',
              destDir: targetPath,
              opPercentage: progress,
              opSpeed,
            });
          }
        }, upload.id, uploadChunkSize);
        
        addOrUpdateOperation({
          opId: upload.id,
          opType: 'upload',
          opName: `Uploaded ${upload.name}`,
          opStatus: 'completed',
          destDir: targetPath,
          opPercentage: 100,
        });
      } catch (error: unknown) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        const isCancelled = errorMessage === "Upload cancelled";
        
        addOrUpdateOperation({
          opId: upload.id,
          opType: 'upload',
          opName: isCancelled ? `Cancelled upload for ${upload.name}` : `Failed to upload ${upload.name}`,
          opStatus: isCancelled ? 'aborted' : 'error',
          destDir: targetPath,
          error: isCancelled ? undefined : errorMessage,
        });
        
        if (!isCancelled) {
            toast.error(`Failed to upload ${file.name}`);
        }
      }
    }
    
    // Refresh after all uploads finish
    if (files.length > 0) {
      void handleRefresh();
    }
  }, [addOrUpdateOperation, handleRefresh, uploadChunkSize]);

  return { handleUploadFiles };
}
