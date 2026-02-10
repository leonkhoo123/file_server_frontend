import axiosLayer from './axiosLayer';   // axios instance WITHOUT token
import { generateOpId } from "../utils/id";

export interface ItemsResponse {
  items: FileInterface[];
  path: string;
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


export const fetchDirList = async (path: string = "/"): Promise<ItemsResponse> => {
  // Clean up path formatting (avoid duplicate slashes)
  const cleanPath = path.trim() === "" ? "/" : path;

  const rs = await axiosLayer.get("/files/file-list", {
    params: { path: cleanPath },
    headers: { "Accept": "application/json" },
  });

  return rs.data;
};

export const deleteTempRotate = async (path: string = "/", opId: string = generateOpId()) => {
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



