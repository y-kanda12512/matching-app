"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Loading from "@/features/common/components/Loading";
import UserAvatar from "@/features/common/components/UserAvatar";
import { getGenderLabel } from "@/features/common/lib/gender";
import type { UserProfile } from "@/types/user";

type Tab = "received" | "sent";

export default function LikesTabs() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("received");
  const [receivedUsers, setReceivedUsers] = useState<UserProfile[]>([]);
  const [sentUsers, setSentUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchLikes = async () => {
      try {
        const [receivedSnapshot, sentSnapshot] = await Promise.all([
          getDocs(
            query(collection(db, "likes"), where("toUserId", "==", user.uid))
          ),
          getDocs(
            query(collection(db, "likes"), where("fromUserId", "==", user.uid))
          ),
        ]);

        const fetchUser = async (uid: string): Promise<UserProfile | null> => {
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
          };
        };

        const receivedIds = receivedSnapshot.docs.map((d) => d.data().fromUserId);
        const sentIds = sentSnapshot.docs.map((d) => d.data().toUserId);

        const [receivedProfiles, sentProfiles] = await Promise.all([
          Promise.all(receivedIds.map(fetchUser)),
          Promise.all(sentIds.map(fetchUser)),
        ]);

        setReceivedUsers(receivedProfiles.filter((u): u is UserProfile => u !== null));
        setSentUsers(sentProfiles.filter((u): u is UserProfile => u !== null));
      } catch (err) {
        console.error("いいね一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLikes();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) return null;

  const currentUsers = tab === "received" ? receivedUsers : sentUsers;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">いいね</h1>

      <div className="flex rounded-lg border border-gray-200">
        <button
          onClick={() => setTab("received")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "received"
              ? "bg-pink-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          } rounded-l-lg`}
        >
          もらった ({receivedUsers.length})
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "sent"
              ? "bg-pink-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          } rounded-r-lg`}
        >
          送った ({sentUsers.length})
        </button>
      </div>

      {currentUsers.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-gray-500">
            {tab === "received"
              ? "まだいいねをもらっていません"
              : "まだいいねを送っていません"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentUsers.map((u) => (
            <Link
              key={u.uid}
              href={`/profile/${u.uid}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <UserAvatar userId={u.uid} size="lg" linked={false} />
              <div className="flex-1">
                <p className="font-bold">{u.nickname}</p>
                <p className="text-sm text-gray-500">
                  {u.age}歳 / {getGenderLabel(u.gender)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
