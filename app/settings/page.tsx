"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../src/services/api";
import { useAlert } from "../Context/AlertContext";

export default function Settings() {
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const router = useRouter();
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/auth/login");
      return;
    }
    api.get("/me").then((res) => setFullName(res.data.full_name));
  }, []);

  const handleSaveFullName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    try {
      await api.put("/me/full-name", { full_name: fullName });
      showAlert("Full name updated.", true);
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Failed to update full name.", false);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!password || !newUsername.trim()) {
      showAlert("Please fill in both fields.", false);
      return;
    }

    showConfirm(
      "Changing your username will log you out. Continue?",
      async () => {
        setSavingUsername(true);
        try {
          await api.put("/me/username", { password, new_username: newUsername });
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth-changed"));
          showAlert("Username updated. Please log in again.", true);
          router.push("/auth/login");
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Failed to update username.", false);
        } finally {
          setSavingUsername(false);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-10">
        <h1
          className="text-white text-5xl text-center"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          settings
        </h1>

        {/* Full name */}
        <div className="border border-white/20 rounded-xl p-5 space-y-3">
          <h2 className="text-white text-lg font-medium">full name</h2>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white focus:border-white/70 focus:outline-none"
          />
          <button
            onClick={handleSaveFullName}
            disabled={savingName}
            className="bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white px-4 py-2 rounded-lg transition"
          >
            {savingName ? "saving..." : "save"}
          </button>
        </div>

        {/* Username */}
        <div className="border border-white/20 rounded-xl p-5 space-y-3">
          <h2 className="text-white text-lg font-medium">change username</h2>
          <input
            type="password"
            placeholder="current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
          />
          <input
            type="text"
            placeholder="new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
          />
          <button
            onClick={handleChangeUsername}
            disabled={savingUsername}
            className="bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white px-4 py-2 rounded-lg transition"
          >
            {savingUsername ? "updating..." : "update username"}
          </button>
        </div>

        {/* Password reset */}
        <div className="border border-white/20 rounded-xl p-5">
          <h2 className="text-white text-lg font-medium mb-2">password</h2>
          <p className="text-white/50 text-sm mb-3">
            You'll verify your identity with your username and email.
          </p>
          
          <a
            href="/auth/forgot-password"
            className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition"
          >
            change password
          </a>
        </div>
      </div>
    </div>
  );
}