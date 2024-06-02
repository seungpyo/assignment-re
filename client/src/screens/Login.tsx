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
    <div
      style={{
        alignItems: "center",
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <div
        style={{
          alignContent: "center",
          backgroundColor: "#282828",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "30%",
          height: "50%",
          padding: 24,
          gap: 16,
        }}
      >
        <h1 style={{ textAlign: "center", color: "white" }}>NetPro-HW</h1>
        <input
          style={styles.input}
          type="text"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email (Only for Sign Up)"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          style={styles.button}
          onClick={async () => {
            await loginAs({ name, password, onLoginSuccess });
          }}
        >
          Login
        </button>
        <button
          style={styles.button}
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
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  input: {
    borderRadius: 8,
    borderWidth: 0,
    boxShadow: "none",
    height: 24,
    fontSize: 16,
    outline: "none",
    padding: 8,
  },
  button: {
    backgroundColor: "black",
    color: "white",
    borderRadius: 8,
    borderWidth: 0,
    boxShadow: "none",
    height: 24,
    fontSize: 16,
    outline: "none",
    textAlign: "center",
  },
};

export default LoginScreen;
