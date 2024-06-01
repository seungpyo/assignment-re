import { useState } from "react";
import { ApiClient } from "./apiClient";
import { errorOf, Protocol } from "@seungpyo.hong/netpro-hw";

export interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSignUpSuccess: () => void;
}

const LoginScreen = ({ onLoginSuccess, onSignUpSuccess }: LoginScreenProps) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div>
      <h1>Login</h1>
      <h2> ID </h2>
      <input
        type="text"
        placeholder="ID"
        onChange={(e) => setId(e.target.value)}
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
          const token = await ApiClient.login({ id, password });
          if (errorOf(token)) {
            alert(errorOf(token)?.message);
            return;
          }
          ApiClient.setToken((token as Protocol.LoginResponse).token);
          onLoginSuccess();
        }}
      >
        Login
      </button>
      <button
        onClick={async () => {
          const response = await ApiClient.signUp({
            name: id,
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
