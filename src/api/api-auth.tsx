import axiosLayer from "./axiosLayer";
import fpPromise from '@fingerprintjs/fingerprintjs';

// Initialize the agent at application startup.
const getFingerprint = async (): Promise<string> => {
  const fp = await fpPromise.load();
  const result = await fp.get();
  return result.visitorId;
};

export interface LoginResponse {
  message: string;
  mfa_required?: boolean;
  mfa_setup_required?: boolean;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const device_id = await getFingerprint();
    const res = await axiosLayer.post<LoginResponse>(
      "/login",
      { username, password, device_id },
      { 
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
};

export const verifyMfa = async (code: string): Promise<LoginResponse> => {
    const device_id = await getFingerprint();
    const res = await axiosLayer.post<LoginResponse>(
      "/mfa/verify",
      { code, device_id },
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

export const checkAuthStatus = async (): Promise<{ status: string; message: string }> => {
  const res = await axiosLayer.get<{ status: string; message: string }>("/status");
  return res.data;
};

export const logout = async (): Promise<void> => {
  await axiosLayer.post("/logout", null, {
    withCredentials: true,
  });
};

export interface SessionInfo {
  family_id: string;
  device_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

export const getSessions = async (): Promise<SessionInfo[]> => {
  const res = await axiosLayer.get<SessionInfo[]>("/me/sessions");
  return res.data;
};

export const revokeSession = async (family_id: string): Promise<{ success: boolean }> => {
  const res = await axiosLayer.delete<{ success: boolean }>(`/me/sessions/${family_id}`);
  return res.data;
};