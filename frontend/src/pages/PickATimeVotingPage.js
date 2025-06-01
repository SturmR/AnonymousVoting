import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'react-feather';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import confetti from 'canvas-confetti';

const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PickATimeVotingPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse user ID from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('user');

  // State for user data - fetch username based on userId
  const [username, setUsername] = useState('Loading...');
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!userId) {
      setUsername('Anonymous / No User ID');
      console.warn("No user ID found in URL query parameter '?user='");
      return;
    }
    axios.get(`/api/users/${userId}`)
      .then(res => {
        setUsername(res.data.username);
        setUser(res.data);
      })
      .catch(err => {
        console.error("Error fetching username:", err);
        setUsername('Unknown User');
      });
  }, [userId]);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [pollInfo, setPollInfo] = useState({
    votingBegins: null,
    votingEnds: null,
    votesEditableUntil: null,
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const [bgColorIndex, setBgColorIndex] = useState(0);  
  const [isVotingReady, setIsVotingReady] = useState(false); // Controls rendering of main content
  const [showVotingNotStartedModal, setShowVotingNotStartedModal] = useState(false); // Controls blocking modal visibility
  

  // Helper function to format date for display
  const formatDate = (date) => {
    if (!date) return 'Invalid Date';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\./g, '/');
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to format time
  const formatTime = (date) => {
    if (!date) return 'Invalid Time';
    try {
      const d = new Date(date);
      return d.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Time';
    }
  };

  const updateVotingTimeRemaining = useCallback(() => {
    if (!pollInfo) return;

    const now        = new Date();
    const votingDiff = pollInfo.votingEnds - now;

    if (votingDiff > 0) {
      const days    = Math.floor(votingDiff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((votingDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((votingDiff % (1000 * 60 * 60)) / (1000 * 60));
      setVotingTimeRemaining({ days, hours, minutes });
    } else {
      setVotingTimeRemaining({ days: 0, hours: 0, minutes: 0 });
    }
  }, [pollInfo]);   // ← stable unless pollInfo itself changes


  // Function to generate the time grid data
  const generateTimeGrid = useCallback((availableOptions) => {
    if (!availableOptions || availableOptions.length === 0) {
      setDates([]);
      setTimeSlots([]);
      return;
    }

    // Sort options by date
    const sortedOptions = [...availableOptions].sort((a, b) =>
      new Date(a.content).getTime() - new Date(b.content).getTime()
    );

    // Extract unique dates
    const uniqueDates = [];
    sortedOptions.forEach(option => {
      const optionDate = new Date(option.content).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\./g, '/');
      if (!uniqueDates.includes(optionDate)) {
        uniqueDates.push(optionDate);
      }
    });
    setDates(uniqueDates.map(dateString => {
      const parts = dateString.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }));

    // Extract unique times, ensure they are sorted
    const uniqueTimes = [];
    sortedOptions.forEach(option => {
      const optionTime = new Date(option.content).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
      if (!uniqueTimes.includes(optionTime)) {
        uniqueTimes.push(optionTime);
      }
    });

    // Convert uniqueTimes strings back to Date objects for easier use
    const timeSlotDates = uniqueTimes.map(timeString => {
      const today = new Date();
      const [hours, minutes] = timeString.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    });
    setTimeSlots(timeSlotDates);

  }, []);

  // Fetch poll data
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { data: roomData } = await axios.get(`/api/rooms/${roomId}`);
        setRoom(roomData);
        setQuestion(roomData.title);
        setPollInfo({
          votingBegins: new Date(roomData.votingStart),
          votingEnds: new Date(roomData.votingEnd),
          canEditVote: roomData.canEditVote,
          votesEditableUntil: new Date(roomData.editVoteUntil),
        });
        if (userId && !roomData.userList.includes(userId)) {
          console.warn(`User ID ${userId} not found in room ${roomId}'s userList. Redirecting to error page.`);
          navigate('/error');
          return; // Stop further execution in this try block
        }
        
        const userResponse = await axios.get(`/api/users/${userId}`);
        const user = userResponse.data;
        const now = new Date();
        const votingHasStarted = new Date(roomData.votingStart) <= now;
        const votingHasEnded = new Date(roomData.votingEnd) <= now;

        if (votingHasEnded) { // navigate to the results
          alert('Voting has ended. Redirecting to results page.');
          navigate(`/rooms/${roomId}/results`);
          return; // Stop further execution in this try block
        } else if (!votingHasStarted && !user?.isAdmin) {
          setShowVotingNotStartedModal(true);
          setIsVotingReady(false); 
          return; // Stop further execution if discussion hasn't started
        } else {
          setShowVotingNotStartedModal(false);
          setIsVotingReady(true);
          const [optRes, voteRes] = await Promise.all([
            axios.get(`/api/options?room=${roomId}`),
            axios.get(`/api/votes?room=${roomId}&user=${userId}`)
          ]);
          setOptions(optRes.data);
          generateTimeGrid(optRes.data);
          setHasVoted(voteRes.data.length > 0);
          setSelectedSlots(voteRes.data[0]?.optionList || []);
        }
        updateVotingTimeRemaining();
      } catch (err) {
        setError('Failed to fetch poll data. Please check the URL and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPollData();
    const timer = setInterval(updateVotingTimeRemaining, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [roomId, generateTimeGrid, userId]);

  useEffect(() => {
    if (pollInfo) updateVotingTimeRemaining();
  }, [pollInfo]);

  /* One-shot “fountain” that lasts ~1.5 s */
  const fireConfetti = useCallback(() => {
    const DURATION = 1500;            // total runtime (ms)
    const end = Date.now() + DURATION;

    (function frame() {
      /* 7 small bursts per animation frame → continuous stream */
      confetti({
        particleCount: 7,
        startVelocity: 30,
        spread: 80,        // width of the plume
        angle: 90,         // 90° = straight up
        origin: {
          x: Math.random(), // random left-to-right
          y: 1              // 1 = bottom of the viewport
        },
        scalar: 0.8,        // slightly smaller pieces
        ticks: 200          // lifetime of each particle
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Toggle time slot selection
  const toggleTimeSlot = (optionId) => {
    setSelectedSlots(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  // Submit vote
  const submitVote = async () => {
    if (!canSubmit) {
      alert('Please select time slots according to the rules to submit your vote.');
      return;
    }

    try {
      const existingVote = await axios.get(`/api/votes?room=${roomId}&user=${userId}`);
      if (existingVote.data.length > 0) {
        await axios.put(`/api/votes/${existingVote.data[0]._id}`, {
          room: roomId,
          user: userId,
          optionList: selectedSlots
        });
      } else {
        await axios.post('/api/votes', {
          room: roomId,
          user: userId,
          optionList: selectedSlots
        });
      }

      setHasVoted(true);

      // Update local options
      const updatedOptions = await axios.get(`/api/options?room=${roomId}`);
      setOptions(updatedOptions.data);

      alert('Vote submitted successfully!');
      fireConfetti();
    } catch (err) {
      alert('Failed to submit vote: ' + err.message);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const id = setInterval(updateVotingTimeRemaining, 60_000); // once a minute
    updateVotingTimeRemaining();                               // run immediately
    return () => clearInterval(id);
  }, [updateVotingTimeRemaining]);

  if (loading) {
    return <div className="p-8">Loading poll data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!pollInfo.votingBegins || !pollInfo.votingEnds) {
    return <div className="p-8">Voting times are not defined for this poll.</div>;
  }

  const now = new Date();
  const isVotingActive = now >= pollInfo.votingBegins && now <= pollInfo.votingEnds;
  const votingHasEnded = now > pollInfo.votingEnds;
  const canSubmit =
    selectedSlots.length >= room.minOptionsPerVote &&
    selectedSlots.length <= room.maxOptionsPerVote &&
    now <= pollInfo.votingEnds &&
    (pollInfo.canEditVote || !hasVoted) &&
    now >= pollInfo.votingBegins &&
    (!pollInfo.canEditVote || now <= pollInfo.votesEditableUntil);


  if (!isVotingReady && showVotingNotStartedModal) {
    return (
      <VotingNotStartedModal
        show={true}
        votingStartTime={pollInfo?.votingBegins}
      />
    );
  }
  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section - Time Selection */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{question}</h2>
          </div>

          {/* Date Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2" style={{ gridTemplateColumns: `repeat(${dates.length}, 1fr)` }}>
            {dates.map((date, index) => (
              <div key={index} className="text-center font-medium">
                {formatDate(date)}
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-7 gap-2" style={{ gridTemplateColumns: `repeat(${dates.length}, 1fr)` }}>
            {timeSlots.map((time, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}> {/* Added a unique key for the row */}
                {dates.map((date, colIndex) => {
                  const cellDateTime = new Date(date);
                  cellDateTime.setHours(time.getHours(), time.getMinutes());
                  const option = options.find(opt => new Date(opt.content).getTime() === cellDateTime.getTime());
                  const isSelected = selectedSlots.includes(option?._id);
                  return (
                    <button
                      key={option?._id || `${colIndex}-${rowIndex}`} // Use option ID or a combination of col/row indexes
                      className={classnames(
                        'border rounded p-2 text-center',
                        (!option || option.isWatchlisted)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : isSelected
                            ? 'bg-[#3395ff] text-white'
                            : 'border-[#3395ff] text-[#3395ff] hover:bg-blue-50'
                      )}
                      onClick={() => option && !option.isWatchlisted && toggleTimeSlot(option._id)}
                      disabled={!option || option.isWatchlisted}
                    >
                      {formatTime(time)}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          {/* Selection Requirements */}
          <div className="mt-12">
            <p className="text-lg font-medium">
              You must select at least {room.minOptionsPerVote}, at most {Math.min(room.maxOptionsPerVote, options.length)} Options to submit your Vote.
            </p>
            {selectedSlots.length > 0 && (
              <p className="mt-2">
                Selected: {selectedSlots.length} option(s)
              </p>
            )}
            <button
              className={classnames(
                "flex items-center justify-center mt-4 px-4 py-2 rounded w-full",
                canSubmit ? 'animate-pulse' : 'bg-gray-400 text-white cursor-not-allowed'
              )}
              style={{
                backgroundColor: canSubmit ? colors[bgColorIndex] : undefined,
                color: canSubmit ? '#FFFFFF' : '#FFFFFF',
                backgroundImage: canSubmit
                  ? `linear-gradient(to right, ${colors[bgColorIndex]}, ${colors[(bgColorIndex + 1) % colors.length]})`
                  : undefined,
              }}
              onClick={submitVote}
              disabled={!canSubmit}
            >
              Submit Vote <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
          {user?.isAdmin && (
            <button
              onClick={() => navigate(`/admin/pickatime/${roomId}?user=${userId}`)} // Pass userId
              className="bg-[#1E4A8B] text-white rounded px-4 py-2 mb-8 w-full text-center"  // Changed from bg-navy-blue to #003366
            >
              Go to Admin Panel
            </button>
          )}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Welcome, {username}</h3>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
            <p className="mb-1">Voting begins: {pollInfo.votingBegins ? formatDate(pollInfo.votingBegins) : 'N/A'}</p>
            <p className="mb-1">Voting ends: {pollInfo.votingEnds ? formatDate(pollInfo.votingEnds) : 'N/A'}</p>
            <p className="mb-4">Votes can be edited until: {pollInfo.votesEditableUntil ? formatDate(pollInfo.votesEditableUntil) : 'N/A'}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Time remaining for voting:</h3>
            <p className="mb-1">{votingTimeRemaining.days} days</p>
            <p className="mb-1">{votingTimeRemaining.hours} hours</p>
            <p className="mb-4">{votingTimeRemaining.minutes} minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickATimeVotingPage;


const VotingNotStartedModal = ({ show, votingStartTime }) => {
  if (!show) return null;

  const formattedTime = votingStartTime ? votingStartTime.toLocaleString('de-DE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  }).replace(/\./g, '/') : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Voting Not Started Yet</h2>
        <p className="text-gray-600 mb-6">
          The voting for this room is scheduled to begin at:
          <br />
          <strong className="text-[#3395ff]">{formattedTime}</strong>
        </p>
        <p className="text-gray-600">
          Please wait until the host starts the voting process.
        </p>
      </div>
    </div>
  );
};


