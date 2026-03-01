import axiosLayer from './axiosLayer';   // axios instance WITHOUT token
import { generateOpId } from "../utils/id";

export interface ItemsResponse {
  items: FileInterface[];
  path: string;
  file_count?: number;
  folder_count?: number;
  count?: number;
}

export interface FileInterface {
  modified: string;
  name: string;
  size: number;
  type: 'file' | 'dir';
  url: string;
  isVideo: boolean;
  path: string;
}


export interface HealthResponse {
  title_name?: string;
  upload_chunk_size?: number;
  [key: string]: any;
}

export const checkHealth = async (): Promise<HealthResponse | null> => {
  try {
    const rs = await axiosLayer.get<HealthResponse>("/health");
    if (rs.status === 200) {
      return rs.data;
    }
    return null;
  } catch {
    return null;
  }
};

export const fetchDirList = async (path = "/", showHidden = false): Promise<ItemsResponse> => {
  // Clean up path formatting (avoid duplicate slashes)
  const cleanPath = path.trim() === "" ? "/" : path;

  const rs = await axiosLayer.get("/files/file-list", {
    params: { path: cleanPath, showHidden },
    headers: { "Accept": "application/json" },
  });

  return rs.data as ItemsResponse;
};

export const deleteTempRotate = async (path = "/", opId: string = generateOpId()) => {
  const cleanPath = path.trim() === "" ? "/" : path;

  const rs = await axiosLayer.post("/files/delete-rotate-temp", {
    path: cleanPath,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });

  return rs.data;
}

export const copyFiles = async (sources: string[], destDir: string, opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/copy", {
    sources,
    destDir,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export const moveFiles = async (sources: string[], destDir: string, opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/move", {
    sources,
    destDir,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export const deleteFiles = async (sources: string[], opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/delete", {
    sources,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export const deletePermanentFiles = async (sources: string[], opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/delete-permanent", {
    sources,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export const renameFile = async (source: string, newName: string, opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/rename", {
    source,
    newName,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export const createFolder = async (path: string, folderName: string, opId: string = generateOpId()) => {
  const rs = await axiosLayer.post("/files/create-folder", {
    dir: path,
    folderName,
    opId
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data;
};

export interface PropertiesContains {
  files: number;
  folders: number;
}

export interface PropertiesResponse {
  type: "file" | "directory" | "multiple";
  name: string | null;
  location: string;
  totalSizeBytes: number;
  contains: PropertiesContains;
  createdAt: string | null;
  modifiedAt: string | null;
  accessedAt: string | null;
}

export const getFileProperties = async (sources: string[]): Promise<PropertiesResponse> => {
  const rs = await axiosLayer.post("/files/properties", {
    sources
  }, {
    headers: { "Accept": "application/json" },
  });
  return rs.data as PropertiesResponse;
};

import * as CRC32 from 'crc-32';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
  bytes: number;
  rate?: number;
  estimated?: number;
  upload: boolean;
}

export const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progressEvent: UploadProgressEvent) => void,
  opId?: string,
  chunkSize?: number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const CHUNK_SIZE = chunkSize && chunkSize > 0 ? chunkSize : 5 * 1024 * 1024; // Use provided size or default to 5MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1; // at least 1 chunk for empty files
  let loadedBytes = 0;
  
  // Extract subdirectory if it's a folder upload (webkitRelativePath contains the full path including filename)
  let destination = path;
  let filename = file.name;
  
  const customPath = ((file as unknown) as { customPath?: string }).customPath ?? file.webkitRelativePath;
  if (customPath) {
    const parts = customPath.split('/');
    if (parts.length > 1) {
      filename = parts.pop() ?? file.name; // last part is filename
      // Join remaining parts to form the relative path, and append to base destination
      const relativeFolder = parts.join('/');
      destination = path.endsWith('/') 
        ? `${path}${relativeFolder}` 
        : `${path}/${relativeFolder}`;
    }
  }

  const identifier = opId ?? btoa(encodeURIComponent(`${filename}-${file.size}-${file.lastModified}-${destination}`)).replace(/[/+=]/g, '_');

  let lastResponse = null;

  for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
    const start = (chunkNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);
    
    // Calculate CRC32 checksum for the chunk
    const arrayBuffer = await chunkBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const checksumNum = CRC32.buf(buffer);
    const checksum = (checksumNum >>> 0).toString(16).padStart(8, '0');

    let status = 'uploading';
    if (chunkNumber === 1 && totalChunks === 1) status = 'end';
    else if (chunkNumber === 1) status = 'start';
    else if (chunkNumber === totalChunks) status = 'end';

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("filename", filename);
    formData.append("destination", destination);
    formData.append("chunkNumber", chunkNumber.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("status", status);
    formData.append("checksum", checksum);
    formData.append("chunk", chunkBlob, filename);

    const rs = await axiosLayer.post("/files/upload-chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.loaded) {
          // Calculate overall progress across chunks
          const overallLoaded = loadedBytes + progressEvent.loaded;
          onProgress({
            loaded: overallLoaded,
            total: file.size,
            progress: file.size > 0 ? overallLoaded / file.size : 1,
            bytes: progressEvent.bytes,
            rate: progressEvent.rate,
            estimated: progressEvent.estimated,
            upload: true
          });
        }
      },
    });

    loadedBytes += chunkBlob.size;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    lastResponse = rs.data;
  }

  return lastResponse;
};

