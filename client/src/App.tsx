import { useState } from "react";
import LoginScreen from "./Login";
import ChatScreen from "./Chat";
import { User } from "@seungpyo.hong/netpro-hw";
import { ApiClient } from "./apiClient";

function App() {
  const [me, setMe] = useState<User | null>(null);
  return (
    <>
      {me ? (
        <ChatScreen
          me={me}
          onLogout={() => {
            setMe(null);
            ApiClient.setToken(null);
          }}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={({ user, token }) => {
            console.log("App: Login success", user, token);
            ApiClient.setToken(token);
            setMe(user);
          }}
          onSignUpSuccess={() => alert("Sign up successful")}
        />
      )}
    </>
  );
}

export default App;
