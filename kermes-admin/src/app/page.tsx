"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseInit";

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
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      
      // Check if this account is bound as a POS register (role check)
      const q = query(collection(db, "pos_accounts"), where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // POS Cashier account detected, deny access and sign out
        await auth.signOut();
        setError("Yetkisiz erişim. Satış noktası hesapları yönetim paneline giriş yapamaz.");
        setLoading(false);
        return;
      }

      // Check if this user is in admin_accounts
      const adminDocRef = doc(db, "admin_accounts", user.uid);
      const adminSnap = await getDoc(adminDocRef);

      if (!adminSnap.exists()) {
        // Self-bootstrapping check: If admin_accounts is empty, bootstrap the first non-cashier user as super_admin
        const allAdminsSnap = await getDocs(collection(db, "admin_accounts"));
        if (allAdminsSnap.empty) {
          const superAdminData = {
            uid: user.uid,
            email: user.email?.toLowerCase() || email.toLowerCase(),
            role: "super_admin",
            tenantId: null,
            status: "active",
            createdAt: new Date().toISOString()
          };
          await setDoc(adminDocRef, superAdminData);
          
          sessionStorage.setItem("isAdmin", "true");
          sessionStorage.setItem("adminRole", "super_admin");
          sessionStorage.setItem("adminTenantId", "");
        } else {
          // Admin accounts exist, but this specific user is not registered in admin_accounts. Deny access.
          await auth.signOut();
          setError("Yönetici yetkiniz bulunmamaktadır. Lütfen sistem yöneticisiyle iletişime geçin.");
          setLoading(false);
          return;
        }
      } else {
        const adminData = adminSnap.data();
        if (adminData?.status === "suspended") {
          await auth.signOut();
          setError("Hesabınız askıya alınmıştır. Lütfen sistem yöneticisiyle iletişime geçin.");
          setLoading(false);
          return;
        }

        sessionStorage.setItem("isAdmin", "true");
        sessionStorage.setItem("adminRole", adminData?.role || "tenant_admin");
        sessionStorage.setItem("adminTenantId", adminData?.tenantId || "");
      }

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
