"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matchedUsers, setMatchedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchMatches = async () => {
      try {
        const matchesQuery = query(
          collection(db, "matches"),
          where("userIds", "array-contains", user.uid)
        );
        const matchesSnapshot = await getDocs(matchesQuery);

        const partnerIds = matchesSnapshot.docs.map((d) => {
          const data = d.data();
          return data.user1Id === user.uid ? data.user2Id : data.user1Id;
        });

        const profiles = await Promise.all(
          partnerIds.map(async (uid: string) => {
            const docSnap = await getDoc(doc(db, "users", uid));
            if (!docSnap.exists()) return null;
            const data = docSnap.data();
            return {
              uid,
              nickname: data.nickname,
              bio: data.bio,
              age: data.age,
              gender: data.gender,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as UserProfile;
          })
        );

        setMatchedUsers(profiles.filter((p): p is UserProfile => p !== null));
      } catch (err) {
        console.error("マッチ一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  if (matchedUsers.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <p className="text-4xl">✨</p>
        <p className="text-gray-500">まだマッチした相手がいません</p>
        <p className="text-sm text-gray-400">
          いいねを送ってマッチングしましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">マッチ一覧</h1>
      <div className="space-y-3">
        {matchedUsers.map((u) => {
          const genderLabel =
            { male: "男性", female: "女性", other: "その他" }[u.gender] ||
            u.gender;
          return (
            <Link
              key={u.uid}
              href={`/profile/${u.uid}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl">
                💗
              </div>
              <div className="flex-1">
                <p className="font-bold">{u.nickname}</p>
                <p className="text-sm text-gray-500">
                  {u.age}歳 / {genderLabel}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
