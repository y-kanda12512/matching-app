export default function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
      {message}
    </div>
  );
}
