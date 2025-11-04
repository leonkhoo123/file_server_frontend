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
        
        {/* === Table Header (Static) === */}
        {/* The header is usually rendered fully even during loading */}
        <TableHeader className="bg-white z-10 border-b">
          <TableRow>
            <TableHead className="w-[45%] lg:w-[400px] pl-4">Name</TableHead>
            <TableHead className="text-right w-[15%]">Size</TableHead>
            <TableHead className="text-right w-[20%]">Last Modified</TableHead>
            <TableHead className="w-[5%]"></TableHead>
          </TableRow>
        </TableHeader>

        {/* === Table Body (Skeleton Rows) === */}
        <TableBody>
          {skeletonItems.map((_, index) => (
            <TableRow key={index} className="animate-pulse">
              
              {/* Name Column */}
              <TableCell className="py-3">
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