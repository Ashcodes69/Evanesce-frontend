"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/src/services/api";


interface RecentChat {
  id: number;
  username: string;
}

export default function Navbar() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();

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
  }, []);

  // placeholder data — replace with a real fetch later
  const recentChats: RecentChat[] = [
    { id: 1, username: "alex" },
    { id: 2, username: "priya" },
    { id: 3, username: "sam" },
  ];

  return (
    <>
      {/* Top navbar */}
      <header className="flex items-center justify-between border-b border-white/20 px-6 py-4">
        <button
          onClick={() => setLeftOpen(true)}
          aria-label="open recent chats"
          className="text-white/80 hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <button
          onClick={() => setRightOpen(true)}
          aria-label="open settings"
          className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:border-white/70 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
          </svg>
        </button>
      </header>

      {/* Left sidebar — recent chats */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          leftOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
            <button onClick={() => setLeftOpen(false)} className="text-white/60 hover:text-white">
              ✕
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {recentChats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/messages/${chat.id}`}
                  className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                  onClick={() => setLeftOpen(false)}
                >
                  @{chat.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right sidebar — settings */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          rightOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
            <button onClick={() => setRightOpen(false)} className="text-white/60 hover:text-white">
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
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/auth/login");
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