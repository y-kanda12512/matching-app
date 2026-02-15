"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Loading from "@/features/common/components/Loading";
import UserAvatar from "@/features/common/components/UserAvatar";
import MatchModal from "@/features/common/components/MatchModal";
import { getGenderLabel } from "@/features/common/lib/gender";
import type { UserProfile } from "@/types/user";

export default function ProfileDetail({ userId }: { userId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            uid: userId,
            nickname: data.nickname,
            bio: data.bio,
            age: data.age,
            gender: data.gender,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }

        if (user.uid !== userId) {
          const likesQuery = query(
            collection(db, "likes"),
            where("fromUserId", "==", user.uid),
            where("toUserId", "==", userId)
          );
          const likesSnapshot = await getDocs(likesQuery);
          setIsLiked(!likesSnapshot.empty);
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, user, authLoading, router]);

  const handleLike = async () => {
    if (!user || isLiked || liking) return;
    setLiking(true);
    try {
      await addDoc(collection(db, "likes"), {
        fromUserId: user.uid,
        toUserId: userId,
        createdAt: serverTimestamp(),
      });
      setIsLiked(true);

      const reverseQuery = query(
        collection(db, "likes"),
        where("fromUserId", "==", userId),
        where("toUserId", "==", user.uid)
      );
      const reverseSnapshot = await getDocs(reverseQuery);

      if (!reverseSnapshot.empty) {
        const [uid1, uid2] =
          user.uid < userId ? [user.uid, userId] : [userId, user.uid];

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
          setMatched(true);
        }
      }
    } catch (err) {
      console.error("いいねエラー:", err);
    } finally {
      setLiking(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">プロフィールが見つかりません</p>
      </div>
    );
  }

  const isOwnProfile = user.uid === userId;

  return (
    <div className="space-y-6">
      {matched && (
        <MatchModal
          nickname={profile.nickname}
          onClose={() => setMatched(false)}
        />
      )}
      <div className="flex flex-col items-center gap-4">
        <UserAvatar userId={profile.uid} size="xl" linked={false} />

        <div className="text-center">
          <h1 className="text-xl font-bold">{profile.nickname}</h1>
          <p className="text-sm text-gray-500">
            {profile.age}歳 / {getGenderLabel(profile.gender)}
          </p>
        </div>
      </div>

      {profile.bio && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-gray-500">自己紹介</h2>
          <p className="whitespace-pre-wrap text-gray-700">{profile.bio}</p>
        </div>
      )}

      {isOwnProfile ? (
        <Link
          href="/profile/edit"
          className="block w-full rounded-lg border border-pink-500 py-2 text-center font-medium text-pink-500 transition-colors hover:bg-pink-50"
        >
          プロフィールを編集
        </Link>
      ) : (
        <button
          onClick={handleLike}
          disabled={isLiked || liking}
          className={`w-full rounded-lg py-2 font-medium transition-colors ${
            isLiked
              ? "bg-gray-100 text-gray-400"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          {isLiked ? "いいね済み" : liking ? "送信中..." : "💗 いいね"}
        </button>
      )}
    </div>
  );
}
