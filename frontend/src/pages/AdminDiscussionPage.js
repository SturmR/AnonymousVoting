// src/pages/AdminDiscussionPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Plus, Search, Filter } from 'react-feather';
import { useParams, useLocation} from 'react-router-dom';
import DatePicker from "react-datepicker";
import axios from 'axios';
import Comment from '../components/Comment';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDiscussionPage() {
  const { roomId } = useParams();
  const location   = useLocation();                             // ← new
  const queryParams = new URLSearchParams(location.search);      // ← new
  const userId      = queryParams.get('user');                  // ← new

  // State for options
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');

  // State for users in the room
  const [usersInRoom, setUsersInRoom] = useState([]);

  // State for watchlist users
  const [watchlistedUsers, setWatchlistedUsers] = useState([]);
  const [newWatchlistUser, setNewWatchlistUser] = useState('');

  // State for watchlist activity (keeping this for now)
  const [watchlistActivity, setWatchlistActivity] = useState([
    { user: 'user#4191', action: 'wants to add Option "Baby Blue"' },
    { user: 'user#4635', action: 'wants to comment "I believe green would be better"' },
    { user: 'user#4586', action: 'wants to comment "Well lets first agree that we need to change"' }
  ]);

  // State for date/time pickers
  const [discussionEndDate, setDiscussionEndDate] = useState(null);
  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  // State for "Allow" settings
  const [allowNewOptions, setAllowNewOptions] = useState('select');
  const [allowVoteChange, setAllowVoteChange] = useState('select');
  const [changeVoteUntil, setChangeVoteUntil] = useState(null);

  // State for comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchComment, setSearchComment] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState('');
  const [sortType, setSortType] = useState('Recent');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Load the room metadata
        const { data: room } = await axios.get(`/api/rooms/${roomId}`);

        // 2) Parse & set all your date fields
        setDiscussionEndDate(
          room.discussionEnd   ? new Date(room.discussionEnd)   : null
        );
        setVotingStartDate(
          room.votingStart     ? new Date(room.votingStart)     : null
        );
        setVotingEndDate(
          room.votingEnd       ? new Date(room.votingEnd)       : null
        );
        setChangeVoteUntilDate(
          room.editVoteUntil   ? new Date(room.editVoteUntil)   : null
        );

        // 3) Toggles & watchlist
        setAllowNewOptions(room.canAddOption ? 'yes' : 'no');
        setAllowVoteChange(room.canEditVote ? 'yes' : 'no');
        setWatchlistedUsers(room.watchlist || []);

        // 4) Fetch options for this room
        const { data: opts } = await axios.get(`/api/options?room=${roomId}`);
        setOptions(opts);

        // 5) Fetch exactly the users in room.userList
        const userIds = Array.isArray(room.userList) ? room.userList : [];
        if (userIds.length) {
          const userPromises = userIds.map(uid =>
            axios.get(`/api/users/${uid}`)
          );
          const usersResponses = await Promise.all(userPromises);
          const participants = usersResponses.map(r => r.data);
          setUsersInRoom(participants);
        } else {
          setUsersInRoom([]);
        }

      } catch (err) {
        console.error('Failed to fetch admin discussion data:', err);
        // Optionally set an error state here to show the user
      }
    };

    fetchData();

    axios.get(`/api/comments?room=${roomId}`)
        .then(res => setComments(res.data))
        .catch(err => console.error('Failed to load comments:', err));
  }, [roomId]);

  // Add a new option
  const addOption = async () => {
    // don’t do anything if the box is empty
    if (!newOption.trim()) return;

    try {
      // POST to the canonical options endpoint
      const { data: createdOption } = await axios.post('/api/options', {
        room:    roomId,
        content: newOption
      });

      // append to local state
      setOptions(prev => [...prev, createdOption]);
      setNewOption('');
    } catch (err) {
      console.error('Failed to add option:', err);
      alert('Could not add option. See console for details.');
    }
  };


  // Remove an option
  const removeOption = async (optionId) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/rooms/${roomId}/options/${optionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setOptions(options.filter(option => option._id !== optionId));
      } else {
        console.error('Failed to remove option');
      }
    } catch (error) {
      console.error('Error removing option:', error);
    }
  };

  // Add user to watchlist
  const addToWatchlist = () => {
    if (newWatchlistUser.trim() && !watchlistedUsers.includes(newWatchlistUser)) {
      // In a real scenario, you'd likely send this to the backend
      setWatchlistedUsers([...watchlistedUsers, newWatchlistUser]);
      setNewWatchlistUser('');
    }
  };

  // Remove user from watchlist
  const removeFromWatchlist = (userId) => {
    // In a real scenario, you'd likely send this to the backend
    setWatchlistedUsers(watchlistedUsers.filter(u => u !== userId));
  };

  // Handle date/time changes
  const handleDateTimeChange = (date, type) => {
    switch (type) {
      case 'discussion-end':
        setDiscussionEndDate(date);
        break;
      case 'voting-start':
        setVotingStartDate(date);
        break;
      case 'voting-end':
        setVotingEndDate(date);
        break;
      case 'change-vote-until':
        setChangeVoteUntilDate(date);
        break;
      default:
        break;
    }
  };

  // Update room settings
  const updateRoomSettings = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discussionEndDate,
          votingStartDate,
          votingEndDate,
          allowNewOptions: allowNewOptions === 'yes',
          allowVoteChange: allowVoteChange === 'yes',
          changeVoteUntil: changeVoteUntilDate,
        }),
      });
      if (!response.ok) {
        console.error('Failed to update room settings');
      }
    } catch (error) {
      console.error('Error updating room settings:', error);
    }
  };

  // Date/Time picker component (no changes needed here, the issue might be CSS related)
