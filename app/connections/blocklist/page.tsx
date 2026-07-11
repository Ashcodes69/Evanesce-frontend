"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Context/AlertContext";
import { api } from "@/app/src/services/api";


interface BlockedUser {
  user_id: number;
  username: string;
  full_name: string;
}

export default function Blocklist() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const router = useRouter();
  const { showConfirm, showAlert } = useAlert();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/auth/login");
      return;
    }

    const fetchBlocked = async () => {
      try {
        const res = await api.get("/connections/blocked");
        setBlockedUsers(res.data);
      } catch (err) {
        showAlert("Failed to load blocklist.", false);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocked();
  }, []);

  const handleUnblock = (user: BlockedUser) => {
    showConfirm(`Unblock ${user.full_name}? They'll need to send a new request to message you.`, async () => {
      setActionLoadingId(user.user_id);
      try {
        await api.post(`/connections/${user.user_id}/unblock`);
        setBlockedUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
        showAlert(`${user.full_name} has been unblocked.`, true);
      } catch (err: any) {
        showAlert(err.response?.data?.detail || "Failed to unblock user.", false);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50">
        loading blocklist...
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
          blocklist
        </h1>

        {blockedUsers.length === 0 ? (
          <p className="text-white/40 text-center mt-10">you haven't blocked anyone</p>
        ) : (
          <div className="flex flex-col gap-4">
            {blockedUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between border border-white/20 rounded-xl p-4"
              >
                <div>
                  <p className="text-white text-lg font-semibold">{user.full_name}</p>
                  <p className="text-white/50 text-sm">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleUnblock(user)}
                  disabled={actionLoadingId === user.user_id}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
                >
                  {actionLoadingId === user.user_id ? "unblocking..." : "unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}