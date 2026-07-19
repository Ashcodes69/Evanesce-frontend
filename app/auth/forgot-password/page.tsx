"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/src/services/api";
import { useAlert } from "@/app/Context/AlertContext";

export default function ForgotPassword() {
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { showAlert } = useAlert();

  const handleVerify = async () => {
    if (!username.trim() || !email.trim()) {
      showAlert("Please fill in both fields.", false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-reset-identity", { username, email });
      setResetToken(res.data.reset_token);
      setStep("reset");
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Verification failed.", false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      showAlert("Passwords do not match.", false);
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { reset_token: resetToken, new_password: newPassword });
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-changed"));
      showAlert("Password updated. Please log in.", true);
      router.push("/auth/login");
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Failed to reset password.", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-white/20 bg-black p-8">
        <h2
          className="text-center text-3xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          {step === "verify" ? "verify your identity" : "set a new password"}
        </h2>

        {step === "verify" ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
            />
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full rounded-md bg-green-700 hover:bg-green-600 disabled:bg-green-900 py-2 text-white transition"
            >
              {loading ? "verifying..." : "verify"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
            />
            <input
              type="password"
              placeholder="confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 focus:border-white/70 focus:outline-none"
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full rounded-md bg-green-700 hover:bg-green-600 disabled:bg-green-900 py-2 text-white transition"
            >
              {loading ? "updating..." : "update password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}