// src/pages/AdminPickATimePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, X } from 'react-feather';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import axios from 'axios';
import classnames from 'classnames';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminPickATimePage() {
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

  const [options, setOptions] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [minOptionsPerVote, setMinOptionsPerVote] = useState('Select');
  const [maxOptionsPerVote, setMaxOptionsPerVote] = useState('Select');
  const [usersNotVotedYet, setUsersNotVotedYet] = useState([]);
  const [allowVoteChange, setAllowVoteChange] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setVotingEndDate(room.votingEnd ? new Date(room.votingEnd) : null);
        setChangeVoteUntilDate(room.editVoteUntil ? new Date(room.editVoteUntil) : null);
        setMinOptionsPerVote(room.minOptionsPerVote ? room.minOptionsPerVote : 'Select');
        setMaxOptionsPerVote(room.maxOptionsPerVote ? room.maxOptionsPerVote : 'Select');
        setAllowVoteChange(room.canEditVote ? 'yes' : 'no');

        const { data: opts } = await axios.get(`/api/options?room=${roomId}`);
        setOptions(opts);
        setLoading(false);
        const userIds = Array.isArray(room.userList) ? room.userList : [];
        if (userIds.length) {
          const userPromises = userIds.map(userId => axios.get(`/api/users/${userId}`));
          const userResponses = await Promise.all(userPromises);
          const participants = userResponses.map(response => response.data);
          setUsersInRoom(participants);
          const votePromises = userIds.map(userId => axios.get(`/api/votes?user=${userId}&room=${roomId}`));
          const voteResponses = await Promise.all(votePromises);
          const usersNotVoted = userIds.filter((userId, index) => {
            const userVote = voteResponses[index].data;
            return !userVote || userVote.length === 0;
          });
          setUsersNotVotedYet(usersNotVoted);
        }
        else {
          setUsersInRoom([]);
          setUsersNotVotedYet([]);
        }
      } catch (error) {
        setLoading(false);
        console.error('Error fetching room data:', error);
      }
    };
    fetchData();
  }, [roomId]);

  const toggleOption = async (optionId) => {
    try {
      console.log('Toggling option:', optionId);
      const option = options.find(opt => opt._id === optionId);
      if (!option) return;
      console.log('Toggling option:', optionId);
      const updatedOption = await axios.put(`/api/options/${optionId}`, {
        isWatchlisted: !option.isWatchlisted,
      });
      console.log('Option updated:', updatedOption.data);
      // Update the local state to reflect the change
      setOptions(prevOptions =>
        prevOptions.map(opt => (opt._id === optionId ? { ...opt, isWatchlisted: updatedOption.data.isWatchlisted } : opt))
      );

    } catch (error) {
      console.error('Error toggling option:', error);
      alert('Failed to toggle option. Please try again.');
    }
  };

  const handleDateTimeChange = (date, type) => {
    switch (type) {
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

  const updateRoomSettings = async () => {
    if(isAnyDateMissing || isChangeVoteTimeInvalid || isDropdownInvalid || isOptionsPerVoteInvalid) {
      setShowModal(false);
    } else {
      setShowModal(true);
    }
  }
  const handleConfirm = async () => {
    setShowModal(false);
    try {
      const payload = {
        votingEnd: votingEndDate ? votingEndDate.toISOString() : null,
        editVoteUntil: changeVoteUntilDate ? changeVoteUntilDate.toISOString() : null,
        canEditVote: allowVoteChange === 'yes',
        minOptionsPerVote: minOptionsPerVote === 'no-limit' ? 0 : parseInt(minOptionsPerVote, 10),
        maxOptionsPerVote: maxOptionsPerVote === 'no-limit' ? Number.MAX_SAFE_INTEGER : parseInt(maxOptionsPerVote, 10),
      };
      await axios.put(`/api/rooms/${roomId}`, payload);
      alert('Settings updated successfully.');
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Could not update settings. See console for details.');
    }
  };
  // Date/Time picker component
  const DateTimePicker = ({ label, selectedDate, onChange, id, error }) => {
    // Function to filter available times to 10-minute intervals (XX:X0)
    const filterTime = (time) => {
      const minutes = time.getMinutes();
      return minutes % 10 === 0;
    };

    return (
      <div className="flex items-center mb-4">
        <label className="w-64 font-medium">{label}</label>
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
            <div className="absolute z-10 mt-10 bg-white shadow-lg border rounded">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  onChange(date);
                  setActiveDatePicker(null);
                }}
                inline
              />
            </div>
          )}

          {activeDatePicker === `${id}-time` && (
            <div className="absolute z-10 mt-10 bg-white shadow-lg border rounded">
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

  useEffect(() => {
    generateTimeGrid(options);
  }, [options, generateTimeGrid]);


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
    
  const isAnyDateMissing =  !votingEndDate || (allowVoteChange==='yes' && !changeVoteUntilDate);
  const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && changeVoteUntilDate && votingEndDate && votingEndDate < changeVoteUntilDate;
  const isDropdownInvalid = minOptionsPerVote === 'Select' || maxOptionsPerVote === 'Select' || allowVoteChange === 'select';
  const isOptionsPerVoteInvalid = minOptionsPerVote && maxOptionsPerVote && parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10);

  return (
    <div className="flex-grow flex flex-col">
      {/* Header */}
      <header className="bg-[#3395ff] py-16 text-center">
        <h1 className="text-white text-4xl font-bold">PickATime - Admin Panel</h1>
      </header>

      <div className="flex-grow flex justify-center p-8">
        <div className="max-w-7xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
          {/* Left Section - Admin Controls */}
          <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
            {/* Options */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Options:</h3>
              <h4 className='text-lg font-semibold mb-2'>Click on the time slots to enable/disable them as Options :</h4>
              {loading ? (
                <div>Loading options...</div>
              ) : (
                <>
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
                          const option = options.find(opt => new Date(opt.content).getTime() === cellDateTime.getTime());
                          return (
                            <button
                              key={`${colIndex}-${rowIndex}`}
                              className={classnames(
                                'border rounded p-2 text-center',
                                option
                                  ? option.isWatchlisted
                                    ? 'bg-gray-400 text-white'
                                    : 'border-[#3395ff] text-[#3395ff] hover:bg-blue-50'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              )}
                              disabled={!option}
                              onClick={() => option && toggleOption(option._id)}
                            >
                              {formatTime(time)}
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date and Time Selectors */}
            <div className="space-y-4 relative">
              <DateTimePicker
                label="Voting ends at:"
                selectedDate={votingEndDate}
                onChange={(date) => handleDateTimeChange(date, 'voting-end')}
                id="voting-end"
              />

              {/* Dropdown Selectors */}
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
                <label className="w-64 font-medium">Min options per vote:</label>
                <select
                  className={`border rounded px-3 py-1 w-31 transition-colors duration-200 ${minOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={minOptionsPerVote}
                  onChange={(e) => setMinOptionsPerVote(e.target.value)}
                >
                  <option value="no-limit">No limit</option>
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Max options per vote: </label>
                <select
                  className={`border rounded px-3 py-1 w-31 transition-colors duration-200 ${maxOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={maxOptionsPerVote}
                  onChange={(e) => setMaxOptionsPerVote(e.target.value)}
                >
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
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
            </div>
          </div>

          {/* Right Section - User Management */}
          <div className="w-full md:w-1/3 p-8">
            <button 
              onClick={() => navigate(`/rooms/${roomId}/vote?user=${userId}`)}
              className="bg-[#1E4A8B] text-white rounded px-4 py-2 mb-8 w-full text-center"  // Changed from bg-navy-blue to #003366
                  >
                    Go Back to the Poll
            </button>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Users:</h3>
              <ul className="list-disc pl-5 mb-6">
                {usersInRoom.map(user => {
                  if (user._id === userId) {
                    const name = user.username ? user.username : user.email.split('@')[0];
                    return <li key={user._id}>You ({name})</li>;
                  }
                  return <li key={user._id}>{user.email}</li>;
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminPickATimePage;

