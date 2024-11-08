import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();


  //Set the room id and console the user had joined
  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketId(id);
  }, []);

  // After redirect to my room page first taking Permissions to user
  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);


  const handleEndUser =  () => {
    setMyStream(null);
    setRemoteStream(null);
  }

  const handleRoomDisconnect = () => {
    window.location.href = "/";
  }

  //Device A Taking User Information then send to Device B through offerr
  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  //push The Audio and video to peer connection & Listen
  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  //Negotiation work on that time when connection are slow to reconnecting
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  //Negotiation means establish the essential connection like create offer, accept answer to know the 
  //capabilities of Device A send to B and Device B send to A
  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  //Chatting App
  const messageInput = document.querySelector("input");
  const allMessages = document.getElementById("messages");

  socket.on('message', (message) => {
    const p = window.document.createElement("p");
    p.innerText = message;

    if(allMessages){
      allMessages.appendChild(p);
    }
  });

  const handleable = () =>{
    socket.emit("chat", messageInput.value);
  }


  return (
    <div>
      <h1 className="heading">Welcome To the Room</h1>
      <h3 className="on-off">{remoteSocketId ? "Connected" : "No one in room"}</h3>
      <div className="video-container">
        {myStream && <button className="button-Send" onClick={sendStreams}>Send Stream</button>}
        {remoteSocketId && <button className="button-Call" onClick={handleCallUser}>CALL</button>}

        <div className="video-Room">
          {myStream && (
            <>
              <ReactPlayer
                playing
                muted
                width="100%"
                height="30vh"
                className="video-My"
                url={myStream}
              />
            </>
          )}
          {remoteStream && (
            <>
              <ReactPlayer
                playing
                muted
                width="100%"
                height="30vh"
                className="video-My"
                url={remoteStream}
              />
            </>
          )}
        </div>
        {myStream && <button className="button-End" onClick={handleEndUser}>End Call</button>}
      </div>

      <div className="chat-container">
        <h1>Chat App</h1>
          <div id="messages"></div>
          <div className="footer">
            <input type="text" className="put" width="100%" height="60px" placeholder="Message..."/>
            {remoteSocketId? <button id="btn" onClick={handleable}>Send</button> : <button id="btn" disabled>Send</button>}
          </div>
      </div>
      <button className="dis-btn" onClick={handleRoomDisconnect}>Exit</button>
    </div>
  );
};

export default RoomPage;
