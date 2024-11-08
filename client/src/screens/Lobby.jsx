import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  //After Submitting form details we can take info and going to server
  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  //After coming to server we can redirect the room page
  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="container">
      <h1 className="lobby-header">Video-Chat Login</h1>
      <div className="box-container">
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID:- </label>
          <input
            placeholder="Enter Email..."
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br/>
          <br/>
          <br/>
          <br/>
          <label htmlFor="room">Room No:- </label>
          <input
            placeholder="Enter RoomID..."
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        <br />
        <br />
        <button className="button">Join</button>
      </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
