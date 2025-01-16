"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createRoom } from "@/lib/actions/room";
import { useMutation } from "@tanstack/react-query";

export default function CreateRoomPage() {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationKey: ["create-room"],
    mutationFn: async () => {
      const result = await createRoom();

      return result;
    },
    onSuccess: (result) => {
      if (result.status !== 201) {
        toast.error("Unable to create room.");

        return;
      }

      toast.success(result.data.message || "Room created!");

      router.push(`/rooms/${result.data.roomId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong!");
    },
  });

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl text-center font-bold">Welcome</h1>

        <h2 className="text-xl text-center font-semibold text-muted-foreground">
          Create a room
        </h2>
      </div>

      <Button
        variant="outline"
        type="button"
        onClick={() => {
          mutate();
        }}
        disabled={isPending}
      >
        {isPending ? "Loading..." : "Create Room"}
      </Button>
    </div>
  );
}
