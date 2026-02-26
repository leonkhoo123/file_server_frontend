import { ArrowLeft, CheckSquare, Scissors, Copy, Clipboard, Pencil, Trash2, Plus, BrushCleaning, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HomeToolbarProps {
  currentPath: string;
  selectedItemsSize: number;
  clipboardItemsCount: number;
  clipboardOperation: 'cut' | 'copy' | null;
  clipboardSourceDir?: string;
  onBack: () => void;
  onSelectAll: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCleanUp: () => void;
  onRefresh: () => void;
}

export default function HomeToolbar({
  currentPath,
  selectedItemsSize,
  clipboardItemsCount,
  clipboardOperation,
  clipboardSourceDir,
  onBack,
  onSelectAll,
  onCut,
  onCopy,
  onPaste,
  onRename,
  onDelete,
  onCleanUp,
  onRefresh,
}: HomeToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 px-4 border-b bg-muted/5 shrink-0 overflow-x-auto">
      <Button variant="ghost" size="sm" onClick={onBack} disabled={currentPath === "/"} className="h-8 px-2" title="Back">
        <ArrowLeft className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">Back</span>
      </Button>

      <div className="h-4 w-[1px] bg-border mx-1" />

      <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-8 w-8 p-0" title="Select All">
        <CheckSquare className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onCut} disabled={selectedItemsSize === 0} className="h-8 w-8 p-0" title="Cut">
        <Scissors className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onCopy} disabled={selectedItemsSize === 0} className="h-8 w-8 p-0" title="Copy">
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onPaste} disabled={clipboardItemsCount === 0 || (clipboardOperation === 'cut' && clipboardSourceDir === currentPath)} className="h-8 w-8 p-0" title="Paste">
        <Clipboard className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRename} disabled={selectedItemsSize !== 1} className="h-8 w-8 p-0" title="Rename">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} disabled={selectedItemsSize === 0} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="h-4 w-[1px] bg-border mx-1" />

      <Button variant="ghost" size="sm" onClick={() => toast.info("Add/Upload functionality - to be implemented")} className="h-8 px-2" title="Add/Upload">
        <Plus className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">New</span>
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="sm" onClick={onCleanUp} className="h-8 w-8 p-0 text-muted-foreground" title="Clean Up">
        <BrushCleaning className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0 text-muted-foreground" title="Refresh">
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
