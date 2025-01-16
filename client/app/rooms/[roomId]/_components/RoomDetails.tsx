"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  roomId: string;
};

const RoomDetails = ({ roomId }: Props) => {
  const userVideo = useRef<HTMLVideoElement>(null);

  const userStream = useRef<MediaStream | null>(null);

  const partnerVideo = useRef<HTMLVideoElement>(null);

  const webSocketRef = useRef<WebSocket | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Open device camera
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
          deviceId: cameras[0].deviceId || undefined,
        },
      });

      return stream;
    } catch (err) {
      console.log(err);
    }
  };

  // user creating an offer to patner user
  const handleNegotiationNeeded = async () => {
    try {
      console.log("Creating Offer");

      const myOffer = await peerRef.current?.createOffer();

      await peerRef.current?.setLocalDescription(myOffer);

      webSocketRef.current?.send(
        JSON.stringify({ offer: peerRef.current?.localDescription })
      );
    } catch (err) {
      console.log("Create Offer Error: ", err);
    }
  };

  // When creating a peer connection it creates an ice candidate.
  const handleIceCandidateEvent = (e: RTCPeerConnectionIceEvent) => {
    if (!e.candidate) return;

    console.log("Found Ice Candidate");

    console.log(e.candidate);

    webSocketRef.current?.send(JSON.stringify({ iceCandidate: e.candidate }));
  };

  // stream displayed to other user
  const handleTrackEvent = (e: RTCTrackEvent) => {
    if (!partnerVideo.current) return;

    console.log("Received Tracks");

    partnerVideo.current.srcObject = e.streams[0];
  };

  // To call a user you have to create a peer connection between users
  const createPeer = () => {
    console.log("Creating Peer Connection");

    // Urls should be a STUN or TURN connection
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onnegotiationneeded = handleNegotiationNeeded;

    peer.onicecandidate = handleIceCandidateEvent;

    peer.ontrack = handleTrackEvent;

    return peer;
  };

  // Call user after creating a peer connection
  const callUser = () => {
    console.log("Calling Other User");

    peerRef.current = createPeer();

    userStream.current?.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, userStream.current!);
    });
  };

  // when you send an offer to another user, the other user returns an answer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log("Received Offer, Creating Answer");

    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    userStream.current?.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, userStream.current!);
    });

    const answer = await peerRef.current.createAnswer();

    await peerRef.current.setLocalDescription(answer);

    webSocketRef.current?.send(
      JSON.stringify({ answer: peerRef.current.localDescription })
    );
  };

  useEffect(() => {
    openCamera().then((stream) => {
      if (!stream) return;

      if (!userVideo.current) return;

      userVideo.current.srcObject = stream;

      userStream.current = stream;

      webSocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_API_URL}/rooms/${roomId}/join`
      );

      // Send message to server that a user has joined the room.
      webSocketRef.current.addEventListener("open", () => {
        console.log("Sending...");

        webSocketRef.current?.send(JSON.stringify({ join: true }));
      });

      // Messages recieveed from the socket server.
      webSocketRef.current.addEventListener("message", async (e) => {
        const message = JSON.parse(e.data);

        console.log("Messages: ", message);

        if (message.join) {
          callUser();
        }

        if (message.offer) {
          await handleOffer(message.offer);
        }

        if (message.answer) {
          console.log("Receiving Answer");

          await peerRef.current?.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
        }

        if (message.iceCandidate) {
          console.log("Receiving and Adding ICE Candidate");

          try {
            await peerRef.current?.addIceCandidate(message.iceCandidate);
          } catch (err) {
            console.log("Error Receiving ICE Candidate", err);
          }
        }
      });
    });
  });

  if (!roomId) return null;

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
