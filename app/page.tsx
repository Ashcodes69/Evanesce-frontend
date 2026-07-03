"use client";
import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "./src/services/api";

interface UserPublic {
  username: string;
  id: number;
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResult, setUserResult] = useState<UserPublic | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/auth/login");
    }
    const fetchMe = async () => {
      try {
        const res = await api.get("/me");
        setUsername(res.data.username);
      }catch (err){
        router.push("/auth/login");
      }
    };
    fetchMe();
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("please enter a username");
      return;
    }
    setError("");
    setUserResult(null);
    setLoading(true);
    try {
      const response = await api.get(`/users/search/${searchQuery}`);
      setUserResult(response.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError(err.response.data.detail);
      } else {
        setError("something went wrong while searching.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className=" min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-2xl border border-white/20 rounded-3xl px-16 py-20 flex flex-col items-center gap-8">
          {/* Greeting */}
          <h1 className="text-white text-6xl font-normal tracking-wide" style={{ fontFamily: 'var(--font-caveat)' }}>
            hello <span className="font-semibold">{username || "..."}</span>
          </h1>

          {/* Subtext */}
          <p className="text-white/70 text-3xl">
            who you want to talk to today
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 w-full justify-center mt-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search by exact username"
              className=" bg-transparent border border-white/40 rounded-xl px-5 py-2 text-white text-xl placeholder-white/40 focus:outline-none focus:border-white/70 w-72 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className=" bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white text-xl px-7 py-2 rounded-xl transition"
            >
              {loading ? "searching…" : "search"}
            </button>
          </form>

          {/* Error */}
          {error && <p className="text-red-400 text-xl">{error}</p>}

          {/* Result */}
          {userResult && (
            <div className="flex flex-col items-center gap-4 mt-2">
              <p className="text-white/60 text-2xl">
                found{" "}
                <span className="text-white font-semibold">
                  @{userResult.username}
                </span>
              </p>
              <Link
                href={`/messages/${userResult.id}`}
                className=" bg-green-700 hover:bg-green-600 text-white text-xl px-8 py-2 rounded-xl transition"
              >
                message {userResult.username}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