const DateTimePicker = ({ label, selectedDate, onChange, id, error }) => {
    // Function to filter available times to 10-minute intervals (XX:X0)
    const filterTime = (time) => {
      const minutes = time.getMinutes();
      return minutes % 10 === 0;
    };

    return (
      <div className="flex items-center mb-4">
        <label className="w-64 font-medium">{label}</label> {/* Increased width */}
        <div className="flex">
          <button
            type="button"
            className={`border p-2 mr-2 rounded hover:bg-gray-100 ${error ? 'border-red-500' : 'border-gray-300'}`}
            onClick={() => {
              setActiveDatePicker(activeDatePicker === id ? null : id);
            }}
          >
            <Calendar size={20} />
          </button>
          <button
            type="button"
            className={`border p-2 rounded hover:bg-gray-100 ${error ? 'border-red-500' : 'border-gray-300'}`}
            onClick={() => {
              setActiveDatePicker(activeDatePicker === `${id}-time` ? null : `${id}-time`);
            }}
          >
            <Clock size={20} />
          </button>

          {activeDatePicker === id && (
            <div className="absolute z-10 mt-10 bg-white shadow-lg border rounded"> {/* Added background and shadow */}
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  onChange(date);
                  setActiveDatePicker(null);
                 }}
                inline
                // calendarClassName="bg-white shadow-lg border rounded" // Removed as styles are applied to wrapper
              />
            </div>
          )}

          {activeDatePicker === `${id}-time` && (
            <div className="absolute z-10 mt-10 bg-white shadow-lg border rounded"> {/* Added background and shadow */}
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  onChange(date);
                  setActiveDatePicker(null);
                 }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={10}
                filterTime={filterTime}
                dateFormat="h:mm aa"
                inline
                // calendarClassName="bg-white shadow-lg border rounded" // Removed as styles are applied to wrapper
              />
            </div>
          )}
        </div>

        {selectedDate && (
          <div className="ml-4 text-sm">
            {selectedDate.toLocaleDateString()} {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    );
  };


  // Calculate users who haven't voted (requires knowing who has voted, adjust API accordingly)
  const usersNotVotedCount = usersInRoom.length; // Placeholder - you'll need to filter based on voting status

  const fetchComments = () => {
    axios.get(`/api/comments?room=${roomId}`)
      .then(r => setComments(r.data))
      .catch(console.error);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    if (!userId) {
      alert('No user ID found in URL. Please add `?user=<yourId>` to the query.');
      return;
    }

    try {
      await axios.post('/api/comments', {
        room: roomId,
        content: newComment,
        user: userId,                       // ← now defined
        relatedOption: selectedOptionId || undefined,
        isPro: selectedOpinion === 'pro',
        isCon: selectedOpinion === 'con'
      });
      setNewComment('');
      setSelectedOptionId('');
      setSelectedOpinion('');
      fetchComments();
    } catch (e) {
      console.error('Error posting comment:', e);
      alert('Failed to post comment: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="flex-grow flex flex-col">
      {/* Header */}
      <header className="bg-[#3395ff] py-16 text-center">
        <h1 className="text-white text-4xl font-bold">Discussing Page - Discuss&Vote - Admin Panel</h1>
      </header>

      <div className="flex-grow flex justify-center p-8">
        <div className="max-w-7xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
          {/* Left Section - Admin Controls */}
          <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
            {/* Options */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Options:</h3>
              <div className="flex items-center mb-4">
                <div className="flex border rounded mr-2">
                  <input
                    type="text"
                    className="px-3 py-1 focus:outline-none"
                    placeholder="Add Option..."
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
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {options.map((option) => (
                  <div key={option._id} className="bg-blue-500 text-white rounded-full px-3 py-1 flex items-center">
                    {option.content}
                    <button className="ml-2" onClick={() => removeOption(option._id)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Users who haven't voted */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Users who have not voted yet: {usersNotVotedCount}</h3>
              <button className="text-yellow-500 border border-yellow-500 rounded px-4 py-2">
                Send them a reminder e-mail
              </button>
            </div>

            {/* Date and Time Selectors */}
            <div className="space-y-4 relative">
              <DateTimePicker
                label="Discussion ends at:"
                selectedDate={discussionEndDate}
                onChange={(date) => handleDateTimeChange(date, 'discussion-end')}
                id="discussion-end"
              />

              <DateTimePicker
                label="Voting starts at:"
                selectedDate={votingStartDate}
                onChange={(date) => handleDateTimeChange(date, 'voting-start')}
                id="voting-start"
              />

              <DateTimePicker
                label="Voting ends at:"
                selectedDate={votingEndDate}
                onChange={(date) => handleDateTimeChange(date, 'voting-end')}
                id="voting-end"
              />

              {/* Dropdown Selectors */}
              <div className="flex items-center mb-4">
                <label className="w-64 font-medium">Allow Users to submit new Options?</label>
                <select
                  className="border rounded px-3 py-1 w-24"
                  value={allowNewOptions}
                  onChange={(e) => setAllowNewOptions(e.target.value)}
                >
                  <option value="select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center mb-4">
                <label className="w-64 font-medium">Allow Users to change their votes?</label>
                <select
                  className="border rounded px-3 py-1 w-24"
                  value={allowVoteChange}
                  onChange={(e) => setAllowVoteChange(e.target.value)}
                >
                  <option value="select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <DateTimePicker
                label="Allow users to change their vote until:"
                selectedDate={changeVoteUntilDate}
                onChange={(date) => handleDateTimeChange(date, 'change-vote-until')}
                id="change-vote-until"
              />

              <button onClick={updateRoomSettings} className="bg-blue-500 text-white rounded px-4 py-2">
                Update Room Settings
              </button>

              {/* ─────── COMMENTS SECTION ─────── */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-4">Comments</h3>

                {/* New Comment Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addComment()}
                  />
                </div>
         
                {/* Option & Opinion Selectors + Post Button */}
                <div className="flex items-center mb-6">
                  <select
                    className="border rounded p-2 mr-2"
                    value={selectedOptionId}
                    onChange={e => setSelectedOptionId(e.target.value)}
                  >
                    <option value="">Relate to Option (Optional)</option>
                    {options.map(o => (
                      <option key={o._id} value={o._id}>{o.content}</option>
                    ))}
                  </select>
                  <select
                    className="border rounded p-2 mr-4"
                    value={selectedOpinion}
                    onChange={e => setSelectedOpinion(e.target.value)}
                  >
                    <option value="">Opinion (Optional)</option>
                    <option value="pro">Pro</option>
                    <option value="con">Con</option>
                  </select>
                  <button
                    className="bg-blue-500 text-white rounded px-4 py-2"
                    onClick={addComment}
                  >
                    Post
                  </button>
                </div>

                {/* Search & Sort */}
                <div className="flex mb-6 items-center">
                  <div className="relative flex-grow mr-4">
                    <input
                      type="text"
                      className="w-full border rounded p-2 pl-10"
                      placeholder="Search for comments"
                      value={searchComment}
                      onChange={e => setSearchComment(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search size={18} />
                    </div>
                  </div>
                  <Filter className="mr-2" />
                  <select
                    className="border rounded p-2"
                    value={sortType}
                    onChange={e => setSortType(e.target.value)}
                  >
                    <option value="Recent">Recent</option>
                    <option value="Most Votes">Most Votes</option>
                    <option value="Oldest">Oldest</option>
                  </select>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                  {[...comments]
                    .filter(c =>
                      c.content.toLowerCase().includes(searchComment.toLowerCase()) ||
                      (c.relatedOption?.content || '').toLowerCase().includes(searchComment.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (sortType === 'Recent')   return new Date(b.createdAt) - new Date(a.createdAt);
                      if (sortType === 'Oldest')   return new Date(a.createdAt) - new Date(b.createdAt);
                      if (sortType === 'Most Votes') {
                        return (b.votes || 0) - (a.votes || 0);
                      }
                      return 0;
                    })
                    .map(c => (
                      <Comment key={c._id} comment={c} onVote={() => {/* optionally wire voting */}} />
                    ))
                  }
                </div>
              </div>
              {/* ──────────────────────────────────── */}
            </div>
          </div>

          {/* Right Section - User Management */}
          <div className="w-full md:w-1/3 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Users:</h3>
              <ul className="list-disc pl-5 mb-6">
                {usersInRoom.map((user) => (
                  <li key={user._id}>{user.email}</li>
                ))}
              </ul>
            </div>

            {/* Watchlist Management */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Manage Watchlist:</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {watchlistedUsers.map((userId) => {
                  const user = usersInRoom.find(u => u._id === userId);
                  return user ? (
                    <div key={userId} className="bg-red-200 text-red-700 rounded-full px-3 py-1 flex items-center">
                      {user.email} {/* Or some other identifier */}
                      <button className="ml-2" onClick={() => removeFromWatchlist(userId)}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="flex items-center mb-6">
                <input
                  type="text"
                  placeholder="Add User ID to Watchlist"
                  className="border rounded px-3 py-1 text-sm flex-grow mr-2"
                  value={newWatchlistUser}
                  onChange={(e) => setNewWatchlistUser(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                />
                <button onClick={addToWatchlist} className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Watchlist Activity */}
            <div>
              <h3 className="text-xl font-bold mb-4">Review Watchlist Activity:</h3>
              <div className="space-y-2">
                {watchlistActivity.map((activity, index) => (
                  <div key={index} className="border border-blue-500 text-blue-500 rounded-full px-4 py-2 text-sm">
                    {activity.user} {activity.action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDiscussionPage;