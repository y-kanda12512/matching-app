"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type Message = {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date | null;
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerNickname, setPartnerNickname] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const init = async () => {
      try {
        // マッチ情報取得
        const matchSnap = await getDoc(doc(db, "matches", matchId));
        if (!matchSnap.exists()) {
          router.push("/messages");
          return;
        }

        const matchData = matchSnap.data();
        const userIds: string[] = matchData.userIds;
        if (!userIds.includes(user.uid)) {
          router.push("/messages");
          return;
        }

        const partnerId =
          matchData.user1Id === user.uid
            ? matchData.user2Id
            : matchData.user1Id;

        const partnerSnap = await getDoc(doc(db, "users", partnerId));
        setPartnerNickname(
          partnerSnap.exists() ? partnerSnap.data().nickname : "不明なユーザー"
        );

        // 未読メッセージを既読にする
        const unreadQuery = query(
          collection(db, "matches", matchId, "messages"),
          where("senderId", "==", partnerId),
          where("isRead", "==", false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        if (!unreadSnapshot.empty) {
          const batch = writeBatch(db);
          unreadSnapshot.docs.forEach((d) => {
            batch.update(d.ref, { isRead: true });
          });
          await batch.commit();
        }
      } catch (err) {
        console.error("初期化エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    init();

    // リアルタイムリスナー
    const messagesQuery = query(
      collection(db, "matches", matchId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => ({
        id: d.id,
        senderId: d.data().senderId,
        content: d.data().content,
        isRead: d.data().isRead,
        createdAt: d.data().createdAt?.toDate() || null,
      }));
      setMessages(msgs);

      // 新着メッセージを既読にする
      if (user) {
        const unreadDocs = snapshot.docs.filter(
          (d) => d.data().senderId !== user.uid && !d.data().isRead
        );
        if (unreadDocs.length > 0) {
          const batch = writeBatch(db);
          unreadDocs.forEach((d) => {
            batch.update(d.ref, { isRead: true });
          });
          await batch.commit();
        }
      }
    });

    return () => unsubscribe();
  }, [matchId, user, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "matches", matchId, "messages"), {
        senderId: user.uid,
        content: newMessage.trim(),
        isRead: false,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("メッセージ送信エラー:", err);
    } finally {
      setSending(false);
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

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => router.push("/messages")}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 戻る
        </button>
        <p className="font-bold">{partnerNickname}</p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">
              メッセージを送ってみましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine
                        ? "bg-pink-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {msg.content}
                    </p>
                    <p
                      className={`mt-1 text-right text-xs ${
                        isMine ? "text-pink-200" : "text-gray-400"
                      }`}
                    >
                      {msg.createdAt
                        ? msg.createdAt.toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-gray-200 pt-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
