// src/pages/PickATime.js
import React, { useState } from 'react';
import { Calendar, Clock, Plus } from 'react-feather';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function PickATime() {
  // State for the form
  const [question, setQuestion] = useState('');
  const [emails, setEmails] = useState([
    'nazireata@gmail.com',
    'onurkafkas1@gmail.com',
    'birkan.yilmaz@bogazici.edu.tr'
  ]);
  const [newEmail, setNewEmail] = useState('');
  
  // Date/time state
  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [startTimeForOptions, setStartTimeForOptions] = useState(null);
  const [endTimeForOptions, setEndTimeForOptions] = useState(null);
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  // Add a new email
  const addEmail = () => {
    if (newEmail.trim() && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
  };
  
  // Date/Time picker component
  const DateTimePicker = ({ label, selectedDate, onChange, id }) => {
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
          
          {activeDatePicker === id && (
            <div className="absolute z-10 mt-10">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  onChange(date);
                  setActiveDatePicker(null);
                }}
                inline
                calendarClassName="bg-white shadow-lg border rounded"
              />
            </div>
          )}
          
          {activeDatePicker === `${id}-time` && (
            <div className="absolute z-10 mt-10">
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
                calendarClassName="bg-white shadow-lg border rounded"
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

  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Question Input */}
          <div className="mb-8">
            <textarea
              className="w-full p-4 text-2xl text-gray-500 border-none focus:outline-none resize-none"
              placeholder="Write your question here..."
              rows="3"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            ></textarea>
          </div>

          {/* Date and Time Selectors */}
          <div className="space-y-4 relative">
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

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Minimum number of Options the Users must vote for:</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="no-limit">No limit</option>
              </select>
            </div>

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Maximum number of Options the Users can vote for:</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="no-limit">No limit</option>
              </select>
            </div>

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">The step size for time options</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <DateTimePicker 
              label="The start time for time options"
              selectedDate={startTimeForOptions}
              onChange={setStartTimeForOptions}
              id="start-time-options"
            />

            <DateTimePicker 
              label="The end time for time options"
              selectedDate={endTimeForOptions}
              onChange={setEndTimeForOptions}
              id="end-time-options"
            />

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Include weekends?</label>
              <select className="border rounded px-3 py-1 w-24">
                <option>Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/3 p-8">
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

          <div className="mb-6">
            <input
              type="email"
              className="w-full border rounded p-2 mb-2 text-sm"
              placeholder="Submit your email to receive the anonymous host link..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
            />
          </div>

          <div className="space-y-3">
            <button className="w-full bg-[#3395ff] text-white rounded py-2 font-medium">
              Preview
            </button>
            <button className="w-full bg-[#004999] text-white rounded py-2 font-medium">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickATime;