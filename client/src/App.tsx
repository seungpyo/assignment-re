import { useState } from "react";
import LoginScreen from "./screens/Login";
import ChatScreen from "./screens/Chat";
import { User } from "@seungpyo.hong/netpro-hw";
import { ApiClient } from "./apiClient";
import { useWebSocket } from "./context/wsContext";

function App() {
  const [me, setMe] = useState<User | null>(null);
  const { wsConnect } = useWebSocket();
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
            wsConnect({ wsToken: token });
            setMe(user);
          }}
          onSignUpSuccess={() => alert("Sign up successful")}
        />
      )}
    </>
  );
}

export default App;
