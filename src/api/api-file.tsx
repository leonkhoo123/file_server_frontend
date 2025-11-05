import axiosPublic from './axiosPublic';   // axios instance WITHOUT token

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

// Get user data (depreciated)
// export const fetchVideoList = async (): Promise<Video[]> => {
//     const rs = await axiosPublic.get('/video/video-list', {
//         headers: { 'Accept': 'application/json' },
//     });
//     return rs.data.video || []
// };


export const fetchDirList = async (path: string = "/"): Promise<ItemsResponse> => {
  try {
    // Clean up path formatting (avoid duplicate slashes)
    const cleanPath = path.trim() === "" ? "/" : path;

    const rs = await axiosPublic.get("/files/file-list", {
      params: { path: cleanPath },
      headers: { "Accept": "application/json" },
    });

    return rs.data;
  } catch (error) {
    console.error("Failed to fetch file list:", error);
    throw error;
  }
};

export const postDisqualified = async (filePath: string) => {
  const rs = await axiosPublic.post(
    "/files/disqualified",
    { path: filePath }, // request body
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  return rs.data;
};

export const renameFileMoveToDone = async (filePath: string, name: string) => {

  const rs = await axiosPublic.post(
    "/files/rename-done",
    {
      path: filePath,
      newName: name
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return rs.data;
};

