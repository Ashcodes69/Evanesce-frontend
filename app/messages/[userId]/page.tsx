"use client";
import { api } from "@/app/src/services/api";
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  status?: string;
}

export default function MessageThread() {
  const params = useParams();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [chatUserName, setChatUserName] = useState("Loading...");

  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view messages.");
          setLoading(false);
          return;
        }

        const [historyResponse, userProfileResponse] = await Promise.all([
          api.get(`/messages/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/users/${userId}`),
        ]);

        setMessages(historyResponse.data);
        setChatUserName(userProfileResponse.data.username);
      } catch (err: any) {
        console.log(err);
        setError("Failed to load chat data.");
        setChatUserName("Unknown User");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchChatData();
  }, [userId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);
    ws.current = socket;

    socket.onopen = () => console.log("Connected to chat server");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "typing" && data.from.toString() === userId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        return;
      }

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message_id || Date.now(),
            sender_id: data.from,
            receiver_id: parseInt(userId),
            content: data.message,
            status: data.status,
          },
        ]);

        setIsTyping(false);
      }
    };

    socket.onclose = () => console.log("Disconnected from chat server");

    return () => {
      socket.close();
    };
  }, [userId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          receiver_id: parseInt(userId),
          type: "typing",
        }),
      );
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws.current) return;

    ws.current.send(
      JSON.stringify({
        receiver_id: parseInt(userId),
        message: newMessage,
      }),
    );

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_id: -1,
        receiver_id: parseInt(userId),
        content: newMessage,
        status: "sent",
      },
    ]);

    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col rounded-xl border border-white/20 bg-black overflow-hidden h-[80vh]">
        <div className="border-b border-white/20 p-4 text-white">
          <h2 className="text-xl font-bold">{chatUserName}</h2>
        </div>

        {error && (
          <div className="bg-red-900/30 p-3 text-sm text-red-400 text-center m-4 rounded">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !error ? (
            <p className="text-center text-white/40 mt-10">
              No messages yet. Say hi!
            </p>
          ) : (
            messages.map((msg) => {
              const isFromOtherUser = msg.sender_id.toString() === userId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromOtherUser ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isFromOtherUser
                        ? "bg-white/10 text-white rounded-tl-none"
                        : "bg-green-700 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white/60 rounded-lg rounded-tl-none p-3 text-sm italic">
                Typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 border-t border-white/20 p-4"
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-600 focus:outline-none disabled:bg-white/10 disabled:text-white/30 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 ml-1"
            >
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}