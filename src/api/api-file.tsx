import axiosPublic from './axiosPublic';   // axios instance WITHOUT token

export interface Video {
    file_name: string;
    path: string;
    thumbnail: string;
    url: string;
    size: number;
    modified_time: string;
}

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

