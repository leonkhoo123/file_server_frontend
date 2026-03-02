import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getConfigs, updateConfig } from "@/api/api-config";
import type { ConfigItem } from "@/api/api-config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface HomeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeConfigModal({ open, onOpenChange }: HomeConfigModalProps) {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [originalConfigs, setOriginalConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getConfigs();
      setConfigs(data);
      // Deep clone to keep original state
      setOriginalConfigs(JSON.parse(JSON.stringify(data)) as ConfigItem[]);
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchConfigs();
    } else {
      // Reset state when closed
      setConfigs([]);
      setOriginalConfigs([]);
    }
  }, [open]);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const updates = [];

      for (const current of configs) {
        const original = originalConfigs.find((c) => c.id === current.id);
        
        if (!original) continue;

        const hasChanged = 
          current.config_value !== original.config_value || 
          current.is_enabled !== original.is_enabled;

        if (hasChanged) {
          updates.push(
            updateConfig(current.id, {
              config_value: current.config_value,
              is_enabled: current.is_enabled,
            })
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        toast.success(`Successfully updated ${updates.length} configuration(s)`);
        await fetchConfigs(); // Refresh list to get latest state
      } else {
        toast.info("No changes to save");
      }
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : "Failed to update configurations");
    } finally {
      setSaving(false);
    }
  };

  const updateLocalConfig = (id: number, field: keyof ConfigItem, value: string | boolean | null) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const hasChanges = JSON.stringify(configs) !== JSON.stringify(originalConfigs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>System Configurations</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {loading && configs.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[100px]">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="font-medium">{config.config_name}</div>
                      <div className="text-xs text-muted-foreground whitespace-normal">
                        Type: {config.config_type} {config.config_unit ? `| Unit: ${config.config_unit}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={config.config_value ?? ""}
                        onChange={(e) => {
                          updateLocalConfig(config.id, "config_value", e.target.value);
                        }}
                        placeholder="Value"
                        disabled={saving}
                        className="focus-visible:ring-blue-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={config.is_enabled}
                        onCheckedChange={(checked) => {
                          updateLocalConfig(config.id, "is_enabled", checked);
                        }}
                        disabled={saving}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {configs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No configurations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button 
            onClick={handleSaveAll} 
            disabled={!hasChanges || saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
