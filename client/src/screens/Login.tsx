import { useState } from "react";
import { ApiClient } from "../apiClient";
import { errorOf, Protocol } from "@seungpyo.hong/netpro-hw";

export interface LoginScreenProps {
  onLoginSuccess: ({ user, token }: Protocol.LoginResponse) => void;
  onSignUpSuccess: () => void;
}

const loginAs = async ({
  name,
  password,
  onLoginSuccess,
}: {
  name: string;
  password: string;
  onLoginSuccess: ({ user, token }: Protocol.LoginResponse) => void;
}) => {
  const res = await ApiClient.login({ name, password });
  if (errorOf(res)) {
    alert(errorOf(res)?.message);
    return;
  }
  const { user, token } = res as Protocol.LoginResponse;
  onLoginSuccess({ user, token });
};

const LoginScreen = ({ onLoginSuccess, onSignUpSuccess }: LoginScreenProps) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div>
      <h1>Login</h1>
      <h2> Name </h2>
      <button
        onClick={async () => {
          await loginAs({
            name: "a",
            password: "a",
            onLoginSuccess,
          });
        }}
      >
        Login as a
      </button>
      <button
        onClick={async () => {
          await loginAs({
            name: "b",
            password: "b",
            onLoginSuccess,
          });
        }}
      >
        Login as b
      </button>
      <input
        type="text"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />
      <h2> Password </h2>
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <h2> Email (Only required on sign up)</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={async () => {
          await loginAs({ name, password, onLoginSuccess });
        }}
      >
        Login
      </button>
      <button
        onClick={async () => {
          const response = await ApiClient.signUp({
            name,
            email,
            password,
          });
          if (errorOf(response)) {
            alert(errorOf(response)?.message);
            return;
          }
          alert("Sign up successful");
        }}
      >
        Sign Up
      </button>
    </div>
  );
};

export default LoginScreen;