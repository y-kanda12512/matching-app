"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      try {
        const [usersSnapshot, likesSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(
            query(
              collection(db, "likes"),
              where("fromUserId", "==", user.uid)
            )
          ),
        ]);

        const likedIds = new Set<string>();
        likesSnapshot.forEach((doc) => {
          likedIds.add(doc.data().toUserId);
        });
        setLikedUserIds(likedIds);

        const userList: UserProfile[] = [];
        usersSnapshot.forEach((doc) => {
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
        console.error("データ取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, router]);

  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);

  const handleLike = async (toUserId: string) => {
    if (!user || likedUserIds.has(toUserId)) return;

    try {
      await addDoc(collection(db, "likes"), {
        fromUserId: user.uid,
        toUserId,
        createdAt: serverTimestamp(),
      });
      setLikedUserIds((prev) => new Set(prev).add(toUserId));

      // 相互いいねチェック
      const reverseQuery = query(
        collection(db, "likes"),
        where("fromUserId", "==", toUserId),
        where("toUserId", "==", user.uid)
      );
      const reverseSnapshot = await getDocs(reverseQuery);

      if (!reverseSnapshot.empty) {
        const [uid1, uid2] =
          user.uid < toUserId
            ? [user.uid, toUserId]
            : [toUserId, user.uid];

        // 既存マッチ確認
        const matchQuery = query(
          collection(db, "matches"),
          where("user1Id", "==", uid1),
          where("user2Id", "==", uid2)
        );
        const matchSnapshot = await getDocs(matchQuery);

        if (matchSnapshot.empty) {
          await addDoc(collection(db, "matches"), {
            user1Id: uid1,
            user2Id: uid2,
            userIds: [uid1, uid2],
            createdAt: serverTimestamp(),
          });
          setMatchedUserId(toUserId);
        }
      }
    } catch (err) {
      console.error("いいねエラー:", err);
    }
  };

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

  const matchedUser = matchedUserId
    ? users.find((u) => u.uid === matchedUserId)
    : null;

  return (
    <div className="space-y-4">
      {matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <p className="mb-2 text-4xl">🎉</p>
            <h2 className="mb-2 text-xl font-bold text-pink-500">
              マッチング成立！
            </h2>
            <p className="mb-4 text-gray-600">
              {matchedUser.nickname}さんとマッチしました！
            </p>
            <button
              onClick={() => setMatchedUserId(null)}
              className="w-full rounded-lg bg-pink-500 py-2 font-medium text-white hover:bg-pink-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
      <h1 className="text-xl font-bold">ユーザー一覧</h1>
      <div className="space-y-3">
        {users.map((u) => {
          const genderLabel =
            { male: "男性", female: "女性", other: "その他" }[u.gender] ||
            u.gender;
          const isLiked = likedUserIds.has(u.uid);
          return (
            <div
              key={u.uid}
              className="rounded-lg border border-gray-200 p-4"
            >
              <Link
                href={`/profile/${u.uid}`}
                className="flex items-center gap-4"
              >
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
              </Link>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleLike(u.uid)}
                  disabled={isLiked}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isLiked
                      ? "bg-gray-100 text-gray-400"
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                >
                  {isLiked ? "いいね済み" : "💗 いいね"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
