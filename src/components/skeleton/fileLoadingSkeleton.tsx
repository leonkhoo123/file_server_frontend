import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const FileListTableSkeleton: React.FC = () => {
  // Create an array to easily map and render multiple rows

  return (
    <div className="max-h-[calc(100vh-200px)] scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-black/30 dark:scrollbar-thumb-white/30 scrollbar-track-white/0 overflow-y-scroll">
      {[...Array(10)].map((_, i) => (
        <React.Fragment key={i}>
          <div className="grid grid-cols-12 items-center px-2 py-3 rounded-md mb-1">
            {/* NAME */}
            <div className="col-span-12 lg:col-span-6 flex items-center space-x-3 min-w-0">
              <Skeleton className="h-5 w-5 rounded-sm" />
              <div className="flex flex-col space-y-2 min-w-0 w-full">
                <Skeleton className="h-4 w-3/4" />
                <div className="lg:hidden">
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>

            {/* SIZE (desktop only) */}
            <div className="hidden lg:flex lg:col-span-3 justify-end">
              <Skeleton className="h-4 w-1/4" />
            </div>

            {/* LAST MODIFIED (desktop only) */}
            <div className="hidden lg:flex lg:col-span-3 justify-end">
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <div className="w-full border-b" />
        </React.Fragment>
      ))}
    </div>
  );
};

export default FileListTableSkeleton;