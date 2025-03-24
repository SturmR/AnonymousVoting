// src/pages/AdminPickATimePage.js
import React, { useState } from 'react';
import { Calendar, Clock, Plus } from 'react-feather';

function AdminPickATimePage() {
  // State for users
  const [emails, setEmails] = useState([
    'nazireata@gmail.com',
    'onurkafkas1@gmail.com',
    'birkan.yilmaz@bogazici.edu.tr'
  ]);
  
  // State for date/time pickers
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  
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
          {/* Users who haven't voted */}
          <div className="flex items-center justify-between mb-16">
            <h3 className="text-xl font-bold">Users who have not voted yet: 156</h3>
            <button className="text-[#3395ff] border border-[#3395ff] rounded px-4 py-2">
              Send them a reminder e-mail
            </button>
          </div>

          {/* Large empty space as in the design */}
          <div className="h-32 mb-16"></div>

          {/* Date and Time Selectors */}
          <div className="space-y-16 relative">
            <DateTimePicker 
              label="Voting ends at:"
              selectedDate={votingEndDate}
              onChange={setVotingEndDate}
              id="voting-end"
            />
            
            {/* Large empty space as in the design */}
            <div className="h-32"></div>

            {/* Dropdown Selectors */}
            <div className="flex items-center mb-16">
              <label className="w-64 font-medium">Allow Users to change their votes?</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Large empty space as in the design */}
            <div className="h-32"></div>

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
        </div>
      </div>
    </div>
  );
}

export default AdminPickATimePage;