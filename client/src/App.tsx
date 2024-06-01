import { useState } from "react";
import LoginScreen from "./Login";
import ChatScreen from "./Chat";
import { Protocol, User } from "@seungpyo.hong/netpro-hw";
import { ApiClient } from "./apiClient";

function App() {
  const [me, setMe] = useState<Protocol.LoginResponse | null>(null);
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
          onLoginSuccess={(me) => {
            setMe(me);
            ApiClient.setToken(me.token);
          }}
          onSignUpSuccess={() => alert("Sign up successful")}
        />
      )}
    </>
  );
}

export default App;
