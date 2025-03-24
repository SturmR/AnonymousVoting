import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Meeting from "./pages/Meeting";
import PickATime from "./pages/PickATime";
import CreateRoom from "./pages/CreateRoom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meeting" element={<Meeting />} />
        <Route path="/pickatime" element={<PickATime />} />
        <Route path="/create-room" element={<CreateRoom />} />
      </Routes>
    </Router>
  );
}
