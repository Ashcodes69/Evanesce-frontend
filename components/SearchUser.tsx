"use client";
import { api } from "@/app/src/services/api";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Optional: You can define an interface that matches your FastAPI 'UserPublic' model
interface UserPublic {
  username: string;
  id: Number;
}

export default function SearchUser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResult, setUserResult] = useState<UserPublic | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    if(!localStorage.getItem("token")){
      router.push("/auth/login")
    }

    // Prevent empty searches
    if (!searchQuery.trim()) {
      setError("Please enter a username");
      return;
    }

    // Reset states before starting a new search
    setError("");
    setUserResult(null);
    setLoading(true);

    try {
      // Because it's a GET request with a path parameter, we inject the query into the URL string
      const response = await api.get(`/users/search/${searchQuery}`);

      // Save the returned user object to state
      setUserResult(response.data);
    } catch (err: any) {
      console.log(err);

      // Specifically catch the 404 error you wrote in your FastAPI code
      if (err.response && err.response.status === 404) {
        // This will display the exact "user not found" string from your backend
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong while searching.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // flex, items-center, justify-center, and min-h-screen perfectly center the box
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Find User</h2>
          <p className="mt-2 text-sm text-gray-600">Search by exact username</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter username..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error State UI */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Success State UI */}
        {userResult && (
          <div className="rounded-md bg-green-50 p-4 border border-green-100 shadow-sm transition-all">
            <h3 className="font-semibold text-green-900 border-b border-green-200 pb-2 mb-2">
              User Found!
            </h3>
            <Link
              href={`/messages/${userResult.id}`} // Make sure your backend returns the user's ID!
              className="inline-block mt-2 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              Message {userResult.username}
            </Link>

            {/* Note: You can add more `<p>` tags here to display other data from UserPublic */}
          </div>
        )}
      </div>
    </div>
  );
}
