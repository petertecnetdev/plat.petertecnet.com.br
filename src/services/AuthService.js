import axios from "axios";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "auth";

const remoteLogout = async (token) => {
  if (!token) return true;
  try {
    await axios.post(`${apiBaseUrl}/${apiServiceUrl}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    if (error?.response?.status !== 401) console.warn("[Plat] Falha ao encerrar sessão remota:", error);
  }
  return true;
};

const authService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),
  logoutWithToken: remoteLogout,

  login: async (email, password) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/login`, { email, password });
      if (response.status === 200) {
        const { token, user } = response.data;
        authService.setToken(token.original.access_token);
        window.location.replace("/dashboard");
        return { success: true, user };
      }
      throw new Error("Credenciais inválidas");
    } catch (error) {
      if (error.response?.data?.error) throw new Error(error.response.data.error);
      if (error.response?.data?.errors) throw error.response.data.errors;
      throw new Error("Erro durante o login. Por favor, tente novamente.");
    }
  },

  register: async (userObject) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/register`, userObject);
      if (response.data.message === "Registro bem-sucedido") {
        await authService.login(userObject.email, userObject.password);
        return true;
      }
    } catch (error) {
      if (error.response?.data?.errors) throw error.response.data.errors;
      throw new Error("Erro durante o registro. Por favor, tente novamente.");
    }
  },

  logout: async () => remoteLogout(authService.getToken()),

  emailVerify: async (verificationCode) => {
    const headers = { Authorization: `Bearer ${authService.getToken()}` };
    const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/email-verify`, { verification_code: verificationCode }, { headers });
    if (response.status === 200) { window.location.replace("/dashboard"); return true; }
    return false;
  },

  changePassword: async (current_password, new_password, confirm_password) => {
    const token = authService.getToken();
    if (!token) throw new Error("Usuário não autenticado.");
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/change-password`, { current_password, new_password, confirm_password }, { headers: { Authorization: `Bearer ${token}` } });
      return response.status === 200;
    } catch (error) { console.error(error); throw new Error("Erro ao alterar a senha. Por favor, tente novamente."); }
  },

  me: async () => {
    const token = authService.getToken();
    if (!token) throw new Error("Usuário não autenticado.");
    try {
      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/me`, { headers: { Authorization: `Bearer ${token}` } });
      return response.data;
    } catch (error) { console.error("Erro ao obter os dados do usuário:", error); throw new Error("Erro ao obter os dados do usuário."); }
  },

  passwordEmail: async (email) => {
    try { return (await axios.post(`${apiBaseUrl}/${apiServiceUrl}/password-email`, { email })).data; }
    catch (error) { if (!error.response) throw new Error("Houve uma falha na comunicação com o servidor. Por favor, tente novamente."); return error.response.data; }
  },

  passwordReset: async (email, resetCode, newPassword) => {
    try { return await axios.post(`${apiBaseUrl}/${apiServiceUrl}/password-reset`, { email, reset_password_code: resetCode, password: newPassword }); }
    catch (error) { if (error.response) throw new Error(`${error.response.data.message || "Erro durante a redefinição de senha."} (Status: ${error.response.status})`); throw new Error("Erro durante a redefinição de senha. Por favor, tente novamente."); }
  },

  resendCodeEmailVerification: async () => {
    const token = authService.getToken();
    if (!token) throw new Error("Usuário não autenticado.");
    try { return (await axios.post(`${apiBaseUrl}/${apiServiceUrl}/resend-code-email-verification`, {}, { headers: { Authorization: `Bearer ${token}` } })).status === 200; }
    catch (error) { console.error(error); throw new Error("Erro ao reenviar o código de verificação. Por favor, tente novamente."); }
  },
};

export default authService;
