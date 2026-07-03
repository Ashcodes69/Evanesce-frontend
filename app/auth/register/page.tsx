"use client";
import { api } from "@/app/src/services/api";
import Link from "next/link";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoding] = useState(false);
  const [userName, setUserName] = useState("");
  const [phNum, setPhNum] = useState("");
  const [password, setPassword] = useState("");
  const [conformedPassword, setConformedPassword] = useState("");

  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "userName") {
      setUserName(value);
    }
    if (name === "phNum") {
      setPhNum(value);
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

    try {
      setLoding(true);

      const responce = await api.post("register", {
        username: userName,
        phone_number: phNum,
        password: password,
      });

      console.log(responce.data);

      const token = responce.data.access_token;
      localStorage.setItem("token", token);

      alert("registration successfull");

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
      alert("registration failed");
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
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="phNum"
                  className="block text-sm font-medium text-white/70"
                >
                  Phone Number
                </label>
                <input
                  id="phNum"
                  name="phNum"
                  type="text"
                  required
                  value={phNum}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/30 shadow-sm focus:border-white/70 focus:outline-none sm:text-sm"
                  placeholder="0000000000"
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
                className="flex w-full justify-center rounded-md border border-transparent bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sign up
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
