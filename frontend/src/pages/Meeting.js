import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Meeting() {
  const navigate = useNavigate();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("#join-room-container")) {
        setShowJoinInput(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 space-y-4">
      <h1 className="text-2xl font-bold">DiscussAndVote Page</h1>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => {
          console.log("navigating to createroom")
          navigate("/create-room")
        }}
      >
        Create Room
      </button>
      
      <div id="join-room-container" className="relative">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={(e) => {
            e.stopPropagation();
            setShowJoinInput(true);
          }}
        >
          Join Room
        </button>
      
        {showJoinInput && (
          <div className="flex flex-col items-center space-y-2 mt-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              className="px-3 py-2 border rounded"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
