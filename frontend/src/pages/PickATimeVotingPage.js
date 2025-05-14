import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'react-feather';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import classnames from 'classnames'; // Use classnames instead

const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PickATimeVotingPage() {
  const { roomId } = useParams();
  const location = useLocation();

  // Parse user ID from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('user');

  // State for user data - fetch username based on userId
  const [username, setUsername] = useState('Loading...'); // Show loading state initially
  useEffect(() => {
    console.log("Fetching username for userId:", userId);
    if (!userId) {
      setUsername('Anonymous / No User ID'); // Handle case where user ID is missing
      console.warn("No user ID found in URL query parameter '?user='");
      return;
    }
    axios.get(`/api/users/${userId}`)
      .then(res => {
        setUsername(res.data.username); // Use the fetched username
      })
      .catch(err => {
        console.error("Error fetching username:", err);
        setUsername('Unknown User'); // Show error state
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
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room,    setRoom]    = useState(null);
  const [bgColorIndex, setBgColorIndex] = useState(0);

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
      const today = new Date(); // Use today's date, we only care about the time.
      const [hours, minutes] = timeString.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0); // Set the hours and minutes
      return today;
    });
    setTimeSlots(timeSlotDates);

  }, []);


  // Fetch poll data
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { data: roomData } = await axios.get(`/api/rooms/${roomId}`);
        setRoom(roomData); // Store full room data
        setQuestion(roomData.title);
        setPollInfo({
          votingBegins: new Date(roomData.votingStart),
          votingEnds:    new Date(roomData.votingEnd),
          canEditVote: roomData.canEditVote,
          votesEditableUntil: new Date(roomData.editVoteUntil),
        });
        const [optRes, voteRes] = await Promise.all([
          axios.get(`/api/options?room=${roomId}`),
          axios.get(`/api/votes?room=${roomId}&user=${userId}`)
        ]);
        setOptions(optRes.data);
        setHasVoted(voteRes.data.length > 0);

        generateTimeGrid(optRes.data);

      } catch (err) {
        setError('Failed to fetch poll data. Please check the URL and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPollData();
  }, [roomId, generateTimeGrid]);

  // Toggle time slot selection
  const toggleTimeSlot = (dateIndex, timeIndex) => {
    const date = dates[dateIndex];
    const time = timeSlots[timeIndex];

    if (!date || !time) return; // prevent errors

    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(time.getHours(), time.getMinutes());
    const slotKey = selectedDateTime.toISOString();

    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(slot => slot !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  // Submit vote
  const submitVote = async () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot before submitting your vote.');
      return;
    }

    try {
      // Convert selectedSlots back to Option IDs.  Find the option that matches the selected time.
      const optionIds = selectedSlots.map(selectedTimeISOString => {
        const selectedTime = new Date(selectedTimeISOString);
        const matchingOption = options.find(option => {
          const optionTime = new Date(option.content);
          return optionTime.getTime() === selectedTime.getTime();
        });
        return matchingOption ? matchingOption._id : null; // Return the _id, or null if no match
      }).filter(id => id !== null); // Filter out any nulls (no matching option)

      //check if user has already voted
      const existingVoteResponse = await axios.get(`/api/votes?room=${roomId}&user=${userId}`);
      if (existingVoteResponse.data.length > 0) {
        //update
        const voteId = existingVoteResponse.data[0]._id; // There should only be one
        await axios.put(`/api/votes/${voteId}`, {
          room: roomId,
          user: userId,
          optionList: optionIds,
        });

      } else {
        //create
        await axios.post('/api/votes', {
          room: roomId,
          user: userId,
          optionList: optionIds,
        });
      }


      alert('Your vote has been submitted successfully!');
      // Optionally, redirect the user or show a confirmation message
    } catch (err) {
      console.error('Error submitting vote:', err);
      alert('Failed to submit your vote. Please try again.');
    }
  };

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
              <React.Fragment key={rowIndex}>
                {dates.map((date, colIndex) => {
                  const cellDateTime = new Date(date);
                  cellDateTime.setHours(time.getHours(), time.getMinutes());
                  const slotKey = cellDateTime.toISOString();
                  const isSelectable = true;

                  return (
                    <button
                      key={`${colIndex}-${rowIndex}`}
                      className={`border rounded p-2 text-center
                                                ${selectedSlots.includes(slotKey)
                        ? 'bg-[#3395ff] text-white'
                        : 'border-[#3395ff] text-[#3395ff] hover:bg-blue-50'
                        }`}
                      onClick={() => toggleTimeSlot(colIndex, rowIndex)}

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
              You must select at least {room.minOptionsPerVote}, at most {Math.min(room.maxOptionsPerVote,options.length)} Options to submit your Vote.
            </p>
            {selectedSlots.length > 0 && (
              <p className="mt-2">
                Selected: {selectedSlots.length} option(s)
              </p>
            )}
            <button
              className={classnames(
                "flex items-center justify-center mt-4 px-4 py-2 rounded w-full",
                isVotingActive
                  ? 'animate-pulse'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              )}
              style={{
                backgroundColor: isVotingActive ? colors[bgColorIndex] : undefined,
                color:  isVotingActive ? '#FFFFFF' : '#FFFFFF',
                  backgroundImage: isVotingActive
                    ? `linear-gradient(to right, ${colors[bgColorIndex]}, ${colors[(bgColorIndex + 1) % colors.length]})`
                    : undefined,
                }}
              disabled={!isVotingActive}
              onClick={submitVote}
            >
              Submit Vote <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
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
            <h3 className="text-xl font-bold mb-2">Voting Status:</h3>
            {votingHasEnded ? (
              <p>Voting has ended.</p>
            ) : isVotingActive ? (
              <p>Voting is in progress.</p>
            ) : (
              <p>Voting has not started yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickATimeVotingPage;

