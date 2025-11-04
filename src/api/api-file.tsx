import axiosPublic from './axiosPublic';   // axios instance WITHOUT token

export interface Video {
    file_name: string;
    path: string;
    thumbnail: string;
    url: string;
    size:number;
    modified_time: string;
}

// Get user data
export const fetchVideoList = async (): Promise<Video[]> => {
    const rs = await axiosPublic.get('/video/video-list', {
        headers: { 'Accept': 'application/json' },
    });
    return rs.data.video || []
};