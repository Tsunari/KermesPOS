"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseInit";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("isAdmin", "true");
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-blue-100 via-green-100 to-teal-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden">
      <div className="animate-bounce-slow mb-8">
        <Image
          src="/Mintika_round_b-cropped.svg"
          alt="Mintika Logo"
          width={120}
          height={120}
          className="drop-shadow-2xl rounded-full border-4 border-white shadow-lg"
          priority
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full max-w-sm bg-white/80 dark:bg-black rounded-2xl shadow-xl p-8 backdrop-blur-md"
        aria-busy={loading}
      >
        <h1 className="text-2xl font-extrabold text-center text-black dark:text-white mb-2 tracking-tight">
          Admin Girişi
        </h1>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-black dark:border-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white placeholder-black dark:placeholder-white"
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-black dark:border-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white placeholder-black dark:placeholder-white"
          required
        />
        {error && <span className="text-red-500 text-sm text-center" role="alert">{error}</span>}
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 via-green-400 to-teal-400 dark:from-blue-900 dark:via-green-800 dark:to-teal-800 text-white rounded-lg px-4 py-2 font-bold shadow-md transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 border-none hover:scale-105 hover:shadow-xl hover:from-teal-400 hover:to-blue-500 dark:hover:from-teal-800 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        >
          {loading && (
            <span className="inline-block w-5 h-5 border-2 border-t-2 border-t-white border-white dark:border-black dark:border-t-white rounded-full animate-spin"></span>
          )}
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
      <style jsx global>{`
        html, body, #__next {
          height: 100%;
          overflow: hidden !important;
        }
        .animate-bounce-slow {
          animation: bounce 2.5s infinite cubic-bezier(0.28, 0.84, 0.42, 1);
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-24px); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
