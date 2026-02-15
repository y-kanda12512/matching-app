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
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type Talk = {
  matchId: string;
  partnerNickname: string;
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadCount: number;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchTalks = async () => {
      try {
        const matchesQuery = query(
          collection(db, "matches"),
          where("userIds", "array-contains", user.uid)
        );
        const matchesSnapshot = await getDocs(matchesQuery);

        const talkList: Talk[] = await Promise.all(
          matchesSnapshot.docs.map(async (matchDoc) => {
            const matchData = matchDoc.data();
            const partnerId =
              matchData.user1Id === user.uid
                ? matchData.user2Id
                : matchData.user1Id;

            // パートナー情報取得
            const partnerSnap = await getDoc(doc(db, "users", partnerId));
            const partnerNickname = partnerSnap.exists()
              ? partnerSnap.data().nickname
              : "不明なユーザー";

            // 最新メッセージ取得
            const messagesQuery = query(
              collection(db, "matches", matchDoc.id, "messages"),
              orderBy("createdAt", "desc"),
              limit(1)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const lastMsg = messagesSnapshot.docs[0]?.data();

            // 未読数取得
            const unreadQuery = query(
              collection(db, "matches", matchDoc.id, "messages"),
              where("senderId", "==", partnerId),
              where("isRead", "==", false)
            );
            const unreadSnapshot = await getDocs(unreadQuery);

            return {
              matchId: matchDoc.id,
              partnerNickname,
              lastMessage: lastMsg?.content || "",
              lastMessageAt: lastMsg?.createdAt?.toDate() || null,
              unreadCount: unreadSnapshot.size,
            };
          })
        );

        talkList.sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0;
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
        });

        setTalks(talkList);
      } catch (err) {
        console.error("トーク一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalks();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  if (talks.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <p className="text-4xl">💬</p>
        <p className="text-gray-500">まだトークがありません</p>
        <p className="text-sm text-gray-400">
          マッチした相手とメッセージを始めましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">メッセージ</h1>
      <div className="space-y-2">
        {talks.map((talk) => (
          <Link
            key={talk.matchId}
            href={`/messages/${talk.matchId}`}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-400">
              👤
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold">{talk.partnerNickname}</p>
              <p className="truncate text-sm text-gray-500">
                {talk.lastMessage || "メッセージはまだありません"}
              </p>
            </div>
            {talk.unreadCount > 0 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white">
                {talk.unreadCount}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
