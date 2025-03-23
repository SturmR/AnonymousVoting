import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-blue-500 w-full py-4">
        <div className="max-w-7xl mx-auto text-center text-white font-semibold text-xl">
          Home Page
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center mt-8">
        <h1 className="text-3xl font-bold mb-6">Welcome</h1>
        <div className="space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            onClick={() => navigate("/meeting")}
          >
            Go to DiscussAndVote
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            onClick={() => navigate("/pickatime")}
          >
            Go to Pickatime
          </button>
        </div>
      </div>
    </div>
  );
}
