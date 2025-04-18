import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, Filter, ArrowRight, Plus } from 'react-feather';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Comment from '../components/Comment';

function DiscussionRoom() {
  // Get room ID from URL params
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse user token from URL if present
  const queryParams = new URLSearchParams(location.search);
  const userToken = queryParams.get('token');
  
  // State for user data
  const [nickname, setNickname] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchComment, setSearchComment] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState('');
  const [sortType, setSortType] = useState('Recent'); // or 'Most Votes', 'Oldest'
  
  // Poll info
  const [pollInfo, setPollInfo] = useState(null);
  
  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ hasStarted: false, hasEnded: false });
  
  // Generate or retrieve nickname on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: room } = await axios.get(`/api/rooms/${roomId}`);
        setQuestion(room.title);
        setPollInfo({
          canAddOptions: room.canAddOption,
          votingBegins: new Date(room.votingStart),
          votingEnds:    new Date(room.votingEnd),
          votesEditableUntil: new Date(room.editVoteUntil),
          discussionEnds:     new Date(room.discussionEnd),
        });  
        const [optRes, comRes] = await Promise.all([
          axios.get(`/api/options?room=${roomId}`),
          axios.get(`/api/comments?room=${roomId}`)
        ]);
        setOptions(optRes.data);
        setComments(comRes.data);
      } catch (err) {
        console.error('Error fetching:', err);
      }
    };
    fetchData();
    // nickname persistence
    const key = `room_${roomId}_nickname`;
    const stored = localStorage.getItem(key);
    if (stored) setNickname(stored);
    else {
      const newNick = `user${1000 + Math.floor(Math.random()*9000)}`;
      setNickname(newNick);
      localStorage.setItem(key, newNick);
    }  
    const timer = setInterval(updateTimeRemaining, 60000);
    updateTimeRemaining();
    return () => clearInterval(timer);
  }, [roomId]);
  
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
  
  // Format date to display
  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '') + ', ' + 
    date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const addOption = async () => {
    if (!newOption.trim() || !pollInfo.canAddOptions) return;
    try {
      const res = await axios.post('/api/options', {
        room: roomId,
        content: newOption
      });
      setOptions(prev => [...prev, res.data]);
      setNewOption('');
    } catch(e) {
      console.error(e);
    }
  };
  
  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post('/api/comments', {
        room: roomId,
        content: newComment,
        user: nickname,
        relatedOption: selectedOptionId || undefined,
        isPro: selectedOpinion === 'pro',
        isCon: selectedOpinion === 'con'
      });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setSelectedOptionId('');
      setSelectedOpinion('');
    } catch (e) {
      console.error(e);
    }
  };  
  
  
  // Calculate time ago for comments
  const timeAgo = (date) => {
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else {
      return `${diffInDays} days ago`;
    }
  };

  const handleVote = async (commentId, type) => {
    try {
      const res = await axios.post(`/api/comments/${commentId}/${type}`);
      setComments(prev =>
        prev.map(c => (c._id === commentId ? res.data : c))
      );
    } catch (err) {
      console.error(err);
    }
  };  

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
                {pollInfo.canAddOptions && (
                  <div className="flex items-center">
                    <span className="mr-2">Add Option</span>
                    <button 
                      className="bg-[#3395ff] text-white rounded-full w-6 h-6 flex items-center justify-center"
                      onClick={() => document.getElementById('option-input').focus()}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {options.map(o => (
                  <span key={o._id} className="bg-[#3395ff] text-white rounded-full px-3 py-1 flex items-center">
                    {o.content} ({o.numberOfVotes})
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
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-500"
                  placeholder={`Comment as user#${nickname.replace('user', '')}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
              </div>
              
              <div className="flex mb-4">
                <div className="mr-2">
                  <select
                    className="border rounded p-2"
                    value={selectedOptionId}
                    onChange={(e) => setSelectedOptionId(e.target.value)}
                  >
                    <option value="">Option</option>
                    {options.map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.content}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    className="border rounded p-2"
                    value={selectedOpinion}
                    onChange={(e) => setSelectedOpinion(e.target.value)}
                  >
                    <option value="">Opinion</option>
                    <option value="pro">Pro</option>
                    <option value="con">Con</option>
                  </select>
                </div>
                <div className="ml-auto">
                  <button 
                    className="bg-[#3395ff] text-white rounded px-4 py-2"
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
              {[...comments]
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
                    return (b.votes || 0) - (a.votes || 0);
                  }
                  return 0;
                })
                .map((comment) => (
                  <Comment key={comment._id} comment={comment} onVote={handleVote} />
              ))}
              </div>
            </div>
          </div>

          {/* Right Section - Info */}
          <div className="w-full md:w-1/3 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Welcome, {nickname}</h3>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
              <p className="mb-2">{pollInfo.canAddOptions ? 'You can add options' : 'Adding options is disabled'}</p>
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
              {!votingTimeRemaining.hasStarted ? (
                <p>Voting hasn't started yet.</p>
              ) : votingTimeRemaining.hasEnded ? (
                <p>Voting has ended.</p>
              ) : (
                <p>Voting is in progress.</p>
              )}
            </div>
            
            <div>
            <button onClick={() =>
              navigate(`/rooms/${roomId}/vote?token=${userToken}`)
            }>
              Go to Voting <ArrowRight className="ml-2"/>
            </button>
              {/*
              <button className="flex items-center bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-gray-700">
                Go to Voting <ArrowRight size={16} className="ml-2" />
              </button>
              */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DiscussionRoom;