import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, Filter, ArrowRight, Plus } from 'react-feather';
import { useParams, useLocation } from 'react-router-dom';

function DiscussionRoom() {
  // Get room ID from URL params
  const { roomId } = useParams();
  const location = useLocation();
  
  // Parse user token from URL if present
  const queryParams = new URLSearchParams(location.search);
  const userToken = queryParams.get('token');
  
  // State for user data
  const [nickname, setNickname] = useState('');
  const [question, setQuestion] = useState('We are planning to paint all the walls of the office! What should be the new color?');
  const [options, setOptions] = useState([
    { id: 1, text: 'Blue', votes: 10 },
    { id: 2, text: 'Blue', votes: 10 },
    { id: 3, text: 'Blue', votes: 10 },
    { id: 4, text: 'Blue', votes: 10 },
    { id: 5, text: 'Blue', votes: 10 },
    { id: 6, text: 'Blue', votes: 10 },
    { id: 7, text: 'Blue', votes: 10 },
    { id: 8, text: 'Blue', votes: 10 },
    { id: 9, text: 'Blue', votes: 10 },
    { id: 10, text: 'Orangensaftgeschmack', votes: 10 },
    { id: 11, text: 'Blue', votes: 10 },
  ]);
  const [newOption, setNewOption] = useState('');
  const [comments, setComments] = useState([
    { 
      id: 1, 
      user: 'User#4191', 
      text: 'Totam itaque voluptate ut. Est et similique provident repellendus. Dolore consequatur eius maxime.',
      tags: ['pro', 'orange'],
      votes: 276,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    { 
      id: 2, 
      user: 'User#4191', 
      text: 'Totam itaque voluptate ut. Est et similique provident repellendus. Dolore consequatur eius maxime.',
      tags: ['pro', 'orange'],
      votes: 276,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [searchComment, setSearchComment] = useState('');
  
  // Poll info
  const [pollInfo, setPollInfo] = useState({
    canAddOptions: true,
    votingBegins: new Date('2025-03-18T10:00:00'),
    votingEnds: new Date('2025-03-22T23:59:00'),
    votesEditableUntil: new Date('2025-03-22T10:00:00'),
    discussionEnds: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 30 * 60 * 1000)
  });
  
  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ hasStarted: false, hasEnded: false });
  
  // Generate or retrieve nickname on component mount
  useEffect(() => {
    // Check if user already has a nickname stored for this room
    const storedNickname = localStorage.getItem(`room_${roomId}_nickname`);
    
    if (storedNickname) {
      // Use existing nickname
      setNickname(storedNickname);
    } else {
      // Generate a new nickname (in a real app, this would come from the backend)
      const newNickname = `user${Math.floor(1000 + Math.random() * 9000)}`;
      setNickname(newNickname);
      
      // Store the nickname in localStorage for persistence
      localStorage.setItem(`room_${roomId}_nickname`, newNickname);
    }
    
    // In a real app, we would make an API call here to:
    // 1. Validate the user token
    // 2. Get the room data (question, options, comments)
    // 3. Get or generate the user's nickname
    
    // Set up timer to update time remaining
    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 60000); // Update every minute
    
    // Initial update
    updateTimeRemaining();
    
    return () => clearInterval(timer);
  }, [roomId, userToken]);
  
  // Update time remaining calculations
  const updateTimeRemaining = () => {
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
  
  // Add a new option
  const addOption = () => {
    if (newOption.trim() && pollInfo.canAddOptions) {
      const newId = options.length > 0 ? Math.max(...options.map(o => o.id)) + 1 : 1;
      setOptions([...options, { id: newId, text: newOption, votes: 0 }]);
      setNewOption('');
      
      // In a real app, we would make an API call to add the option to the backend
    }
  };
  
  // Add a new comment
  const addComment = () => {
    if (newComment.trim()) {
      const newId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1;
      setComments([
        ...comments, 
        { 
          id: newId, 
          user: nickname, 
          text: newComment,
          tags: [],
          votes: 0,
          timestamp: new Date()
        }
      ]);
      setNewComment('');
      
      // In a real app, we would make an API call to add the comment to the backend
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
                {options.map((option) => (
                  <div key={option.id} className="bg-[#3395ff] text-white rounded-full px-3 py-1 flex items-center">
                    {option.text} ({option.votes})
                  </div>
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
                  <select className="border rounded p-2">
                    <option>Option</option>
                  </select>
                </div>
                <div>
                  <select className="border rounded p-2">
                    <option>Opinion</option>
                  </select>
                </div>
                <div className="ml-auto">
                  <button className="bg-[#3395ff] text-white rounded px-4 py-2">
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
                  <select className="border rounded p-2">
                    <option>Recent</option>
                    <option>Most Votes</option>
                    <option>Oldest</option>
                  </select>
                </div>
              </div>
              
              {/* Comment List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold mr-2">{comment.user}</span>
                      {comment.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1 mr-1">
                          {tag}
                        </span>
                      ))}
                      <span className="ml-auto text-gray-500 text-sm">
                        {timeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p className="mb-2">{comment.text}</p>
                    <div className="flex items-center text-gray-500">
                      <button className="mr-1">
                        <ThumbsUp size={16} />
                      </button>
                      <button className="mr-2">
                        <ThumbsDown size={16} />
                      </button>
                      <span>{comment.votes} votes</span>
                    </div>
                  </div>
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
              <button className="flex items-center bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-gray-700">
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