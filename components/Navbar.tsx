"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/app/src/services/api";
import { useAlert } from "@/app/Context/AlertContext";
import { useWebSocketContext } from "@/app/Context/WebSocketContext";

interface RecentChat {
  user_id: number;
  username: string;
  full_name: string;
  last_message: string;
  unread_msg_count: number;
}

export default function Navbar() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [requestCount, setRequestCount] = useState(0);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { showConfirm } = useAlert();
  const { addListener } = useWebSocketContext();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/me");
        setUsername(res.data.username);
      } catch (err) {
        // silently ignore here — page-level auth guard should handle redirect
      }
    };
    fetchMe();

    const fetchRequestCount = async () => {
      try {
        const res = await api.get("/connections/requests/incoming");
        setRequestCount(res.data.length);
      } catch (err) {
        // silently ignore — non-critical badge
      }
    };
    fetchRequestCount();

    const fetchRecentChats = async () => {
      try {
        const res = await api.get("/conversations");
        setRecentChats(res.data);
      } catch (err) {
        // silently ignore — non-critical for now
      }
    };
    fetchRecentChats();
  }, []);

  useEffect(() => {
    const unsubscribe = addListener((data) => {
      if (data.type === "connection_request") {
        setRequestCount((prev) => prev + 1);
      }

      if (data.type === "connection_accepted") {
        // a new connection just formed — refresh recent chats so it appears immediately
        api.get("/conversations").then((res) => setRecentChats(res.data));
      }

      if (data.type === "connection_blocked") {
        setRecentChats((prev) =>
          prev.filter((c) => c.user_id !== data.user_id),
        );
      }
      // new incoming message — bump unread count and move chat to top
      if (data.message && data.from) {
        const senderId = data.from;
        const isViewingThisChat = pathname === `/messages/${senderId}`;

        setRecentChats((prev) => {
          const exists = prev.some((c) => c.user_id === senderId);

          if (!exists) {
            // shouldn't normally happen since an accepted connection
            // already creates an entry, but fall back to a full refresh just in case
            api.get("/conversations").then((res) => setRecentChats(res.data));
            return prev;
          }

          const updated = prev.map((c) =>
            c.user_id === senderId
              ? {
                  ...c,
                  last_message: data.message,
                  unread_msg_count: isViewingThisChat
                    ? 0
                    : c.unread_msg_count + 1,
                }
              : c,
          );

          // move the updated chat to the top, like a real chat app
          const chat = updated.find((c) => c.user_id === senderId)!;
          const rest = updated.filter((c) => c.user_id !== senderId);
          return [chat, ...rest];
        });
      }
    });

    return unsubscribe;
  }, [addListener, pathname]);

  useEffect(() => {
    const match = pathname.match(/^\/messages\/(\d+)$/);
    if (!match) return;

    const openUserId = parseInt(match[1]);

    setRecentChats((prev) =>
      prev.map((c) =>
        c.user_id === openUserId ? { ...c, unread_msg_count: 0 } : c,
      ),
    );
  }, [pathname]);

  useEffect(() => {
    const handleLocalBlock = (e: Event) => {
      const { userId } = (e as CustomEvent).detail;
      setRecentChats((prev) => prev.filter((c) => c.user_id !== userId));
    };

    window.addEventListener("connection-blocked-local", handleLocalBlock);
    return () =>
      window.removeEventListener("connection-blocked-local", handleLocalBlock);
  }, []);

  useEffect(() => {
    const handleLocalAccept = (e: Event) => {
      api.get("/conversations").then((res) => setRecentChats(res.data));
    };
    window.addEventListener("connection-accepted-local", handleLocalAccept);
    return () =>
      window.removeEventListener(
        "connection-accepted-local",
        handleLocalAccept,
      );
  }, []);

  return (
    <>
      {/* Top navbar */}
      <header className="flex items-center justify-between border-b border-white/20 px-6 py-4">
        <button
          onClick={() => setLeftOpen(true)}
          aria-label="open recent chats"
          className="text-white/80 hover:text-white transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>

        <Link href="/" className="flex items-center">
          <Image
            src="/Evanesce_nav_logo_transparent_2.png"
            alt="Evanesce"
            width={140}
            height={79}
            className="object-contain h-10 w-auto"
            priority
          />
        </Link>

        <button
          onClick={() => setRightOpen(true)}
          aria-label="open settings"
          className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:border-white/70 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
            />
          </svg>
        </button>
      </header>

      {/* Left sidebar — recent chats */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          leftOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={() => setLeftOpen(false)}
          className="absolute inset-0 bg-black/60"
        />
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-black border-r border-white/20 p-5 transition-transform duration-300 ${
            leftOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-medium">recent chats</h2>
            <button
              onClick={() => setLeftOpen(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <Link
            href="/connections/requests"
            onClick={() => setLeftOpen(false)}
            className="flex items-center justify-between px-3 py-2 mb-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition border border-white/10"
          >
            <span>requests</span>
            {requestCount > 0 && (
              <span className="bg-green-700 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {requestCount}
              </span>
            )}
          </Link>

          <div className="border-t border-white/10 my-3" />

          <ul className="flex flex-col gap-1">
            {recentChats.length === 0 ? (
              <p className="text-white/30 text-sm px-3 py-2">
                no conversations yet
              </p>
            ) : (
              recentChats.map((chat) => (
                <li key={chat.user_id}>
                  <Link
                    href={`/messages/${chat.user_id}`}
                    className="flex items-top justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                    onClick={() => setLeftOpen(false)}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{chat.full_name}</span>
                      <span className="text-white/40 text-xs truncate">
                        {chat.last_message}
                      </span>
                    </div>
                    {chat.unread_msg_count > 0 && (
                      <span className="bg-green-700 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0 ml-2">
                        {chat.unread_msg_count}
                      </span>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Right sidebar — settings */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          rightOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={() => setRightOpen(false)}
          className="absolute inset-0 bg-black/60"
        />
        <div
          className={`absolute right-0 top-0 h-full w-72 bg-black border-l border-white/20 p-5 transition-transform duration-300 ${
            rightOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-medium">settings</h2>
            <button
              onClick={() => setRightOpen(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            <li>
              <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition">
                change username
              </button>
            </li>
            <li>
              <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition">
                change password
              </button>
            </li>
            <li>
              <Link
                href="/connections/blocklist"
                onClick={() => setRightOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                blocklist
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  showConfirm("Are you sure you want to log out?", () => {
                    localStorage.removeItem("token");
                    window.dispatchEvent(new Event("auth-changed"));
                    router.push("/auth/login");
                  });
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition"
              >
                log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
