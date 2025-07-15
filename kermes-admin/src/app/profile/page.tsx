/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KermesAppBar from "../../components/KermesAppBar";
import KermesLoading from "../../components/KermesLoading";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { auth } from "../../../firebaseInit";

export default function Profile() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      setIsAuth(true);
      setUser(auth.currentUser);
      setLoading(false);
    } else {
      router.replace("/");
    }
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("isAdmin");
    router.replace("/");
  }

  if (!isAuth) return null;
  if (loading) return <KermesLoading message="Yükleniyor..." />;

  return (
    <div className="flex min-h-screen">
      <KermesAppBar onLogout={handleLogout} />
      <div className="flex-1 p-8 flex flex-col items-center gap-8 bg-gray-50 dark:bg-neutral-900 ml-20 md:ml-20">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white flex items-center gap-2">
          <AccountCircleIcon fontSize="large" className="text-white" />
          Profil
        </h1>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 flex flex-col gap-4 w-full max-w-md items-center">
          <AccountCircleIcon fontSize="large" className="text-white mb-2" style={{ fontSize: 64 }} />
          <div className="text-lg font-semibold text-black dark:text-white">
            {user?.email || "Kullanıcı bilgisi yok"}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            UID: {user?.uid || "-"}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Son giriş: {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
