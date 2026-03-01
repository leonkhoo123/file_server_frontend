import { ArrowLeft, CheckSquare, Scissors, Copy, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSelectionToolbarProps {
  selectedItemsSize: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onCut: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

export default function MobileSelectionToolbar({
  selectedItemsSize,
  onCancel,
  onSelectAll,
  onCut,
  onCopy,
  onDelete,
  onProperties,
}: MobileSelectionToolbarProps) {
  if (selectedItemsSize === 0) return null;

  return (
    <div className="md:hidden h-16 flex items-center justify-between px-4 border-b bg-background shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-12 px-3" title="Cancel Selection">
          <ArrowLeft className="h-6 w-6 mr-2" />
          <span className="font-semibold text-xl">{selectedItemsSize} item(s)</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-12 w-12 p-0" title="Select All">
          <CheckSquare className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCut} className="h-12 w-12 p-0" title="Cut">
          <Scissors className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-12 w-12 p-0" title="Copy">
          <Copy className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onProperties} className="h-12 w-12 p-0" title="Info">
          <Info className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-12 w-12 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
          <Trash2 className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
