"use server";

import axios from "axios";

export const createRoom = async () => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_API_URL}/rooms/create`,
      {}
    );

    const result = (await res.data) as { roomId: string; message: string };

    return { status: res.status, data: result };
  } catch (err) {
    console.error("Create Room", err);

    throw new Error("Something went wrong! Internal server error.");
  }
};
