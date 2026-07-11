"use client";
import { api } from "@/app/src/services/api";
import Link from "next/link";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Context/AlertContext";

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoding] = useState(false);
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conformedPassword, setConformedPassword] = useState("");

  const router = useRouter();
  const {showAlert} = useAlert();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "userName") {
      setUserName(value);
    }
    if (name === "fullName") {
      setFullName(value);
    }
    if (name === "email") {
      setEmail(value);
    }
    if (name === "password") {
      setPassword(value);
    }
    if (name === "confirmedPassword") {
      setConformedPassword(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== conformedPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoding(true);

      const responce = await api.post("register", {
        username: userName,
        full_name: fullName,
        email: email,
        password: password,
      });

      const token = responce.data.access_token;
      localStorage.setItem("token", token);

      showAlert("Registration successfull", true)
      router.push("/");

    } catch (error: any) {
      console.log(error);
      if (error.response) {
        console.log("Validation Errors:", error.response.data);
        alert(JSON.stringify(error.response.data));
      } else {
        console.log("Network/Other Error:", error);
      }
      setLoding(false);
      showAlert("Registration failed", false)
    }
  };
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl border border-white/20 bg-black p-8">
          <div>
            <h2
              className="text-center text-3xl font-extrabold text-white"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-white/60">
              Sign up to get started
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="userName"
                  className="block text-sm font-medium text-white/70"
                >
                  UserName
                </label>
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={userName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-white/70"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white/70"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/70"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmedPassword"
                  className="block text-sm font-medium text-white/70"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmedPassword"
                  name="confirmedPassword"
                  type="password"
                  required
                  value={conformedPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Signing up..." : "Sign up"}
              </button>
            </div>

            <div>
              <div className="text-center text-sm text-white/60 mt-4">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-green-500 hover:text-green-400 hover:underline transition-colors"
                >
                  Log In
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}