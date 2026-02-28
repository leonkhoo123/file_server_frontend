import { useState } from "react";
import { ChevronDown, ChevronUp, UploadCloud, XCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { UploadProgress } from "@/hooks/useFileManager";

interface UploadProgressWidgetProps {
  uploads: UploadProgress[];
}

export function UploadProgressWidget({ uploads }: UploadProgressWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (uploads.length === 0) return null;

  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const isAllDone = totalUploads > 0 && completedUploads === totalUploads;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer border-b hover:bg-muted/80 transition-colors"
        onClick={() => { setIsExpanded(!isExpanded); }}
      >
        <div className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-sm">
            {isAllDone ? "Uploads complete" : `Uploading ${completedUploads}/${totalUploads} items`}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto p-2 space-y-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex flex-col gap-1 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 pr-2" title={upload.name}>{upload.name}</span>
                {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                {upload.status === 'error' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {upload.status === 'uploading' && <span className="text-xs text-muted-foreground">{upload.progress}%</span>}
                {upload.status === 'pending' && <span className="text-xs text-muted-foreground">Pending</span>}
              </div>
              
              {upload.status !== 'error' && upload.status !== 'completed' && (
                <Progress value={upload.progress} className="h-1.5" />
              )}
              
              {upload.status === 'error' && (
                <span className="text-xs text-red-500 truncate" title={upload.error}>{upload.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
