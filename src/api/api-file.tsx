import axiosLayer from './axiosLayer';   // axios instance WITHOUT token

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

export const deleteTempRotate = async (path: string = "/") => {
  const cleanPath = path.trim() === "" ? "/" : path;

  const rs = await axiosLayer.delete("/files/delete-rotate-temp", {
    params: { path: cleanPath },
    headers: { "Accept": "application/json" },
  });

  return rs.data;
}



