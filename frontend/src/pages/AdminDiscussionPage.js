// src/pages/AdminDiscussionPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Plus, Search, Filter, Trash } from 'react-feather';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import axios from 'axios';
import Comment from '../components/Comment';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDiscussionPage() {
	const { roomId } = useParams();
	const location = useLocation();
  const navigate = useNavigate();
	const queryParams = new URLSearchParams(location.search);
	const userId = queryParams.get('user');
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!userId) {
      console.warn("No user ID found in URL query parameter '?user='");
      return;
    }
    axios.get(`/api/users/${userId}`)
      .then(res => {
        setUser(res.data);
      })
      .catch(err => {
        console.error("Error fetching username:", err);
      });
  }, [userId]);

	// State for options
	const [options, setOptions] = useState([]);
	const [newOption, setNewOption] = useState('');

	// State for users in the room
	const [usersInRoom, setUsersInRoom] = useState([]);

	// State for watchlisted users (no longer needed directly, but might be useful)
	const [watchlistedUsers, setWatchlistedUsers] = useState([]);
	const [newWatchlistUser, setNewWatchlistUser] = useState('');

	// State for date/time pickers
	const [discussionStartDate, setDiscussionStartDate] = useState(null);
	const [discussionEndDate, setDiscussionEndDate] = useState(null);
	const [votingStartDate, setVotingStartDate] = useState(null);
	const [votingEndDate, setVotingEndDate] = useState(null);
	const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [activeDatePicker, setActiveDatePicker] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [minOptionsPerVote, setMinOptionsPerVote] = useState('Select');
  const [maxOptionsPerVote, setMaxOptionsPerVote] = useState('Select');

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

	const [watchlistError, setWatchlistError] = useState('');
  const [nonVotersCount, setNonVotersCount] = useState(0);
	const [nonVoterIds, setNonVoterIds] = useState([]);
	const [isSending, setIsSending] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// 1) Load the room metadata
        if (!userId) {
          console.warn("No user ID found in URL query parameter '?user='");
          navigate('/error'); // Or some other appropriate redirection
          return;
        }
        
        // Check if the room exists and if the user is part of it
				const { data: room } = await axios.get(`/api/rooms/${roomId}`);
        if (userId && !room.userList.includes(userId))  {
          console.warn(`User ID ${userId} not found in room ${roomId}'s userList. Redirecting to error page.`);
          navigate('/error');
          return; // Stop further execution
        }

        // Fetch the user details to check if they are an admin
        const userRes = await axios.get(`/api/users/${userId}`);
        const currentUser = userRes.data;
        setUser(currentUser); // Make sure this state is updated

        if (!currentUser.isAdmin) {
          console.warn(`User ID ${userId} not found in room ${roomId}'s userList. Redirecting to error page.`);
          navigate('/error');
          return; // Stop further ex
        }
				// 2) Parse & set all your date fields
        setDiscussionStartDate(room.discussionStart ? new Date(room.discussionStart) : null);
				setDiscussionEndDate(room.discussionEnd ? new Date(room.discussionEnd) : null);
				setVotingStartDate(room.votingStart ? new Date(room.votingStart) : null);
				setVotingEndDate(room.votingEnd ? new Date(room.votingEnd) : null);
				setChangeVoteUntilDate(room.editVoteUntil ? new Date(room.editVoteUntil) : null);
        setMaxOptionsPerVote(room.maxOptionsPerVote===Number.MAX_SAFE_INTEGER ? 'no-limit' : room.maxOptionsPerVote);
        setMinOptionsPerVote(room.minOptionsPerVote===0 ? 'no-limit' : room.minOptionsPerVote);

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

				const votePromises = userIds.map(uid =>
        	axios.get(`/api/votes?room=${roomId}&user=${uid}`)
      	);

				const votesRes = await Promise.all(votePromises);
      	const notVotedCount = votesRes.filter(r => r.data.length === 0).length;
      	setNonVotersCount(notVotedCount);

				const nonVoters = userIds.filter((_, i) => votesRes[i].data.length === 0);
				console.log(nonVoters);
				setNonVoterIds(nonVoters);
				console.log(nonVoterIds);

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
				room: roomId,
				content: newOption,
				user: userId
			});

			await axios.put(`/api/rooms/${roomId}`, {
				options: [...options, createdOption._id]
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
			// ASK if the host is sure to delete 
			if (!window.confirm('Are you sure you want to delete this option? All comments related to this option will also be deleted.')) {
				return; // Exit if user cancels
			}
			const deleteResponse = await axios.delete(`/api/options/${optionId}`);
			const commentsToDelete = await axios.get(`/api/comments?relatedOption=${optionId}`);
			await Promise.all(commentsToDelete.data.map(c => axios.delete(`/api/comments/${c._id}`)));

			if (deleteResponse.status !== 200) {
				console.error('Failed to delete option from database');
				alert('Failed to remove option. Server error.');
				return; // Stop, and do not update UI
			}
			const updatedOptions = options.filter(option => option._id !== optionId);
			const updatedComments = comments.filter(comment => comment.relatedOption !== optionId);
			const roomUpdateResponse = await axios.put(`/api/rooms/${roomId}`, {
				options: updatedOptions.map(option => option._id)
			});
			if (roomUpdateResponse.status !== 200) {
				console.error('Failed to update room options');
				alert('Failed to remove option from room.');
				return;
			}
			setOptions(updatedOptions);
			setComments(updatedComments);            
		} catch (error) {
			console.error('Error removing option:', error);
			alert('Error removing option. Check console for details.');
		}
	};

	// Add user to watchlist
	const addToWatchlist = async () => {
		const username = newWatchlistUser.trim();
		if (!username) return;

		// 1) find that user in this room
		const user = usersInRoom.find(u => u.username === username);
		if (!user) {
			setWatchlistError(`User "${username}" not found in this room.`);
			return;
		}
		if (user.isWatchlisted) {
			setWatchlistError(`"${username}" is already on the watchlist.`);
			return;
		}

		// 2) build new list & PATCH room.watchlist
		try {
			await axios.put(`/api/users/${user._id}`, { isWatchlisted: true });
			setWatchlistedUsers(prev => [...prev, user._id]);
			setNewWatchlistUser('');
			setWatchlistError('');
			 const updatedUsers = await Promise.all(
				usersInRoom.map(u => axios.get(`/api/users/${u._id}`).then(res => res.data))
			);
			setUsersInRoom(updatedUsers);
		} catch (err) {
			console.error('Failed to update watchlist:', err);
			alert('Server error. Please try again.'); // consistent error message
		}
	};

	// Remove user from watchlist
	const removeFromWatchlist = async (userIdToRemove) => {
	   const userToRemove = usersInRoom.find(u => u._id === userIdToRemove);
		if (!userToRemove) {
			console.error("User to remove from watchlist not found.");
			return; // Exit if user not found
		}

		try {
			await axios.put(`/api/users/${userIdToRemove}`, { isWatchlisted: false });
			const updated = watchlistedUsers.filter(id => id !== userIdToRemove);
			setWatchlistedUsers(updated);
			 const updatedUsers = await Promise.all(
				usersInRoom.map(u => axios.get(`/api/users/${u._id}`).then(res => res.data))
			);
			setUsersInRoom(updatedUsers);
		} catch (err) {
			console.error('Failed to remove from watchlist:', err);
			alert('Failed to remove user from watchlist.');
		}
	};

	// Handle date/time changes
	const handleDateTimeChange = (date, type) => {
		switch (type) {
			case 'discussion-start':
				setDiscussionStartDate(date);
				break;
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
    if(isAnyDateMissing || isVotingTimeInvalid || isChangeVoteTimeInvalid || isDropdownInvalid || isOptionsPerVoteInvalid) {
      setShowModal(false);
    } else {
      setShowModal(true);
    }
  }
  const handleConfirm = async () => {
    setShowModal(false);
		try {
			const payload = {
				// match your backend property names exactly:
				discussionStart: discussionStartDate ? discussionStartDate.toISOString() : null,
				discussionEnd: discussionEndDate ? discussionEndDate.toISOString() : null,
				votingStart: votingStartDate ? votingStartDate.toISOString() : null,
				votingEnd: votingEndDate ? votingEndDate.toISOString() : null,
				editVoteUntil: changeVoteUntilDate ? changeVoteUntilDate.toISOString() : null,
				canAddOption: allowNewOptions === 'yes',
				canEditVote: allowVoteChange === 'yes',
        minOptionsPerVote: minOptionsPerVote === 'no-limit' ? 0 : parseInt(minOptionsPerVote, 10),
        maxOptionsPerVote: maxOptionsPerVote === 'no-limit' ? Number.MAX_SAFE_INTEGER : parseInt(maxOptionsPerVote, 10),
			};
			await axios.put(`/api/rooms/${roomId}`, payload);
			// Optionally give feedback
			alert('Settings updated successfully.');
		} catch (err) {
			console.error('Failed to update settings:', err);
			alert('Could not update settings. See console for details.');
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
			const userResponse = await axios.get(`/api/users/${userId}`);
			const user = userResponse.data;
			const res = await axios.post('/api/comments', {
				room: roomId,
				content: newComment,
				user: userId,
				relatedOption: selectedOptionId || undefined,
				isPro: selectedOpinion === 'pro',
				isCon: selectedOpinion === 'con',
				isWatchlisted: user.isWatchlisted
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

	const handleApproveComment = async (commentId) => {
		try {
			await axios.put(`/api/comments/${commentId}`, { isWatchlisted: false });
			fetchComments(); // Refresh comments to update the list
		} catch (error) {
			console.error("Failed to approve comment:", error);
			alert("Failed to approve comment.");
		}
	};

	const handleRejectComment = async (commentId) => {
		 try {
			await axios.delete(`/api/comments/${commentId}`);
			fetchComments();
		} catch (error) {
			console.error("Failed to reject comment:", error);
			alert("Failed to reject the comment");
		}
	};

	  const handleApproveOption = async (optionId) => {
		try {
			await axios.put(`/api/options/${optionId}`, { isWatchlisted: false });
			 const { data: opts } = await axios.get(`/api/options?room=${roomId}`);
			setOptions(opts);
		} catch (error) {
			console.error("Failed to approve option:", error);
			alert("Failed to approve the option");
		}
	};

	const handleRejectOption = async (optionId) => {
		try {
			await axios.delete(`/api/options/${optionId}`);
			 const { data: opts } = await axios.get(`/api/options?room=${roomId}`);
			setOptions(opts);
		} catch (error) {
			console.error("Failed to reject option:", error);
			alert("Failed to reject the option");
		}
	};

	const handleDeleteComment = async (commentId) => {
		if (!window.confirm('Are you sure you want to delete this comment?')) return;
		try {
		await axios.delete(`/api/comments/${commentId}`);
		fetchComments();
		} catch (err) {
		console.error('Failed to delete comment:', err);
		alert('Failed to delete comment.');
		}
	};


	// handler for the “send email” button
	const sendReminderEmails = async () => {
		console.log('About to remind:', nonVoterIds);
		console.log('Count:', nonVotersCount);
		if (nonVotersCount === 0) return;
		setIsSending(true);
		console.log("isSending");
		try {
			await axios.post(
				`/api/rooms/${roomId}/remind`,
				{ userIds: nonVoterIds }
			);
			alert(`Reminder emails sent to ${nonVotersCount} users.`);
		} catch (err) {
			console.error(err);
			alert('Failed to send reminder emails.');
		}
		setIsSending(false);
	};

  const ConfirmationModal = () => {
      if (!showModal) return null;
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
  
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Confirmation</h3>
              <p className="mb-6">Are you sure that you want to update the room settings with the given features?</p>
  
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  No
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-[#3395ff] text-white rounded hover:bg-[#2980e4]"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
  const isAnyDateMissing = !discussionStartDate || !discussionEndDate || !votingStartDate || !votingEndDate || (allowVoteChange==='yes' && !changeVoteUntilDate);
  const isDiscussionTimeInvalid = discussionStartDate && discussionEndDate && discussionStartDate >= discussionEndDate;
  const isVotingTimeInvalid = votingStartDate && votingEndDate && votingStartDate >= votingEndDate;
  const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && changeVoteUntilDate && votingEndDate && votingStartDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);
  const isDropdownInvalid = minOptionsPerVote === 'Select' || maxOptionsPerVote === 'Select' || allowVoteChange === 'select' || allowNewOptions === 'select';
  const isOptionsPerVoteInvalid = minOptionsPerVote && maxOptionsPerVote && parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10);


	return (
		<div className="flex-grow flex flex-col">
			{/* Header */}
			<header className="bg-[#3395ff] py-16 text-center">
				<h1 className="text-white text-4xl font-bold">Discussing Page - Discuss&Vote - Admin Panel {console.log(minOptionsPerVote, maxOptionsPerVote , parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10))}</h1>
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
								{options.map((option) => ( !option.isWatchlisted && 
									<div key={option._id} className={`rounded-full px-3 py-1 flex items-center bg-blue-500 text-white`}>
										{option.content}
										<button className="ml-2 text-white" onClick={() => removeOption(option._id)}>
											<X size={14} />
										</button>
									</div>
								))}
							</div>
						</div>

						{/* Date and Time Selectors */}
						<div className="space-y-4 relative">
							<DateTimePicker
								label="Discussion starts at:"
								selectedDate={discussionStartDate}
								onChange={(date) => handleDateTimeChange(date, 'discussion-start')}
								id="discussion-start"
							/>

              <DateTimePicker
								label="Discussion ends at:"
								selectedDate={discussionEndDate}
								onChange={(date) => handleDateTimeChange(date, 'discussion-end')}
								id="discussion-end"
							/>
              {isVotingTimeInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Voting start time must be before the end time.</p>
              )}

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
              {isVotingTimeInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Voting end time must be after voting start time.</p>
              )}

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
              {isChangeVoteTimeInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Vote change time must be between voting start and end times.</p>
              )}

              <div className="flex items-center">
                <label className="w-64 font-medium">Min options per vote: *</label>
                <select
                  className={`border rounded px-3 py-1 w-31 transition-colors duration-200 ${minOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={minOptionsPerVote}
                  onChange={(e) => setMinOptionsPerVote(e.target.value)}
                >
                  <option value="no-limit">No limit</option>
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                     <option key={i+1} value={i+1}>{i+1}</option>
                   ) // TODO: instead of number of options, do like 10-20~
                   } 
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Max options per vote: *</label>
                 <select
                  className={`border rounded px-3 py-1 w-31 transition-colors duration-200 ${maxOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={maxOptionsPerVote}
                  onChange={(e) => setMaxOptionsPerVote(e.target.value)}
                >
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                     <option key={i+1} value={i+1}>{i+1}</option>
                   )}
                  <option value="no-limit">No Limit</option>
                </select>
              </div>
              {isOptionsPerVoteInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Min options per vote must be less than or equal to max.</p>
              )}

							<button onClick={updateRoomSettings} className="bg-blue-500 text-white rounded px-4 py-2">
								Update Settings
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
										{options
											.filter(o => !o.isWatchlisted)
											.map(o => (<option key={o._id} value={o._id}>{o.content}</option>))
										}
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
											if (sortType === 'Recent') return new Date(b.createdAt) - new Date(a.createdAt);
											if (sortType === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
											if (sortType === 'Most Votes') {
												return (b.votes || 0) - (a.votes || 0);
											}
											return 0;
										})
										.filter(c => !c.isWatchlisted)
										.map(c => {
											return (
											<div key={c._id} className="relative border-b pb-4">
												<button
													className="absolute top-8 right-0 text-red-500 hover:text-red-700"
													onClick={() => handleDeleteComment(c._id)}
													title="Delete comment"
												>
													<Trash size={16} />
												</button>
												<Comment  comment={c} onVote={() => { }} />
											</div>
											)
										})}
								</div>
							</div>
							{/* ──────────────────────────────────── */}
						</div>
					</div>

					{/* Right Section - User Management */}
					<div className="w-full md:w-1/3 p-8">
            <button 
              onClick={() => navigate(`/rooms/${roomId}?user=${userId}`)}
              className="bg-[#1E4A8B] text-white rounded px-4 py-2 mb-8 w-full text-center"  // Changed from bg-navy-blue to #003366
                  >
                    Go Back to the Poll
            </button>
						<div className="mb-8">
							<h3 className="text-xl font-bold mb-4">Users:</h3>
							<ul className="list-disc pl-5 mb-6">
								{usersInRoom.map(user => {
									if (user._id === userId) {
										// Prefer username if you have it; otherwise take email before @
										const name = user.username
											? user.username
											: user.email.split('@')[0];
										return <li key={user._id}>You ({name})</li>;
									}
									return <li key={user._id}>{user.email}</li>;
								})}
							</ul>
						</div>

						{/* Users who have not voted */}
						<h3 className="text-xl font-bold mb-4">
        			Users yet to vote: <strong>{nonVotersCount}</strong>
      			</h3>

						<button
							onClick={sendReminderEmails}
							disabled={nonVotersCount === 0 || isSending}
							className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
						>
							{isSending
								? 'Sending…'
								: nonVotersCount === 0
									? 'No one to remind'
									: `Remind ${nonVotersCount} non-voters`}
						</button>

						{/* Watchlist Management */}
						<div className="mb-8">
						  <h3 className="text-xl font-bold mb-4">Manage Watchlist:</h3>
						  <div className="flex flex-wrap gap-2 mb-2">
							  {usersInRoom
								  .filter(user => user.isWatchlisted)
								  .map(user => (
									  <div
										  key={user._id}
										  className="bg-red-200 text-red-700 rounded-full px-3 py-1 flex items-center"
									  >
										  {user.username}
										  <button
											  className="ml-2"
											  onClick={() => removeFromWatchlist(user._id)}
										  >
											  <X size={14} />
										  </button>
									  </div>
								  ))}
						  </div>

						  <div className="flex items-center mb-4">
							  <input
								  type="text"
								  placeholder="Enter username..."
								  className="border rounded px-3 py-1 text-sm flex-grow mr-2 "
								  value={newWatchlistUser}
								  onChange={e => setNewWatchlistUser(e.target.value)}
								  onKeyPress={e => e.key === 'Enter' && addToWatchlist()}
							  />
							  <button
								  onClick={addToWatchlist}
								  className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
								  <Plus size={14} />
							  </button>
						  </div> 
						</div>
						<div className="mb-8">             
						  <div className="flex flex-wrap items-center mb-4">
							<h4 className="text-xl font-bold">Watchlisted Options:</h4>
							<div className="flex flex-wrap gap-2 ml-4 mb-2">
								{options
									.filter(option => option.isWatchlisted)
									.map(option => (
										<div
											key={option._id}
											className="bg-blue-500 text-white rounded-full px-3 py-1 flex items-center"
										>
										  {option.content}                                         
										  <>
											  <button className="ml-2 text-[#8CC8EA] hover:text-white" onClick={() => handleApproveOption(option._id)}>Approve</button>
											  <button className="ml-2 text-[#8CC8EA] hover:text-white" onClick={() => handleRejectOption(option._id)}>Reject</button>
										  </>
									</div>
									))}
							</div>
						  </div>
						</div>
						<div className="mb-8">             
						  <div className="flex flex-wrap items-center mb-4">
							<h4 className="text-xl font-bold">Watchlisted Comments:</h4>
							<div className="flex flex-wrap gap-2 ml-4 mb-2">
							  {comments
								.filter(comment => comment.isWatchlisted)
								.map(comment => {
								  const MAX_COMMENT_LENGTH = 40; //TODO: adjust as needed
								  const shortComment = comment.content.length > MAX_COMMENT_LENGTH
									  ? comment.content.substring(0, MAX_COMMENT_LENGTH) + "..."
									  : comment.content;
								  return (
									<div
									  key={comment._id}
									  className="bg-[#8CC8EA] border-[#1E4A8B] rounded-md p-2 flex flex-col items-start"  // Changed to flex-col and items-start
									>
									  <p className="text-sm">
										  {comment.user.username} wants to comment:
									  </p>
									  <p
										  className="text-gray-800"
										  title={comment.content}  // Full comment on hover
									  >
										  {shortComment}
									  </p>
									  <div className="flex space-x-2 mt-1">
										  <button
											  onClick={() => handleApproveComment(comment._id)}
											  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
										  >
											  Approve
										  </button>
										  <button
											  onClick={() => handleRejectComment(comment._id)}
											  className="px-2 py-1 bg-red-500 text-white rounded text-xs"
										  >
											  Reject
										  </button>
									  </div>
									</div>
								  );
								})}
							</div>
						  </div>
						</div>

					</div>
				</div>
			</div>
      <ConfirmationModal />
		</div>
	);
}

export default AdminDiscussionPage;
