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
import Loading from "@/features/common/components/Loading";
import { getGenderLabel } from "@/features/common/lib/gender";
import type { UserProfile } from "@/types/user";

type MatchedUser = UserProfile & { matchId: string };

export default function MatchList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
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

        const profiles = await Promise.all(
          matchesSnapshot.docs.map(async (matchDoc) => {
            const matchData = matchDoc.data();
            const partnerId =
              matchData.user1Id === user.uid
                ? matchData.user2Id
                : matchData.user1Id;

            const docSnap = await getDoc(doc(db, "users", partnerId));
            if (!docSnap.exists()) return null;
            const data = docSnap.data();
            return {
              uid: partnerId,
              matchId: matchDoc.id,
              nickname: data.nickname,
              bio: data.bio,
              age: data.age,
              gender: data.gender,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as MatchedUser;
          })
        );

        setMatchedUsers(
          profiles.filter((p): p is MatchedUser => p !== null)
        );
      } catch (err) {
        console.error("マッチ一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <Loading />;
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
        {matchedUsers.map((u) => (
          <div
            key={u.uid}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
          >
            <Link
              href={`/profile/${u.uid}`}
              className="flex flex-1 items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl">
                💗
              </div>
              <div className="flex-1">
                <p className="font-bold">{u.nickname}</p>
                <p className="text-sm text-gray-500">
                  {u.age}歳 / {getGenderLabel(u.gender)}
                </p>
              </div>
            </Link>
            <Link
              href={`/messages/${u.matchId}`}
              className="rounded-full bg-pink-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-600"
            >
              💬 トーク
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
