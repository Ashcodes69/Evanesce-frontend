"use client";
import { api } from "@/app/src/services/api";
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAlert } from "@/app/Context/AlertContext";
import { useWebSocketContext } from "@/app/Context/WebSocketContext";
import { FaL } from "react-icons/fa6";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  status?: string;
  created_at: string;
}

export default function MessageThread() {
  const params = useParams();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [lastSeen, setLastSeen] = useState("");

  const [chatUserName, setChatUserName] = useState("Loading...");
  const [chatFullName, setChatFullName] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { showConfirm, showAlert } = useAlert();
  const { sendJson, addListener } = useWebSocketContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // close the dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const statusRes = await api.get(`/users/status/${userId}`);
        const status = statusRes.data.status;
        setUserStatus(status);
        if (status == "offline") {
          const lastSeenRes = await api.get(`/users/last-seen/${userId}`);
          setLastSeen(lastSeenRes.data.last_seen);
        }
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    };
    if (userId) fetchInitialStatus();
  }, [userId]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
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
        setChatFullName(userProfileResponse.data.full_name);

        api.put(
          `/messages/seen/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err: any) {
        console.log(err);
        setError("Failed to load chat data.");
        setChatUserName("Unknown User");
        setChatFullName("");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchChatData();
  }, [userId]);

useEffect(() => {
  const unsubscribe = addListener((data) => {
    console.log("WS event received:", data);
    if (
      data.type === "connection_blocked" &&
      data.user_id.toString() === userId
    ) {
      showAlert("This user is no longer avalable to chat", false);
      router.push("/");
      return;
    }

    if (data.type === "presence" && data.user_id?.toString() === userId) {
      setUserStatus(data.status);
      if (data.status === "offline" && data.last_seen) {
        setLastSeen(data.last_seen);
      }
      return;
    }

    if (data.type === "typing" && data.from?.toString() === userId) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      return;
    }

    // only append if this message belongs to the currently open thread
    if (data.message && data.from?.toString() === userId) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id || Date.now(),
          sender_id: data.from,
          receiver_id: parseInt(userId),
          content: data.message,
          status: data.status,
          created_at: data.created_at,
        },
      ]);
      setIsTyping(false);

      // mark as seen immediately since the user is actively viewing this thread
      const token = localStorage.getItem("token");
      if (token) {
        api.put(
          `/messages/seen/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      return;
    }

    if (data.type === "message_ack") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.client_id
            ? {
                ...m,
                id: data.message_id,
                status: data.status,
                created_at: data.created_at,
              }
            : m,
        ),
      );
      return;
    }

    if (data.type === "message_hidden_sender") {
      setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
      return;
    }

    if (data.type === "message_deleted") {
      setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
      return;
    }
  });

  return unsubscribe;
}, [userId, addListener]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendJson({ receiver_id: parseInt(userId), type: "typing" });
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now();

    sendJson({
      receiver_id: parseInt(userId),
      message: newMessage,
      client_id: tempId,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: -1,
        receiver_id: parseInt(userId),
        content: newMessage,
        status: "sent",
        created_at: new Date().toISOString(),
      },
    ]);

    window.dispatchEvent(
      new CustomEvent("message-sent-local", {
        detail: { receiverId: parseInt(userId), message: newMessage },
      }),
    );

    setNewMessage("");
  };

  const handleBlockClick = () => {
    setMenuOpen(false);
    showConfirm(
      `Block ${chatFullName || chatUserName}? They won't be able to message you anymore.`,
      async () => {
        setBlocking(true);
        try {
          await api.post(`/connections/${userId}/block`);
          window.dispatchEvent(
            new CustomEvent("connection-blocked-local", {
              detail: { userId: parseInt(userId) },
            }),
          );

          router.push("/");
        } catch (err: any) {
          showAlert(
            err.response?.data?.detail || "Failed to block user.",
            false,
          );
        } finally {
          setBlocking(false);
        }
      },
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp.replace(" ", "T"));

    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp.replace(" ", "T"));
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-top justify-center bg-black text-white/50">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col rounded-xl border border-white/20 bg-black overflow-hidden h-[80vh]">
        <div className="border-b border-white/20 p-4 text-white flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{chatFullName}</h2>
            <p className="text-sm text-white/50">@{chatUserName}</p>
            <p className="text-xs text-white/50">
              {userStatus === "online" ? (
                <span className="text-green-400">● online</span>
              ) : lastSeen ? (
                `last seen ${formatLastSeen(lastSeen)}`
              ) : (
                "offline"
              )}
            </p>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="chat options"
              className="text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 6a1.75 1.75 0 110-3.5A1.75 1.75 0 0112 6zm0 7.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM12 21.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-black border border-white/20 rounded-xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={handleBlockClick}
                  disabled={blocking}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition disabled:opacity-50"
                >
                  {blocking ? "blocking..." : "block"}
                </button>
              </div>
            )}
          </div>
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
                    {msg.created_at && (
                      <p
                        className={`text-[10px] mt-1 ${isFromOtherUser ? "text-white/40" : "text-white/70"}`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    )}
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
