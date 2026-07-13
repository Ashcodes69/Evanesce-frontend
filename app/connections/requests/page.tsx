"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../src/services/api";

interface IncomingRequest {
  connection_id: number;
  user_id: number;
  username: string;
  full_name: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/auth/login");
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await api.get("/connections/requests/incoming");
        setRequests(res.data);
      } catch (err) {
        setError("failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (connectionId: number, userId: number) => {
    setActionLoadingId(connectionId);
    try {
      await api.post(`/connections/${connectionId}/accept`);

      window.dispatchEvent(new Event("connection-accepted-local"))

      router.push(`/messages/${userId}`)
      
      setRequests((prev) =>
        prev.filter((r) => r.connection_id !== connectionId),
      );
    } catch (err) {
      setError("failed to accept request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (connectionId: number) => {
    setActionLoadingId(connectionId);
    try {
      await api.post(`/connections/${connectionId}/reject`);
      setRequests((prev) =>
        prev.filter((r) => r.connection_id !== connectionId),
      );
    } catch (err) {
      setError("failed to reject request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50">
        loading requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <h1
          className="text-white text-5xl mb-8 text-center"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          message requests
        </h1>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        {requests.length === 0 ? (
          <p className="text-white/40 text-center mt-10">no pending requests</p>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map((req) => (
              <div
                key={req.connection_id}
                className="flex items-center justify-between border border-white/20 rounded-xl p-4"
              >
                <div>
                  <p className="text-white text-lg font-semibold">
                    {req.full_name}
                  </p>
                  <p className="text-white/50 text-sm">@{req.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.connection_id, req.user_id)}
                    disabled={actionLoadingId === req.connection_id}
                    className="bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white px-4 py-2 rounded-lg transition"
                  >
                    accept
                  </button>
                  <button
                    onClick={() => handleReject(req.connection_id)}
                    disabled={actionLoadingId === req.connection_id}
                    className="bg-red-800 hover:bg-red-700 disabled:bg-red-950 text-white px-4 py-2 rounded-lg transition"
                  >
                    reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
