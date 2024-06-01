import { Protocol } from "@seungpyo.hong/netpro-hw/dist/types";
let token: string | null = null;
export namespace ApiClient {
  const apiUrl = "http://localhost:5000";
  export const setToken = (newToken: string) => {
    token = newToken;
  };
  export const getToken = () => token;
  export const login = async ({
    id,
    password,
  }: Protocol.LoginRequest): Promise<
    Protocol.LoginResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, password }),
    });
    return response.json();
  };
  export const logout = async ({
    token,
  }: Protocol.LogoutRequest): Promise<
    Protocol.LogoutResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    return response.json();
  };
  export const signUp = async ({
    name,
    email,
    password,
  }: Protocol.SignUpRequest): Promise<
    Protocol.SignUpResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  };
}
