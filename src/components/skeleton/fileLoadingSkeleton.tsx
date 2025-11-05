import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define how many rows the skeleton should display
const SKELETON_ROWS = 10;

export const FileListTableSkeleton: React.FC = () => {
  // Create an array to easily map and render multiple rows
  const skeletonItems = Array.from({ length: SKELETON_ROWS });

  return (
    <div className="overflow-hidden border-none rounded-lg bg-white shadow-none">
      <Table>
        {/* === Table Body (Skeleton Rows) === */}
        <TableBody>
          {skeletonItems.map((_, index) => (
            <TableRow key={index} className="animate-pulse">
              
              {/* Name Column */}
              <TableCell className="py-3 w-[600px]">
                <div className="flex items-center space-x-3">
                  {/* Icon Placeholder */}
                  <Skeleton className="h-5 w-5 rounded-sm" /> 
                  {/* File Name Placeholder */}
                  <Skeleton className="h-4" style={{ width: `${Math.floor(Math.random() * 50) + 40}%` }} />
                </div>
              </TableCell>
              
              {/* Size Column */}
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 float-right" />
              </TableCell>
              
              {/* Last Modified Column */}
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 float-right" />
              </TableCell>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FileListTableSkeleton;