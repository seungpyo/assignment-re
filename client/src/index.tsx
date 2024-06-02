import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { WebSocketProvider } from "./context/wsContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </React.StrictMode>
);
