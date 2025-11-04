import { File, Folder, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModeToggle } from "@/components/mode-toggle";
import DefaultLayout from "@/layouts/DefaultLayout";
import { fetchVideoList, type Video } from "@/api/api-file";
// --- Main Component ---
import { useState, useEffect } from 'react';
import FileListTableSkeleton from "@/components/skeleton/fileLoadingSkeleton";

const FileListTable = ({ files }: { files: Video[] }) => (
    <Table>
        <TableHeader className="sticky top-0 backdrop-blur-sm z-10">
            <TableRow>
                <TableHead className="w-[400px]">
                    <Button variant="ghost" className="p-0 h-auto font-semibold">
                        Name <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 h-auto font-semibold">
                        Size
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 h-auto font-semibold">
                        Last Modified
                    </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {files.map((file, index) => (
                <TableRow key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer">
                    {/* <TableCell className="font-medium flex items-center space-x-3 py-3">
                            {file.type === 'folder' ? <Folder className="h-5 w-5 text-blue-500" /> : <File className="h-5 w-5 text-gray-400" />}
                            <span>{file.name}</span>
                        </TableCell> */}
                    <TableCell className="font-medium flex items-center space-x-3 py-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <span>{file.file_name}</span>
                    </TableCell>
                    <TableCell className="text-right">{file.size}</TableCell>
                    <TableCell className="text-right">{file.modified_time}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

// --- Main Component ---
export default function HomePage() {
    const [files, setFiles] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const loadFiles = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const fileList = await fetchVideoList();
                // await new Promise(resolve => setTimeout(resolve, 3000)); 
                setFiles(fileList);
            } catch (err) {
                setError(true);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadFiles();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xl text-red-600">
                Error: {error}
            </div>
        );
    }

    // --- Main Layout Render ---
    return (
        <DefaultLayout>
            <div className="flex">
                {/* Assuming Sidebar is now part of DefaultLayout or excluded for simplicity */}

                <div className="flex flex-col flex-1">
                    {/* 2. Header (Navbar) */}
                    <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6 shrink-0">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold">Cloud Drive</h1>
                        </div>
                        <ModeToggle></ModeToggle>
                    </header>

                    {/* 3. Main Content Area */}
                    <main className="flex-1 p-6 overflow-auto h-full">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">My Drive</h2>
                        {isLoading && isLoading ?
                            <FileListTableSkeleton />
                            : <>{/* 4. Pass the dynamically loaded files to the table */}
                                <div className="overflow-auto max-h-[calc(100vh-10rem)]">
                                    <FileListTable files={files} />
                                </div>
                                {/* Optional: Message if no files are found */}
                                {files.length === 0 && (
                                    <p className="text-center text-gray-500 mt-10">
                                        No files found in your drive. Click "New" to upload!
                                    </p>
                                )}</>}

                    </main>
                </div>
            </div>
        </DefaultLayout>
    );
}