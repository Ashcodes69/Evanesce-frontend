"use client";
import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from "react";

type Listener = (data: any) => void;

interface WebSocketContextType {
  sendJson: (data: object) => void;
  addListener: (cb: Listener) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || wsRef.current) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);
    wsRef.current = socket;

    socket.onopen = () => console.log("shared WS connected");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      listenersRef.current.forEach((cb) => cb(data));
    };

    socket.onclose = () => {
      console.log("shared WS disconnected");
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    connect();

    // re-connect after login/logout without a full page reload
    const handleAuthChange = () => {
      wsRef.current?.close();
      wsRef.current = null;
      connect();
    };
    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const sendJson = useCallback((data: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const addListener = useCallback((cb: Listener) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendJson, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}