"use client";

export default function MatchModal({
  nickname,
  onClose,
}: {
  nickname: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center">
        <p className="mb-2 text-4xl">🎉</p>
        <h2 className="mb-2 text-xl font-bold text-pink-500">
          マッチング成立！
        </h2>
        <p className="mb-4 text-gray-600">
          {nickname}さんとマッチしました！
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-pink-500 py-2 font-medium text-white hover:bg-pink-600"
        >
          OK
        </button>
      </div>
    </div>
  );
}
