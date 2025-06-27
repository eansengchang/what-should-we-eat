import React, { useEffect, useState } from "react";
import "./HeroPage.css";
import { socket } from "../socket";

const HeroPage = () => {
  const [roomCode, setRoomCode] = React.useState("");
  const [errorMessage, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    setError(null);
    console.log("Create Room button clicked");

    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    // Success callback function
    const successHandler = (position) => {
      console.log("Now fetching restaurant data");

      socket.emit("create-room", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };

    // Error callback function
    const errorHandler = (err) => {
      setError(`Error getting location: ${err.message}`);
      setLoading(false);
    };

    // Get the current position
    setLoading(true);
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
  };

  const handleJoinRoom = () => {
    setError(null);
    console.log("Join Room button clicked");
    socket.emit("join-room", roomCode);
    setLoading(true);
  };

  useEffect(() => {
    socket.on("unknownCode", () => {
      console.log("We sent an unknown code");
      setError("Error: Unknown Room Code!");
      setLoading(false);
    });
    socket.on("room-name", (roomName) => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="heroPage">
      <h1 className="heroTitle">What Should We Eat Today?</h1>

      <p className="heroSubtitle">
        Use this website to decide on restaurants together as a group!
      </p>

      <div className="heroButtons">
        <button className="heroButton" onClick={handleCreateRoom}>
          Create Room
        </button>
        <input
          type="text"
          placeholder="Enter Room Code"
          className="roomInputField"
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button className={"heroButton"} onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
      {loading && <p>Loading...</p>}
      <div className="errorMessage">
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default HeroPage;
