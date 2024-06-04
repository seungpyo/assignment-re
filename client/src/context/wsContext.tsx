import { Protocol } from "@seungpyo.hong/netpro-hw";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { host } from "src/constants";

const WebSocketContext = createContext<{
  ws: WebSocket | null;
  wsConnect: ({ wsToken }: { wsToken: string }) => void;
  registerWSCallback: (
    type: Protocol.WSMessageType,
    callback: (message: Protocol.WSMessage) => void
  ) => void;
} | null>(null);

export const WebSocketProvider = ({ children }) => {
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [callbacks, setCallbacks] = useState<{
    [type in Protocol.WSMessageType]?: (message: Protocol.WSMessage) => void;
  }>({});

  useEffect(() => {
    if (!wsToken) {
      return;
    }
    let newWs: WebSocket;
    try {
      newWs = new WebSocket(`wss://${host}:443/?wsTokenId=${wsToken}`);
      newWs.onopen = () => {
        console.log("WebSocketProvider: connected");
      };
      newWs.onerror = (event) => {
        console.error("WebSocketProvider: error", event);
      };
    } catch (e) {
      console.error("WebSocketProvider: failed to connect", e);
      return;
    }
    setInterval(() => {
      console.log("WebSocketProvider: sending ping");
      newWs.send(JSON.stringify({ type: "ping" }));
    }, 3 * 1000);
    setWs(newWs);
  }, [wsToken]);

  useEffect(() => {
    if (!ws) {
      return;
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as Protocol.WSMessage;
      console.log("WebSocketProvider: received message", message);
      callbacks[message.type]?.(message);
    };
  }, [ws, callbacks]);

  const registerWSCallback = useCallback(
    (type: string, callback: (message: Protocol.WSMessage) => void) => {
      setCallbacks((prev) => ({ ...prev, [type]: callback }));
    },
    []
  );

  const wsConnect = useCallback(({ wsToken }: { wsToken: string }) => {
    setWsToken(wsToken);
  }, []);

  const value = useMemo(
    () => ({ ws, wsConnect, registerWSCallback }),
    [registerWSCallback, ws, wsConnect]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};
