// src/pages/PickATime.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Plus, X } from 'react-feather';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function PickATime() {
  // State for the form
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  
  // Date/time state
  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [allowVoteChange, setAllowVoteChange] = useState('Select');
  const [minOptionsPerVote, setMinOptionsPerVote] = useState('Select');
  const [maxOptionsPerVote, setMaxOptionsPerVote] = useState('Select');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [optionsStartDate, setOptionsStartDate]   = useState(null);
  const [optionsEndDate,   setOptionsEndDate]     = useState(null);
  const [stepSize,         setStepSize]           = useState('Select');
  const [includeWeekends,  setIncludeWeekends]    = useState('Select');

  const [activeDatePicker, setActiveDatePicker] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Add a new email
  const addEmail = () => {
    if (newEmail.trim() && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
  };
  
  // Handle create button click
  const handleCreate = () => {
    setAttemptedSubmit(true);
    
    if (isQuestionEmpty) {
      setFormError('Please enter a discussion question.');
      setShowModal(false);
    } else if (isAnyDateMissing) {
      setFormError('Please fill in all required date and time fields.');
      setShowModal(false);
    } else if (isVotingTimeInvalid) {
      setFormError('Please make sure all end times are after their respective start times.');
      setShowModal(false);
    } else if (isChangeVoteTimeInvalid) {
      setFormError('Please make sure vote change time limit is in between voting start time and voting end time.');
      setShowModal(false);
    } else if (isDropdownInvalid) {
      setFormError('Please make sure to select all settings.');
      setShowModal(false);  
    } else {
      setFormError('');
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    const slots = [];
    for (
      let d = new Date(optionsStartDate);
      d <= optionsEndDate;
      d = new Date(d.getTime() + Number(stepSize) * 60000))
     {
      debugger;
      if (
        includeWeekends === 'no' &&
        (d.getDay() === 0 || d.getDay() === 6)
      ) continue;

      slots.push(d.toISOString());
    }

    const payload = {
      title: question,
      type: 'PickATime',
      votingStart: votingStartDate,
      votingEnd: votingEndDate,
      canEditVote: allowVoteChange === 'yes',
      editVoteUntil: changeVoteUntilDate,
      minOptionsPerVote: minOptionsPerVote === 'no-limit'
        ? 0
        : parseInt(minOptionsPerVote, 10),
      maxOptionsPerVote: maxOptionsPerVote === 'no-limit'
        ? 0
        : parseInt(maxOptionsPerVote, 10),
      userList: emails,
    };

  try {
    const { data: room } = await axios.post(
      'http://localhost:5000/api/rooms',
      payload
    );

    console.log('slots are:', slots);
    const createOps = slots.map(iso =>
      axios.post("http://localhost:5000/api/options", { room:room._id, content:iso}) // what is iso??
    );
    const results = await Promise.all(createOps);

    // 3) Collect the new Option IDs
    const optionIds = results.map(r => r.data._id);

    // 4) Patch the room’s optionList
    await axios.put(`http://localhost:5000/api/rooms/${room._id}`, {
      optionList: optionIds
    });

    setShowModal(false);
    navigate(`/rooms/${room._id}`);
  } catch (err) {
    console.error(err);
    alert(
      'Could not create room. Try again.\n' +
        (err.response?.data?.message || err.message)
    );
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

  // Confirmation Modal Component
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
            <p className="mb-6">Are you sure that you want to set up a room with the given features?</p>
            
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

  // Remove an option
  const removeOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  // TODO: check these!!!
  const isVotingTimeInvalid =
    votingStartDate && votingEndDate && votingEndDate <= votingStartDate;

  const isChangeVoteTimeInvalid =
    votingStartDate && changeVoteUntilDate && votingEndDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);

  const isAnyDateMissing =
    !votingStartDate || !votingEndDate || !changeVoteUntilDate;

  const isQuestionEmpty = question.trim() === '';

  const isEmailsInvalid = emails.length === 0;

  const isDropdownInvalid =
    allowVoteChange === 'Select' ||
    minOptionsPerVote === 'Select' ||
    maxOptionsPerVote === 'Select' ||
    optionsStartDate === null ||
    optionsEndDate === null; 

  const isFormValid = !isQuestionEmpty && 
                      !isAnyDateMissing && 
                      !isVotingTimeInvalid && 
                      !isChangeVoteTimeInvalid && 
                      !isDropdownInvalid;

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
            {isVotingTimeInvalid && (
              <p className="text-red-500 text-sm">Voting end time must be after start time.</p>
            )}
            {/* Dropdown Selectors */}
            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Allow Users to change their votes?</label>
              <select 
                className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                  attemptedSubmit && allowVoteChange === 'Select' ? 'border-red-500' : 'border-gray-300'
                }`}
                value={allowVoteChange}
                onChange={(e) => setAllowVoteChange(e.target.value)}
              >
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
            {isChangeVoteTimeInvalid && (
              <p className="text-red-500 text-sm">Vote change time limit must be in between voting start time and voting end time.</p>
            )}
<div className="flex items-center">
                <label className="w-64 font-medium">Minimum number of Options the Users must vote for:</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                    attemptedSubmit && minOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'
                  }`}
                
                  value={minOptionsPerVote}
                  onChange={(e) => setMinOptionsPerVote(e.target.value)}
                >
                  <option>Select</option>
                  <option value="no-limit">No limit</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Maximum number of Options the Users can vote for:</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                    attemptedSubmit && maxOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'
                  }`}
                
                  value={maxOptionsPerVote}
                  onChange={(e) => setMaxOptionsPerVote(e.target.value)}
                >
                  <option>Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="no-limit">No Limit</option>
                </select>
              </div>

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">The step size for time options</label>
              <select className="border rounded px-3 py-1 w-24"
                value={stepSize}
                onChange={e => setStepSize(e.target.value)}
              >
                <option>Select</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <DateTimePicker 
              label="The start time for time options"
              selectedDate={optionsStartDate}
              onChange={setOptionsStartDate}
              id="options-start-date"
            />

            <DateTimePicker 
              label="The end time for time options"
              selectedDate={optionsEndDate}
              onChange={setOptionsEndDate}
              id="options-end-date"
            />

            <div className="flex items-center mb-4">
              <label className="w-64 font-medium">Include weekends?</label>
              <select className="border rounded px-3 py-1 w-24"
                value={includeWeekends}
                onChange={e => setIncludeWeekends(e.target.value)}
              >
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
            <button 
              className="w-full bg-[#004999] text-white rounded py-2 font-medium"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </div>
      </div>
      
      {/* Render the confirmation modal */}
      <ConfirmationModal />
    </div>
  );
}

export default PickATime;