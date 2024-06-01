import { useState } from "react";
import LoginScreen from "./Login";

function App() {
  const [authorized, setAuthorized] = useState(false);
  return (
    <>
      {authorized ? (
        <div>
          <h1>Authorized</h1>
          <button onClick={() => setAuthorized(false)}>Logout</button>
        </div>
      ) : (
        <LoginScreen
          onLoginSuccess={() => setAuthorized(true)}
          onSignUpSuccess={() => alert("Sign up successful")}
        />
      )}
    </>
  );
}

export default App;
