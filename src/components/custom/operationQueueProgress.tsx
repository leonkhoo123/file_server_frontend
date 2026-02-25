import { useState } from 'react';
import { useOperationProgress } from '../../context/OperationProgressContext';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, Files, Trash2, Edit, Move, Copy } from 'lucide-react';

export function OperationQueueProgress() {
    const { operations, clearCompleted, dismissOperation } = useOperationProgress();
    const [isMinimized, setIsMinimized] = useState(false);

    const opsList = Object.values(operations);
    if (opsList.length === 0) {
        return null;
    }

    const activeOps = opsList.filter(op => op.opStatus === 'in-progress' || op.opStatus === 'starting' || op.opStatus === 'queued');
    const hasActiveOps = activeOps.length > 0;

    const title = hasActiveOps 
        ? `${activeOps.length} operation${activeOps.length > 1 ? 's' : ''} in progress` 
        : `All operations completed`;

    const getIconForType = (type: string) => {
        switch (type) {
            case 'copy': return <Copy className="w-4 h-4" />;
            case 'move': return <Move className="w-4 h-4" />;
            case 'delete': return <Trash2 className="w-4 h-4" />;
            case 'rename': return <Edit className="w-4 h-4" />;
            default: return <Files className="w-4 h-4" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'in-progress':
            case 'starting':
            case 'queued': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return null;
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 shadow-lg bg-background rounded-lg border flex flex-col overflow-hidden transition-all duration-300">
            <div 
                className="bg-muted p-3 flex justify-between items-center cursor-pointer"
                onClick={() => { setIsMinimized(!isMinimized); }}
            >
                <div className="flex items-center gap-2 font-medium text-sm">
                    {hasActiveOps ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <span>{title}</span>
                </div>
                <div className="flex items-center gap-1">
                    {!hasActiveOps && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full" 
                            onClick={(e) => {
                                e.stopPropagation();
                                clearCompleted();
                            }}
                            title="Clear completed"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full" 
                    >
                        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {!isMinimized && (
                <div className="max-h-80 overflow-y-auto p-2 bg-card">
                    <div className="flex flex-col gap-2">
                        {opsList.map(op => (
                            <div key={op.opId} className="flex flex-col border rounded-md p-2 bg-background shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-muted rounded-md text-foreground">
                                            {getIconForType(op.opType)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold capitalize">{op.opType}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{op.opStatus}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(op.opStatus)}
                                        {(op.opStatus === 'completed' || op.opStatus === 'error') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                                onClick={(e) => { e.stopPropagation(); dismissOperation(op.opId); }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {op.opStatus === 'in-progress' && (
                                    <div className="flex flex-col gap-1">
                                        {op.opPercentage !== undefined && op.opPercentage !== null && (
                                            <Progress value={op.opPercentage} className="h-1.5" />
                                        )}
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                            <span>{op.opFileCount ? `Files: ${op.opFileCount}` : ''}</span>
                                            <div className="flex gap-2">
                                                <span>{op.opSpeed ?? ''}</span>
                                                <span>{op.opPercentage !== undefined && op.opPercentage !== null ? `${Math.round(op.opPercentage)}%` : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {op.error && (
                                    <div className="text-xs text-red-500 mt-1 bg-red-50 p-1.5 rounded border border-red-100">
                                        {op.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
