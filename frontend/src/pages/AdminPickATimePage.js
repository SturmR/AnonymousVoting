// src/pages/AdminPickATimePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, X, Plus} from 'react-feather';
import { useParams, useLocation } from 'react-router-dom';
import DatePicker from "react-datepicker";
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminPickATimePage() {
  const { roomId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('user');
  const [options, setOptions] = useState([]);

  const [usersInRoom, setUsersInRoom] = useState([]);
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
        const { data: room } = await axios.get(`/rooms/${roomId}`);
        setVotingEndDate(room.votingEnd ? new Date(room.votingEnd) : null);
        setChangeVoteUntilDate(room.editVoteUntil ? new Date(room.editVoteUntil) : null);
        setMinOptionsPerVote(room.minOptionsPerVote ? room.minOptionsPerVote : 'Select');
        setMaxOptionsPerVote(room.maxOptionsPerVote ? room.maxOptionsPerVote : 'Select');
        setAllowVoteChange(room.canEditVote ? 'yes' : 'no');

        const { data: opts} = await axios.get(`/options?room=${roomId}`);
        setOptions(opts);
        setLoading(false);
        const userIds = Array.isArray(room.userList) ? room.userList : [];
        if (userIds.length) {
          const userPromises = userIds.map(userId => axios.get(`/users/${userId}`));
          const userResponses = await Promise.all(userPromises);
          const participants = userResponses.map(response => response.data);
          setUsersInRoom(participants);
          const votePromises = userIds.map(userId => axios.get(`/votes?user=${userId}&room=${roomId}`));
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
  }, [roomId, options]);

  const disableOption = async (optionId) => {
    try {
      const option = await axios.get(`/options/${optionId}`);
      if (option.data.isWatchlisted) {
        await axios.patch(`/options/${optionId}`, { isWatchlisted: true }); // disabling the option is the same as watchlisting it
      }
      else {
        await axios.patch(`/options/${optionId}`, { isWatchlisted: false });
      }
    } catch (error) {
      console.error('Error disabling option:', error);
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
		try {
			const payload = {
				// match your backend property names exactly:
        votingEnd: votingEndDate ? votingEndDate.toISOString() : null,
				editVoteUntil: changeVoteUntilDate ? changeVoteUntilDate.toISOString() : null,
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
      const today = new Date(); // Use today's date, we only care about the time.
      const [hours, minutes] = timeString.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0); // Set the hours and minutes
      return today;
    });
    setTimeSlots(timeSlotDates);

  }, []);



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
              {loading ? (
                <div>Loading options...</div> // Or a more sophisticated loader
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
                            const slotKey = cellDateTime.toISOString();
                            const isSelectable = true;
                            return (
                              <button
                                key={`${colIndex}-${rowIndex}`}
                                className={'border rounded p-2 text-center border-[#3395ff] text-[#3395ff] hover:bg-blue-5'}
                                // onClick={() => toggleTimeSlot(colIndex, rowIndex)}            
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

            <div className="flex items-center">
              <label className="w-64 font-medium">Min options per vote:</label>
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
              <label className="w-64 font-medium">Max options per vote: </label>
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

            <button onClick={updateRoomSettings} className="bg-blue-500 text-white rounded px-4 py-2">
              Update Settings
            </button>            
          </div>
        </div>

        {/* Right Section - User Management */}
        <div className="w-full md:w-1/3 p-8">
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
        </div>
      </div>
    </div>
    </div>
  );
}
export default AdminPickATimePage;