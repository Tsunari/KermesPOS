import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import TenantClientLayout from "./TenantClientLayout";

export async function generateStaticParams() {
  try {
    const querySnapshot = await getDocs(collection(db, "kermeses"));
    const list = querySnapshot.docs.map((doc) => ({
      tenant: doc.id,
    }));
    // Ensure 'placeholder' is always present for dynamic routing fallback rewrites
    if (!list.some((item) => item.tenant === "placeholder")) {
      list.push({ tenant: "placeholder" });
    }
    return list;
  } catch (error) {
    console.warn("Failed to fetch kermeses at build time, using default placeholder path", error);
    return [{ tenant: "placeholder" }];
  }
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <TenantClientLayout>{children}</TenantClientLayout>;
}
