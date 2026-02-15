import ProfileDetail from "@/features/profile/components/ProfileDetail";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileDetail userId={id} />;
}
