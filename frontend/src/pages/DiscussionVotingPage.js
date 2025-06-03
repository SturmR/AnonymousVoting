import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'react-feather';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import classnames from 'classnames'; // Use classnames instead
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

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
  const [user, setUser] = useState(null); // Placeholder for user data

  const hasAlreadyRedirected = useRef(false);

  useEffect(() => {
    if (!userId) {
      setUsername('Anonymous / No User ID'); // Handle case where user ID is missing
      console.warn("No user ID found in URL query parameter '?user='");
      return;
    }
    axios.get(`/api/users/${userId}`)
         .then(res => {
            setUsername(res.data.username); // Use the fetched username
            setUser(res.data); // Store user data if needed later
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
  const [hasVoted, setHasVoted] = useState(false);
  const [discussionTimeRemaining, setDiscussionTimeRemaining] = useState({hasStarted: false, hasEnded: false});
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [room,    setRoom]    = useState(null);
  const [userToken, setUserToken] = useState(null); // Placeholder if needed later
  const [bgColorIndex, setBgColorIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isVotingReady, setIsVotingReady] = useState(false); // Controls rendering of main content
  const [showVotingNotStartedModal, setShowVotingNotStartedModal] = useState(false); // Controls blocking modal visibility

  
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
        // toast.success(!user?.isAdmin);

        if (votingHasEnded && !hasAlreadyRedirected.current) {
          hasAlreadyRedirected.current = true;
          toast.success('Voting has ended. Redirecting to results page.');
          navigate(`/rooms/${roomId}/results`);
          return;
        } else if (!votingHasStarted && !user?.isAdmin) {
          setShowVotingNotStartedModal(true);
          setIsVotingReady(false); 
          return; // Stop further execution if discussion hasn't started
        } else {
          setShowVotingNotStartedModal(false);
          setIsVotingReady(true);
          const [optRes, comRes, voteRes] = await Promise.all([
            axios.get(`/api/options?room=${roomId}`),
            axios.get(`/api/comments?room=${roomId}`),
            axios.get(`/api/votes?room=${roomId}&user=${userId}`)
          ]);
          setOptions(optRes.data);
          setHasVoted(voteRes.data.length > 0);
          setSelectedOptions(voteRes.data[0]?.optionList || []);
        }
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
        console.log('removed votes: ', existingVote.data[0]._id);
      }
      await axios.post('/api/votes', {
        room: roomId,
        optionList: selectedOptions,
        user: userId
      });

      setHasVoted(true);

      // Update local options with new vote counts
      const updatedOptions = await axios.get(`/api/options?room=${roomId}`);
      setOptions(updatedOptions.data);
            
      toast.success('Vote submitted successfully!');
      fireConfetti();
    } catch (err) {
      toast.success('Failed to submit vote: ' + err.message);
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
                  return (
                    <button key={option._id} 
                            className={`inline-flex items-center border rounded-full px-3 py-1 space-x-1 hover:outline-none hover:ring-2 hover:ring-offset-1 ${isSelected ? 'bg-[#8CC8EA]' : 'bg-white'}`}
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

          {/* Selection Requirements and Submit*/}
          <div className="mt-12">
            <p className="text-lg font-medium">
              You must select at least {room.minOptionsPerVote}, at most {Math.min(room.maxOptionsPerVote,options.length)} Options to submit your Vote.
            </p>
            {selectedOptions.length > 0 && (
              <p className="mt-2">
                Selected: {selectedOptions.length} option(s)
              </p>
            )}
            {hasVoted && (
              <p className="mt-2 text-red-500">
                You have already voted. You {canSubmit ? "can" : "can't"} change your vote.
              </p>
            )}
            <button 
            className={classnames(
              "flex items-center mt-4 rounded px-4 py-2 w-full justify-center",
              canSubmit 
                ? 'animate-pulse'
                : 'bg-gray-400 text-white cursor-not-allowed'
            )}
            style={{
                  backgroundColor: canSubmit ? colors[bgColorIndex] : undefined,
                  color:  canSubmit ? '#FFFFFF' : '#FFFFFF',
                  backgroundImage: canSubmit
                    ? `linear-gradient(to right, ${colors[bgColorIndex]}, ${colors[(bgColorIndex + 1) % colors.length]})`
                    : undefined,
                }}
            disabled={!canSubmit}
            onClick={handleSubmitVote}
          >
            Submit Vote <ArrowRight size={16} className="ml-2" />
          </button>
          </div>
          
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
              {user?.isAdmin && (
                <button
                  onClick={() => navigate(`/admin/discussion/${roomId}?user=${userId}`)} // Pass userId
                  className="bg-[#1E4A8B] text-white rounded px-4 py-2 mb-8 w-full text-center"  // Changed from bg-navy-blue to #003366
                >
                  Go to Admin Panel
                </button>
              )}
            <div className="mb-8">
              {/* Display fetched username */}
              <h3 className="text-xl font-bold mb-2">Welcome, {username}</h3>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
              <p className="mb-1">Voting begins: {formatDate(pollInfo.votingBegins)}</p>
              <p className="mb-1">Voting ends: {formatDate(pollInfo.votingEnds)}</p>
              { pollInfo.canEditVote ? (<p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p> ) : (<p className="mb-4">Votes are not editable</p>) }
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionVotingPage;



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
