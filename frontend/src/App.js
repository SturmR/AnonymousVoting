import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home                   from './pages/Home';
import CreateRoom             from './pages/CreateRoom';             // D&V creator
import PickATime              from './pages/PickATime';              // P@T creator
import DiscussionRoom         from './pages/DiscussionRoom';         // D&V discussion
import DiscussionVotingPage   from './pages/DiscussionVotingPage';   // D&V voting
import PickATimeVotingPage    from './pages/PickATimeVotingPage';    // P@T voting
import Result                 from './pages/Result';                 // final results
import AdminDiscussionPage    from './pages/AdminDiscussionPage';    // admin D&V
import AdminPickATimePage     from './pages/AdminPickATimePage';     // admin P@T
import ErrorPage              from './pages/ErrorPage';              // error page

function RoomVoteRouter() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    axios.get(`/api/rooms/${roomId}`).then(r => setRoom(r.data));
  }, [roomId]);

  if (!room) return null;
  return room.type === 'PickATime'
    ? <PickATimeVotingPage />
    : <DiscussionVotingPage />;
}

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            padding: '12px 16px',
            fontSize: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          },
          success: {
            style: { background: '#22c55e', color: 'white' },
          },
          error: {
            style: { background: '#ef4444', color: 'white' },
          },
        }}
      />
      <Routes>
        {/* home / creation */}
        <Route path="/"               element={<Home />} />
        <Route path="/create-room"    element={<CreateRoom />} />
        <Route path="/pickatime"      element={<PickATime />} />

        {/* discuss page (only for DiscussAndVote) */}
        <Route path="/rooms/:roomId"  element={<DiscussionRoom />} />

        {/* voting page: shared URL but splits by type */}
        <Route path="/rooms/:roomId/vote" element={<RoomVoteRouter />} />

        {/* results for either type */}
        <Route path="/rooms/:roomId/results" element={<Result />} />

        {/* admin panels */}
        <Route path="/admin/discussion/:roomId" element={<AdminDiscussionPage />} />
        <Route path="/admin/pickatime/:roomId"  element={<AdminPickATimePage />} />

        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} /> 
      </Routes>
    </Router>
  );
}
