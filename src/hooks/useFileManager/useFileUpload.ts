import { useCallback } from 'react';
import { toast } from "sonner";
import { uploadFile, type UploadProgressEvent } from "@/api/api-file";
import { useOperationProgress } from "@/context/OperationProgressContext";

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
            addOrUpdateOperation({
              opId: upload.id,
              opType: 'upload',
              opName: `Uploading ${upload.name}`,
              opStatus: 'in-progress',
              destDir: targetPath,
              opPercentage: progress,
            });
          }
        }, undefined, uploadChunkSize);
        
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
        addOrUpdateOperation({
          opId: upload.id,
          opType: 'upload',
          opName: `Failed to upload ${upload.name}`,
          opStatus: 'error',
          destDir: targetPath,
          error: errorMessage,
        });
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    // Refresh after all uploads finish
    if (files.length > 0) {
      void handleRefresh();
    }
  }, [addOrUpdateOperation, handleRefresh, uploadChunkSize]);

  return { handleUploadFiles };
}
