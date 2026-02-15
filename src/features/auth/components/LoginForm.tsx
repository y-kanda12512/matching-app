"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ErrorAlert from "@/features/common/components/ErrorAlert";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-pink-500">ログイン</h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="パスワードを入力"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pink-500 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          アカウントをお持ちでない方は
          <Link href="/signup" className="ml-1 text-pink-500 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
