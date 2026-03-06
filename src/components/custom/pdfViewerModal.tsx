import { useEffect, useState, useRef } from "react";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { type FileInterface, downloadFiles } from "@/api/api-file";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import axiosLayer from "@/api/axiosLayer";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerModalProps {
  file: FileInterface | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfViewerModal({ file, isOpen, onClose }: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isTooLarge = file && file.size > 20 * 1024 * 1024; // 20MB limit

  // Fetch the PDF using axiosLayer to handle authentication/refresh
  useEffect(() => {
    if (!isOpen || !file) {
      setPdfData(null);
      return;
    }

    if (isTooLarge) {
      setFetchError("File is too large to preview in the browser. Please download it instead.");
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;
    const fetchPdf = async () => {
      setIsLoadingFile(true);
      setFetchError(null);
      try {
        const response = await axiosLayer.get(file.url, { responseType: 'blob' });
        if (isMounted) {
          const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
          objectUrl = URL.createObjectURL(blob);
          setPdfData(objectUrl);
        }
      } catch (err) {
        console.error("Error fetching PDF:", err);
        if (isMounted) {
          setFetchError("Failed to load PDF file. It might be inaccessible or you need to login again.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingFile(false);
        }
      }
    };
    
    void fetchPdf();
    
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, file]);

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setPageNumber(1);
      setScale(1.0);
      setNumPages(undefined);
    }
  }, [file]);

  useEffect(() => {
    if (!isOpen) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Delay slightly to ensure container is fully rendered
    const timeoutId = setTimeout(updateWidth, 50);

    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateWidth);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && numPages && pageNumber < numPages) {
        setPageNumber(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, numPages, pageNumber]);

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    downloadFiles([file.path]);
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Calculate width for mobile responsiveness
  const getPageWidth = () => {
    if (containerWidth) {
      // 32px for padding (16px * 2)
      return Math.min(containerWidth - 32, 1000) * scale;
    }
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-screen h-screen bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/50 shrink-0">
        <div className="flex items-center space-x-4 overflow-hidden">
          <h2 className="text-lg font-semibold truncate" title={file.name}>
            {file.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {pdfData && (
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-muted/50 rounded-md p-1">
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setScale(s => Math.max(0.5, s - 0.25)); }}>
                 <ZoomOut className="h-4 w-4" />
               </Button>
               <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setScale(s => Math.min(3, s + 0.25)); }}>
                 <ZoomIn className="h-4 w-4" />
               </Button>
            </div>
          )}
          
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

      {/* Content - PDF Document */}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-auto bg-muted/10 flex flex-col items-center p-4 relative"
      >
        {isLoadingFile ? (
          <div className="flex flex-col items-center justify-center h-full w-full gap-4">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <span className="text-muted-foreground animate-pulse">Downloading PDF...</span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-full w-full text-destructive gap-4">
            <span>{fetchError}</span>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download Instead
            </Button>
          </div>
        ) : pdfData ? (
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full w-full">
                <span className="text-muted-foreground animate-pulse">Rendering PDF...</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full w-full text-destructive gap-4">
                <span>Failed to render PDF file.</span>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download Instead
                </Button>
              </div>
            }
            className="flex flex-col items-center max-w-full"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              width={getPageWidth()}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-xl bg-white max-w-full"
              loading={
                <div className="flex items-center justify-center w-full min-h-[50vh] bg-white shadow-xl">
                   <span className="text-muted-foreground animate-pulse">Loading page...</span>
                </div>
              }
            />
          </Document>
        ) : null}
      </div>

      {/* Footer / Pagination */}
      {pdfData && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t bg-background/50 shrink-0 gap-2">
          {/* Mobile Zoom Controls */}
          <div className="flex sm:hidden items-center gap-1 bg-muted/50 rounded-md p-1">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setScale(s => Math.max(0.5, s - 0.25)); }}>
               <ZoomOut className="h-4 w-4" />
             </Button>
             <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setScale(s => Math.min(3, s + 0.25)); }}>
               <ZoomIn className="h-4 w-4" />
             </Button>
          </div>

          {/* Pagination */}
          {numPages ? (
            <div className="flex items-center justify-center gap-4 mx-auto">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { setPageNumber(p => Math.max(1, p - 1)); }}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium whitespace-nowrap">
                Page {pageNumber} of {numPages}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { setPageNumber(p => Math.min(numPages, p + 1)); }}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : <div className="mx-auto" />}

          {/* Mobile Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex sm:hidden items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      )}
    </div>
  );
}
