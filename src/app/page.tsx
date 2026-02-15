"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold text-pink-500">
        MatchApp
      </h1>
      <p className="text-gray-600">
        マッチングアプリへようこそ
      </p>
    </div>
  );
}
