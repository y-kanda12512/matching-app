"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNickname(data.nickname || "");
        setBio(data.bio || "");
        setAge(data.age?.toString() || "");
        setGender(data.gender || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!nickname.trim()) {
      setError("ニックネームを入力してください");
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 120) {
      setError("年齢は18歳以上で入力してください");
      return;
    }
    if (!gender) {
      setError("性別を選択してください");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      await setDoc(docRef, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        age: Number(age),
        gender,
        updatedAt: serverTimestamp(),
        ...(!docSnap.exists() && { createdAt: serverTimestamp() }),
      });

      router.push(`/profile/${user.uid}`);
    } catch {
      setError("プロフィールの保存に失敗しました");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold">プロフィール編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            ニックネーム <span className="text-red-500">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            placeholder="表示される名前"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            年齢 <span className="text-red-500">*</span>
          </label>
          <input
            id="age"
            type="number"
            required
            min={18}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            性別 <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex gap-4">
            {[
              { value: "male", label: "男性" },
              { value: "female", label: "女性" },
              { value: "other", label: "その他" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={gender === option.value}
                  onChange={(e) => setGender(e.target.value)}
                  className="accent-pink-500"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            placeholder="自己紹介を入力してください"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-pink-500 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
