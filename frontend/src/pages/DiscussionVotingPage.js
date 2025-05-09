import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'react-feather';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DiscussionVotingPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse user ID from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('user'); // Use this ID
  
  // State for user data - fetch username based on userId
  const [username, setUsername] = useState('Loading...'); // Show loading state initially
  useEffect(() => {
    if (!userId) {
      setUsername('Anonymous / No User ID'); // Handle case where user ID is missing
      console.warn("No user ID found in URL query parameter '?user='");
      return;
    }
    axios.get(`/api/users/${userId}`)
         .then(res => {
            setUsername(res.data.username); // Use the fetched username
            // Store nickname locally if needed, but use userId for backend interactions
            const key = `room_${roomId}_nickname_for_${userId}`;
            localStorage.setItem(key, res.data.username);
         })
         .catch(err => {
            console.error("Error fetching username:", err);
            setUsername('Unknown User'); // Show error state
         });
  }, [userId, roomId]);
  
  // State for other room data
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [pollInfo, setPollInfo] = useState(null);
  const [hasVoted, setHasVoted] = useState(false)
  const [discussionTimeRemaining, setDiscussionTimeRemaining] = useState({hasStarted: false, hasEnded: false});
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [room,    setRoom]    = useState(null);
  const [userToken, setUserToken] = useState(null); // Placeholder if needed later
  
  // Selected options
  const [selectedOptions, setSelectedOptions] = useState([]);
  
  // Update time remaining calculations
  const updateVotingTimeRemaining = () => {
    if (!pollInfo) return;
    const now = new Date();

    // Discussion time remaining
    const votingDiff = pollInfo.votingEnds - now;
    if (votingDiff > 0) {
      const days = Math.floor(votingDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((votingDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((votingDiff % (1000 * 60 * 60)) / (1000 * 60));
      setVotingTimeRemaining({ days, hours, minutes });
    } else {
      setVotingTimeRemaining({ days: 0, hours: 0, minutes: 0 });
    }

    // Voting time status
    const discussionStartDiff = pollInfo.discussionBegins - now;
    const discussionEndDiff = pollInfo.discussionEnds - now;

    setDiscussionTimeRemaining({
      hasStarted: discussionStartDiff <= 0,
      hasEnded: discussionEndDiff <= 0
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: roomData } = await axios.get(`/api/rooms/${roomId}`);
        setRoom(roomData); // Store full room data
        setQuestion(roomData.title);
        setPollInfo({
          votingBegins: new Date(roomData.votingStart),
          votingEnds:    new Date(roomData.votingEnd),
          canEditVote: roomData.canEditVote,
          votesEditableUntil: new Date(roomData.editVoteUntil),
          discussionBegins: new Date(roomData.discussionStart),
          discussionEnds:     new Date(roomData.discussionEnd),
        });
        const [optRes, comRes] = await Promise.all([
          axios.get(`/api/options?room=${roomId}`),
          axios.get(`/api/comments?room=${roomId}`)
        ]);
        setOptions(optRes.data);
        updateVotingTimeRemaining(); // Initial calculation
      } catch (err) {
        console.error('Error fetching initial room data:', err);
        // Handle error display for the user here
      }
    };
    fetchData();
    const timer = setInterval(updateVotingTimeRemaining, 60000); // Update every minute
    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [roomId]);
  useEffect(() => {
    if (pollInfo) updateVotingTimeRemaining();
}, [pollInfo]);

  
  const toggleOption = (optionId) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };
  // Format date to display
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return 'Invalid Date'; // Add check for valid date
    return date.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\./g, '/') + ', ' +
    date.toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleSubmitVote = async () => {
    if (!canSubmit) return;
    
    try {
      const existingVote = await axios.get(`/api/votes?room=${roomId}&user=${userId}`);

      if (existingVote.data.length > 0) {
        await axios.delete(`/api/votes/${existingVote.data[0]._id}`);
      }
      console.log('removed votes: ', existingVote.data[0]._id);
      await axios.post('/api/votes', {
        room: roomId,
        optionList: selectedOptions,
        user: userId
      });
      // Update local options with new vote counts
      const updatedOptions = await axios.get(`/api/options?room=${roomId}`);
      setOptions(updatedOptions.data);
      
      // Clear selection
      setSelectedOptions([]);
      
      alert('Vote submitted successfully!');
    } catch (err) {
      alert('Failed to submit vote: ' + err.message);
    }
  };
  
  if (!room || !pollInfo) {
    return <div className="p-8">Loading room details...</div>
  }

  // Check voting constraints
  const canSubmit = selectedOptions.length >= room.minOptionsPerVote && 
                   selectedOptions.length <= room.maxOptionsPerVote &&
                   pollInfo.votingEnds > new Date() &&
                   ((!pollInfo.canEditVote && !hasVoted) || (pollInfo.canEditVote && pollInfo.votesEditableUntil > new Date())) &&
                   pollInfo.votingBegins < new Date() &&
                   (pollInfo.votesEditableUntil);

  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section - Voting */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{room.title}</h2>
            <p className="text-gray-600 mt-2">{room.description}</p>
          </div>

          {/* Options */}
          <div className="mb-8">
            <div className="flex items-start mb-4">
              <h3 className="text-xl font-bold mr-4 mt-2">Options:</h3>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = selectedOptions.includes(option._id);
                  const baseBorder = isSelected ? 'border-[#0066cc]' : 'border-[#3395ff]';
                  return (
                    <button key={option._id} 
                            className={`inline-flex items-center border ${baseBorder} bg-white rounded-full px-3 py-1 space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 ${isSelected ? 'focus:ring-[#0066cc]' : 'focus:ring-[#3395ff]'}`}
                            onClick={() => toggleOption(option._id)}>
                      <span>{option.content}</span>
                      <span className="text-green-500 font-medium">
                        ({option.numberOfProComments ?? 0})
                      </span>
                      <span className="text-red-500 font-medium">
                        ({option.numberOfConComments ?? 0})
                      </span>
                      {isSelected && <X size={14} className="text-gray-400 hover:text-gray-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selection Requirements */}
          <div className="mt-12">
            <p className="text-lg font-medium">
              You must select at least {room.minOptionsPerVote}, at most {Math.min(room.maxOptionsPerVote,options.length)} Options to submit your Vote.
            </p>
            {selectedOptions.length > 0 && (
              <p className="mt-2">
                Selected: {selectedOptions.length} option(s)
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
            <div className="mb-8">
              {/* Display fetched username */}
              <h3 className="text-xl font-bold mb-2">Welcome, {username}</h3>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
              <p className="mb-1">Voting begins: {formatDate(pollInfo.votingBegins)}</p>
              <p className="mb-1">Voting ends: {formatDate(pollInfo.votingEnds)}</p>
              { pollInfo.votesEditableUntil ? (<p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p> ) : (<p className="mb-4">Votes are not editable</p>) }
              <p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Time remaining for Discussion:</h3>
              {!discussionTimeRemaining.hasStarted ?
                ( <p>Discussion hasn't started yet.</p> )
                : discussionTimeRemaining.hasEnded ?
                ( <p>Discussion has ended.</p> )
                : ( <p>Discussion is in progress.</p> )
              }
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Time remaining for Voting:</h3>
              <p className="mb-1">{votingTimeRemaining.days} days</p>
              <p className="mb-1">{votingTimeRemaining.hours} hours</p>
              <p className="mb-4">{votingTimeRemaining.minutes} minutes</p>            
            </div>          
          <div className="space-y-4">
            <button
                className={`flex items-center ${
                  pollInfo.discussionEnds < new Date()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } rounded px-4 py-2 w-full justify-center`}
                disabled={pollInfo.discussionEnds < new Date()}
                onClick={() => navigate(`/rooms/${roomId}/?user=${userId}`)} // Pass userId
              >
              <ArrowLeft size={16} className="mr-2" /> Go back to Discussion
            </button>
            
            <button 
              className={`flex items-center ${
                canSubmit 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } rounded px-4 py-2 w-full justify-center`}
              disabled={!canSubmit}
              onClick={handleSubmitVote}
            >
              Submit Vote <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionVotingPage;