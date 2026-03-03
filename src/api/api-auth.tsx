import axiosLayer from "./axiosLayer";

export interface LoginResponse {
  message: string;
  mfa_required?: boolean;
  mfa_setup_required?: boolean;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const res = await axiosLayer.post<LoginResponse>(
      "/login",
      { username, password },
      { 
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
};

export const verifyMfa = async (code: string): Promise<LoginResponse> => {
    const res = await axiosLayer.post<LoginResponse>(
      "/mfa/verify",
      { code },
      { 
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
};

export interface MfaSetupResponse {
  secret: string;
  url: string;
}

export const setupMfa = async (): Promise<MfaSetupResponse> => {
    const res = await axiosLayer.get<MfaSetupResponse>("/mfa/setup");
    return res.data;
};

export const enableMfa = async (code: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosLayer.post<{ success: boolean; message: string }>(
      "/mfa/enable",
      { code },
      { 
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
};

export const getMe = async (): Promise<{ username: string; role: string; is_super_admin: boolean }> => {
  const res = await axiosLayer.get<{ username: string; role: string; is_super_admin: boolean }>("/me");
  return res.data;
};

export const logout = async (): Promise<void> => {
  await axiosLayer.post("/logout", null, {
    withCredentials: true,
  });
};