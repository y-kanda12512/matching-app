"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            const data = doc.data();
            userList.push({
              uid: doc.id,
              nickname: data.nickname,
              bio: data.bio,
              age: data.age,
              gender: data.gender,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            });
          }
        });
        setUsers(userList);
      } catch (err) {
        console.error("ユーザー一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  if (users.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">まだ他のユーザーがいません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ユーザー一覧</h1>
      <div className="space-y-3">
        {users.map((u) => {
          const genderLabel =
            { male: "男性", female: "女性", other: "その他" }[u.gender] || u.gender;
          return (
            <Link
              key={u.uid}
              href={`/profile/${u.uid}`}
              className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-400">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-bold">{u.nickname}</p>
                  <p className="text-sm text-gray-500">
                    {u.age}歳 / {genderLabel}
                  </p>
                  {u.bio && (
                    <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                      {u.bio}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
