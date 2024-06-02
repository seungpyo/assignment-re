import { Protocol } from "@seungpyo.hong/netpro-hw";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
    const newWs = new WebSocket(`ws://localhost:5000/ws?wsTokenId=${wsToken}`);
    setWs(newWs);
  }, [wsToken]);
  useEffect(() => {
    if (!ws) {
      return;
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as Protocol.WSMessage;
      console.log("WebSocketProvider: received message", message);
      console.log(
        "Callback for message type",
        message.type,
        callbacks[message.type]
      );
      callbacks[message.type]?.(message);
    };
  }, [ws, callbacks]);
  const registerWSCallback = useCallback(
    (type: string, callback: (message: Protocol.WSMessage) => void) => {
      console.log("WebSocketProvider: registerWSCallback", type);
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
