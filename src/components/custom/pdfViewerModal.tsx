import { useEffect } from "react";
import { X, Download } from "lucide-react";
import { type FileInterface, downloadFiles } from "@/api/api-file";
import { Button } from "@/components/ui/button";

interface PdfViewerModalProps {
  file: FileInterface | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfViewerModal({ file, isOpen, onClose }: PdfViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    downloadFiles([file.path]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-screen h-screen bg-background animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center space-x-4 overflow-hidden">
          <h2 className="text-lg font-semibold truncate" title={file.name}>
            {file.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="hidden sm:flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content - Iframe */}
      <div className="flex-1 w-full bg-muted/10">
        <iframe
          src={file.url}
          className="w-full h-full border-none"
          title={file.name}
        />
      </div>
    </div>
  );
}
