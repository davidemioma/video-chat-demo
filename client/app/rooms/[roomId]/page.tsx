import RoomDetails from "./_components/RoomDetails";

export default async function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const roomId = (await params).roomId;

  return <RoomDetails roomId={roomId} />;
}
