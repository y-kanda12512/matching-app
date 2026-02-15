import Link from "next/link";

type UserAvatarProps = {
  userId: string;
  size?: "sm" | "md" | "lg" | "xl";
  linked?: boolean;
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-xl",
  lg: "h-14 w-14 text-2xl",
  xl: "h-28 w-28 text-4xl",
};

export default function UserAvatar({
  userId,
  size = "md",
  linked = true,
}: UserAvatarProps) {
  const avatar = (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-400 ${sizeClasses[size]}`}
    >
      👤
    </div>
  );

  if (!linked) return avatar;

  return <Link href={`/profile/${userId}`}>{avatar}</Link>;
}
