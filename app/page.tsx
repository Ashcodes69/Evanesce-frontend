"use client";
import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "./src/services/api";
import { useWebSocketContext } from "./Context/WebSocketContext";

interface UserSearchResult {
  id: number;
  username: string;
  full_name: string;
  connection_status: "none" | "pending_sent" | "pending_received" | "accepted";
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResult, setUserResult] = useState<UserSearchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/auth/login");
    }
    const fetchMe = async () => {
      try {
        const res = await api.get("/me");
        setFullName(res.data.full_name);
      } catch (err) {
        router.push("/auth/login");
      }
    };
    fetchMe();
  }, []);

  const {addListener} = useWebSocketContext()
  useEffect(()=>{
    const unsubscribe = addListener((data)=>{
      if(data.type === "connection_accepted" && userResult && data.user_id === userResult.id){
        setUserResult({...userResult, connection_status: "accepted"})
      }
    })
    return unsubscribe
  }, [addListener, userResult])

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

  const handleSendRequest = async () => {
    if (!userResult) return;
    setActionLoading(true);
    try {
      await api.post("/connections/request", { target_user_id: userResult.id });
      setUserResult({ ...userResult, connection_status: "pending_sent" });
    } catch (err: any) {
      setError(err.response?.data?.detail || "failed to send request.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderAction = () => {
    if (!userResult) return null;

    switch (userResult.connection_status) {
      case "accepted":
        return (
          <Link
            href={`/messages/${userResult.id}`}
            className="bg-green-700 hover:bg-green-600 text-white text-xl px-8 py-2 rounded-xl transition"
          >
            message {userResult.username}
          </Link>
        );

      case "pending_sent":
        return (
          <button
            disabled
            className="bg-white/10 text-white/40 text-xl px-8 py-2 rounded-xl cursor-not-allowed"
          >
            request sent — waiting
          </button>
        );

      case "pending_received":
        return (
          <p className="text-white/60 text-lg text-center">
            they already sent you a request — check your{" "}
            <Link href="/connections/requests" className="text-green-400 underline">
              incoming requests
            </Link>
          </p>
        );

      case "none":
      default:
        return (
          <button
            onClick={handleSendRequest}
            disabled={actionLoading}
            className="bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white text-xl px-8 py-2 rounded-xl transition"
          >
            {actionLoading ? "sending…" : `send request to ${userResult.username}`}
          </button>
        );
    }
  };

  return (
    <>
      <div className=" min-h-screen bg-black flex items-top justify-center p-6">
        <div className="w-full max-w-2xl border border-white/20 rounded-3xl px-16 py-20 flex flex-col items-center gap-8">
          {/* Greeting */}
          <h1
            className="text-white text-6xl font-normal tracking-wide"
            style={{ fontFamily: "var(--font-caveat)" }}
          >
            hello{" "}
            <span className="font-semibold">
              {fullName ? fullName.split(" ")[0] : "..."}
            </span>
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
              <div className="text-center">
                <p className="text-white text-2xl font-semibold">{userResult.full_name}</p>
                <p className="text-white/50 text-lg">@{userResult.username}</p>
              </div>
              {renderAction()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}