"use client";

import { useState, useEffect, use } from "react";
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
import type { UserProfile } from "@/types/user";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            uid: id,
            nickname: data.nickname,
            bio: data.bio,
            age: data.age,
            gender: data.gender,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }

        if (user.uid !== id) {
          const likesQuery = query(
            collection(db, "likes"),
            where("fromUserId", "==", user.uid),
            where("toUserId", "==", id)
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
  }, [id, user, authLoading, router]);

  const handleLike = async () => {
    if (!user || isLiked || liking) return;
    setLiking(true);
    try {
      await addDoc(collection(db, "likes"), {
        fromUserId: user.uid,
        toUserId: id,
        createdAt: serverTimestamp(),
      });
      setIsLiked(true);
    } catch (err) {
      console.error("いいねエラー:", err);
    } finally {
      setLiking(false);
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

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">プロフィールが見つかりません</p>
      </div>
    );
  }

  const isOwnProfile = user.uid === id;
  const genderLabel =
    { male: "男性", female: "女性", other: "その他" }[profile.gender] ||
    profile.gender;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-4xl text-gray-400">
          👤
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold">{profile.nickname}</h1>
          <p className="text-sm text-gray-500">
            {profile.age}歳 / {genderLabel}
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
