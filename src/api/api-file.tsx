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

export const postDisqualified = async (filePath: string) => {
  const rs = await axiosLayer.post(
    "/files/disqualified",
    { path: filePath }, // request body
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return rs.data;
};

export const renameFileMoveToDone = async (filePath: string, name: string) => {

  const rs = await axiosLayer.post(
    "/files/rename-done",
    {
      path: filePath,
      newName: name
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return rs.data;
};

