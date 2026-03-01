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
    <div className="md:hidden h-14 flex items-center justify-between px-4 border-b bg-background shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 px-2" title="Cancel Selection">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="font-semibold text-sm">{selectedItemsSize} item(s)</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-8 w-8 p-0" title="Select All">
          <CheckSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCut} className="h-8 w-8 p-0" title="Cut">
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 w-8 p-0" title="Copy">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onProperties} className="h-8 w-8 p-0" title="Info">
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
