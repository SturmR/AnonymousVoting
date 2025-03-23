import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("#email-input-container")) {
        setEmail("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 space-y-4">
      <h1 className="text-2xl font-bold">Create Room</h1>
      
      <div id="email-input-container" className="relative">
        <input
          type="email"
          placeholder="Enter your email"
          className="px-3 py-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => navigate("/")}
      >
        Back to Meeting
      </button>
    </div>
  );
}