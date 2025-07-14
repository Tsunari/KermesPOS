"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Simple password for demonstration
  const ADMIN_PASSWORD = "admin123";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      // Store auth in sessionStorage
      sessionStorage.setItem("isAdmin", "true");
      router.push("/dashboard");
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Image src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8 w-full max-w-xs">
        <label htmlFor="password" className="font-semibold">Admin Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        {error && <span className="text-red-500 text-sm">{error}</span>}
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-bold">Login</button>
      </form>
    </div>
  );
}
