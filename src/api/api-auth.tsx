import axiosLayer from "./axiosLayer";

export const login = async (username: string, password: string) => {
    await axiosLayer.post(
      "/login",
      { username, password },
      { 
        headers: { "Content-Type": "application/json" },
      }
    );
};