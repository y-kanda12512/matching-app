import ChatRoom from "@/features/messages/components/ChatRoom";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <ChatRoom matchId={matchId} />;
}
