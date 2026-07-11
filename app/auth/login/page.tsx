"use client";
import { api } from "@/app/src/services/api";
import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Context/AlertContext";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoding] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const {showAlert} = useAlert()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "userName") {
      setUserName(value);
    }
    if (name === "password") {
      setPassword(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoding(true);

      // 1. Package the data exactly how OAuth2PasswordRequestForm wants it
      const formData = new URLSearchParams();
      formData.append("username", userName);
      formData.append("password", password);

      // 2. Send the request with the correct headers
      const responce = await api.post("login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // 3. Save the access token so the user stays logged in!
      const token = responce.data.access_token;
      localStorage.setItem("token", token);

      showAlert("Log-in successfull", true)
      router.push("/");
    } catch (error: any) {
      console.log(error);
      // 4. Handle the specific 401 errors from your FastAPI backend
      if (error.response && error.response.status === 401) {
        setError(error.response.data.detail); // This will display "Invalid username" or "Invalid password" directly in your UI!
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoding(false);
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
              Log in
            </h2>
            <p className="mt-2 text-center text-sm text-white/60">
              Log in to get continue
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
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Log in
                </button>
              </div>

              <div className="text-center text-sm text-white/60 mt-4">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-green-500 hover:text-green-400 hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
