// src/pages/AdminDiscussionPage.js
import React, { useState } from 'react';
import { Calendar, Clock, X, Plus } from 'react-feather';

function AdminDiscussionPage() {
  // State for options
  const [options, setOptions] = useState(Array(10).fill('Orange'));
  const [newOption, setNewOption] = useState('');
  
  // State for users
  const [emails, setEmails] = useState([
    'nazireata@gmail.com',
    'onurkafkas1@gmail.com',
    'birkan.yilmaz@bogazici.edu.tr'
  ]);
  
  // State for watchlist
  const [watchlist, setWatchlist] = useState(['user#4191', 'user#4635', 'user#4586']);
  const [newWatchlistUser, setNewWatchlistUser] = useState('');
  
  // State for watchlist activity
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
  
  // Add a new option
  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption]);
      setNewOption('');
    }
  };
  
  // Remove an option
  const removeOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  // Add user to watchlist
  const addToWatchlist = () => {
    if (newWatchlistUser.trim() && !watchlist.includes(newWatchlistUser)) {
      setWatchlist([...watchlist, newWatchlistUser]);
      setNewWatchlistUser('');
    }
  };
  
  // Remove user from watchlist
  const removeFromWatchlist = (user) => {
    setWatchlist(watchlist.filter(u => u !== user));
  };
  
  // Date/Time picker component
  const DateTimePicker = ({ label, selectedDate, onChange, id }) => {
    return (
      <div className="flex items-center mb-4">
        <label className="w-48 font-medium">{label}</label>
        <div className="flex">
          <button 
            type="button"
            className="border p-2 mr-2 rounded hover:bg-gray-100"
            onClick={() => {
              setActiveDatePicker(activeDatePicker === id ? null : id);
            }}
          >
            <Calendar size={20} />
          </button>
          <button 
            type="button"
            className="border p-2 rounded hover:bg-gray-100"
            onClick={() => {
              setActiveDatePicker(activeDatePicker === `${id}-time` ? null : `${id}-time`);
            }}
          >
            <Clock size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section - Admin Controls */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Options */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-bold mr-4">Options:</h3>
              <div className="flex border rounded">
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
              {options.map((option, index) => (
                <div key={index} className="bg-orange-500 text-white rounded-full px-3 py-1 flex items-center">
                  {option}
                  <button className="ml-2" onClick={() => removeOption(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Users who haven't voted */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Users who have not voted yet: 156</h3>
            <button className="text-[#3395ff] border border-[#3395ff] rounded px-4 py-2">
              Send them a reminder e-mail
            </button>
          </div>

          {/* Date and Time Selectors */}
          <div className="space-y-4 relative">
            <DateTimePicker 
              label="Discussion ends at:"
              selectedDate={discussionEndDate}
              onChange={setDiscussionEndDate}
              id="discussion-end"
            />
            
            <DateTimePicker 
              label="Voting starts at:"
              selectedDate={votingStartDate}
              onChange={setVotingStartDate}
              id="voting-start"
            />
            
            <DateTimePicker 
              label="Voting ends at:"
              selectedDate={votingEndDate}
              onChange={setVotingEndDate}
              id="voting-end"
            />

            {/* Dropdown Selectors */}
            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Allow Users to submit new Options?</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Allow Users to change their votes?</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <DateTimePicker 
              label="Allow users to change their vote until:"
              selectedDate={changeVoteUntilDate}
              onChange={setChangeVoteUntilDate}
              id="change-vote-until"
            />
          </div>
        </div>

        {/* Right Section - User Management */}
        <div className="w-full md:w-1/3 p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Users:</h3>
            <ul className="list-disc pl-5 mb-6">
              {emails.map((email, index) => (
                <li key={index}>{email}</li>
              ))}
            </ul>

            <div className="space-y-3 mb-6">
              <button className="flex items-center border rounded-full px-4 py-1 text-sm">
                <Plus size={16} className="mr-1" /> Add Voters' emails via .csv file...
              </button>
              <button className="flex items-center border rounded-full px-4 py-1 text-sm">
                <Plus size={16} className="mr-1" /> Add Voters' emails one by one...
              </button>
            </div>
          </div>
          
          {/* Watchlist Management */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Manage Watchlist:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {watchlist.map((user, index) => (
                <div key={index} className="bg-[#3395ff] text-white rounded-full px-3 py-1 flex items-center">
                  {user}
                  <button className="ml-2" onClick={() => removeFromWatchlist(user)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <button className="flex items-center border rounded-full px-4 py-1 text-sm mb-6">
              <Plus size={16} className="mr-1" /> Add to Watchlist by User #
            </button>
          </div>
          
          {/* Watchlist Activity */}
          <div>
            <h3 className="text-xl font-bold mb-4">Review Watchlist Activity:</h3>
            <div className="space-y-2">
              {watchlistActivity.map((activity, index) => (
                <div key={index} className="border border-[#3395ff] text-[#3395ff] rounded-full px-4 py-2 text-sm">
                  {activity.user} {activity.action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDiscussionPage;