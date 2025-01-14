"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  roomId: string;
};

const RoomDetails = ({ roomId }: Props) => {
  const peerRef = useRef(null);

  const webSocketRef = useRef(null);

  const userVideo = useRef<HTMLVideoElement>(null);

  const userStream = useRef<MediaStream | null>(null);

  const partnerVideo = useRef<HTMLVideoElement>(null);

  const openCamera = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      const cameras = allDevices.filter(
        (device) => device.kind == "videoinput"
      );

      console.log(cameras);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          deviceId: cameras[0].deviceId, // Use cameras[1] if you don't want the camera that blinks
        },
      });

      return stream;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    openCamera().then((stream) => {
      if (!stream) return;

      if (!userVideo.current) return;

      userVideo.current.srcObject = stream;

      userStream.current = stream;

      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_API_URL}/rooms/${roomId}/join`
      );

      ws.addEventListener("open", () => {
        console.log("Sending...");

        ws.send(JSON.stringify({ join: true }));
      });

      ws.addEventListener("message", (e) => {
        console.log(e.data);
      });
    });
  }, [roomId]);

  return (
    <div className="w-full max-w-5xl mx-auto h-screen p-5 flex flex-col items-center justify-center">
      <div className="w-full grid md:grid-cols-2 gap-5">
        <video
          className="w-full aspect-video"
          ref={userVideo}
          autoPlay
          controls
        />

        <video
          className="w-full aspect-video"
          ref={partnerVideo}
          autoPlay
          controls
        />
      </div>
    </div>
  );
};

export default RoomDetails;
