import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, Filter, ArrowRight, Plus } from 'react-feather';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Comment from '../components/Comment';

// Set default base URL for axios if not already set elsewhere
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DiscussionRoom() {
  // Get room ID from URL params
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
  const [newOption, setNewOption] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchComment, setSearchComment] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState('');
  const [sortType, setSortType] = useState('Recent');
  const [pollInfo, setPollInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ hasStarted: false, hasEnded: false });
  const [room,    setRoom]    = useState(null);
  const [userToken, setUserToken] = useState(null); // Placeholder if needed later

  // Update time remaining calculations
  const updateTimeRemaining = () => {
    if (!pollInfo) return;
    const now = new Date();

    // Discussion time remaining
    const discussionDiff = pollInfo.discussionEnds - now;
    if (discussionDiff > 0) {
      const days = Math.floor(discussionDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((discussionDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((discussionDiff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining({ days, hours, minutes });
    } else {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
    }

    // Voting time status
    const votingStartDiff = pollInfo.votingBegins - now;
    const votingEndDiff = pollInfo.votingEnds - now;

    setVotingTimeRemaining({
      hasStarted: votingStartDiff <= 0,
      hasEnded: votingEndDiff <= 0
    });
  };


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: roomData } = await axios.get(`/api/rooms/${roomId}`);
        setRoom(roomData); // Store full room data
        setQuestion(roomData.title);
        setPollInfo({
          canAddOptions: roomData.canAddOption,
          votingBegins: new Date(roomData.votingStart),
          votingEnds:    new Date(roomData.votingEnd),
          votesEditableUntil: new Date(roomData.editVoteUntil),
          discussionEnds:     new Date(roomData.discussionEnd),
        });
        const [optRes, comRes] = await Promise.all([
          axios.get(`/api/options?room=${roomId}`),
          axios.get(`/api/comments?room=${roomId}`)
        ]);
        setOptions(optRes.data);
        setComments(comRes.data);
        updateTimeRemaining(); // Initial calculation
      } catch (err) {
        console.error('Error fetching initial room data:', err);
        // Handle error display for the user here
      }
    };
    fetchData();
    const timer = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [roomId]);
  useEffect(() => {
    if (pollInfo) updateTimeRemaining();
}, [pollInfo]);

  // Fetch comments (can be triggered again if needed)
  const fetchComments = () => {
     axios.get(`/api/comments?room=${roomId}`).then(r => setComments(r.data)).catch(console.error);
  }
  // useEffect(() => {
  //   fetchComments();
  // }, [roomId]); // Fetch initially

  // Add Option
  const addOption = async () => {
    if (!newOption.trim() || !pollInfo?.canAddOptions) return;
    try {
      const res = await axios.post('/api/options', {
        room: roomId,
        content: newOption
      });
      setOptions(prev => [...prev, res.data]);
      setNewOption('');
    } catch(e) {
      console.error("Error adding option:", e);
    }
  };

  // Add Comment
  const addComment = async () => {
    // *** MODIFICATION START ***
    // Check if userId exists (it should if the user followed the correct link)
    if (!userId) {
        alert('Cannot post comment: User ID is missing. Please ensure you accessed this page via the link provided upon room creation.');
        return;
    }
    if (!newComment.trim()) return;
    // *** MODIFICATION END ***

    try {
      const res = await axios.post('/api/comments', {
        room: roomId,
        content: newComment,
        user: userId,
        relatedOption: selectedOptionId || undefined,
        isPro: selectedOpinion === 'pro',
        isCon: selectedOpinion === 'con'
      });
      // Optimistically add the comment, or refetch
      // setComments(prev => [...prev, res.data]); // Optimistic update
      fetchComments(); // Refetch to ensure data consistency including populated user
      setNewComment('');
      setSelectedOptionId('');
      setSelectedOpinion('');
    } catch (e) {
      console.error("Error adding comment:", e);
      alert('Failed to post comment: ' + (e.response?.data?.message || e.message));
    }
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

  const handleVote = async (commentId, type) => {
    try {
      const res = await axios.post(`/api/comments/${commentId}/${type}`, {user: userId});
      // Update the specific comment in the state
      setComments(prev =>
        prev.map(c => (c._id === commentId ? { ...c, votes: res.data.votes } : c))
      );
    } catch (err) {
      console.error("Error voting on comment:", err);
      alert('Failed to vote: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!room || !pollInfo) {
    return <div className="p-8">Loading room details...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#3395ff] py-16 text-center">
        <h1 className="text-white text-4xl font-bold">Discussing Page - Discuss&Vote</h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex justify-center p-8">
        <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
          {/* Left Section - Discussion */}
          <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{question}</h2>
            </div>

            {/* Options */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold mr-4">Options:</h3>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
              {options.map(o => (
                <span key={o._id} className="inline-flex items-center space-x-px bg-white text-[#3395ff] border border-[#3395ff] rounded-full px-3 py-1">
                  <span>{o.content}</span>
                  <span className="text-green-500 font-medium">
                    ({o.numberOfProComments ?? 0})
                  </span>
                  <span className="text-red-500 font-medium">
                    ({o.numberOfConComments ?? 0})
                  </span>
                </span>
              ))}
              </div>

              {pollInfo.canAddOptions && (
                <div className="flex border rounded">
                  <input
                    id="option-input"
                    type="text"
                    className="px-3 py-1 focus:outline-none w-full"
                    placeholder="Add a new option..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  />
                  <button
                    className="bg-white px-2 flex items-center"
                    onClick={addOption}
                  >
                    <Plus size={16} />
                  </button>
                </div>
               )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Comments</h3>
                <span className="text-gray-500">{comments.length} comments</span>
              </div>

              <div className="mb-4">
                 {/* Display fetched username */}
                 <p className="text-sm text-gray-600 mb-1">Commenting as: {username}</p>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-500"
                  placeholder={`Write your comment here...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                 />
              </div>

              <div className="flex mb-4 items-center"> {/* Use items-center for vertical alignment */}
                <div className="mr-2">
                  <select
                    className="border rounded p-2 h-10" // Match button height
                    value={selectedOptionId}
                    onChange={(e) => setSelectedOptionId(e.target.value)}
                  >
                    <option value="">Relate to Option (Optional)</option> {/* Improved placeholder */}
                    {options.map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.content}</option>
                    ))}
                  </select>
                </div>
                <div className="mr-2"> {/* Add margin */}
                  <select
                    className="border rounded p-2 h-10" // Match button height
                    value={selectedOpinion}
                    onChange={(e) => setSelectedOpinion(e.target.value)}
                  >
                    <option value="">Opinion (Optional)</option> {/* Improved placeholder */}
                    <option value="pro">Pro</option>
                    <option value="con">Con</option>
                  </select>
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-[#3395ff] text-white rounded px-4 py-2 h-10" // Match select height
                    onClick={addComment}
                  >
                    Post
                  </button>
                </div>
              </div>

              <div className="flex mb-6">
                <div className="relative flex-grow mr-2">
                  <input
                    type="text"
                    className="w-full border rounded p-2 pl-10"
                    placeholder="Search for Comment"
                    value={searchComment}
                    onChange={(e) => setSearchComment(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                  </div>
                </div>
                <div className="flex items-center">
                  <Filter size={18} className="mr-1" />
                  <select
                    className="border rounded p-2"
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                  >
                    <option value="Recent">Recent</option>
                    <option value="Most Votes">Most Votes</option>
                    <option value="Oldest">Oldest</option>
                  </select>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-6">
              {[...comments] // Create a new array for sorting
                .filter((c) =>
                  c.content.toLowerCase().includes(searchComment.toLowerCase()) ||
                  c.relatedOption?.content?.toLowerCase().includes(searchComment.toLowerCase())
                )
                .sort((a, b) => {
                  if (sortType === 'Recent') {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  } else if (sortType === 'Oldest') {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                  } else if (sortType === 'Most Votes') {
                    // Ensure votes exist and default to 0 if not
                    const votesA = a.votes ?? 0;
                    const votesB = b.votes ?? 0;
                    return votesB - votesA;
                  }
                  return 0; // Default case
                })
                .map((comment) => (
                  // Ensure comment has _id before rendering
                  comment._id ? <Comment key={comment._id} comment={comment} onVote={handleVote} /> : null
              ))}
              </div>
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
              <p className="mb-2">{pollInfo.canAddOptions ? 'Adding options is enabled' : 'Adding options is disabled'}</p>
              <p className="mb-1">Voting begins: {formatDate(pollInfo.votingBegins)}</p>
              <p className="mb-1">Voting ends: {formatDate(pollInfo.votingEnds)}</p>
              <p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Time remaining for Discussion:</h3>
              <p className="mb-1">{timeRemaining.days} days</p>
              <p className="mb-1">{timeRemaining.hours} hours</p>
              <p className="mb-4">{timeRemaining.minutes} minutes</p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Time remaining for Voting:</h3>
              {!votingTimeRemaining.hasStarted ?
                ( <p>Voting hasn't started yet.</p> )
                : votingTimeRemaining.hasEnded ?
                ( <p>Voting has ended.</p> )
                : ( <p>Voting is in progress.</p> )
              }
            </div>

            <div>
              <button
                className={`flex items-center ${
                  !votingTimeRemaining.hasStarted || votingTimeRemaining.hasEnded
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } rounded px-4 py-2 w-full justify-center`}
                disabled={!votingTimeRemaining.hasStarted || votingTimeRemaining.hasEnded}
                onClick={() => navigate(`/rooms/${roomId}/vote?user=${userId}`)} // Pass userId
              >
                Go to Voting <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DiscussionRoom;