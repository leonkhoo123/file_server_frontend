import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const FileListTableSkeleton: React.FC = () => {
  // Create an array to easily map and render multiple rows

  return (
    <div className="w-full space-y-1">
      {Array.from({ length: 15 }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center px-4 md:px-6 py-2 md:py-3 rounded-md min-h-[44px]">
            {/* NAME */}
            <div className="flex-1 flex items-center space-x-3 min-w-0 pr-2 md:pr-4">
              <Skeleton className="h-5 w-5 rounded-sm shrink-0" />
              <div className="flex flex-col space-y-2 min-w-0 w-full">
                <Skeleton className="h-4 w-3/4 max-w-[200px]" />
                <div className="lg:hidden">
                  <Skeleton className="h-3 w-1/3 max-w-[100px]" />
                </div>
              </div>
            </div>

            {/* SIZE (desktop only) */}
            <div className="w-24 md:w-32 hidden lg:flex justify-end">
              <Skeleton className="h-4 w-12" />
            </div>

            {/* LAST MODIFIED (desktop only) */}
            <div className="w-32 md:w-48 hidden lg:flex justify-end">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FileListTableSkeleton;