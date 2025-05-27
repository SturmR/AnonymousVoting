// src/pages/PickATime.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Plus, X } from 'react-feather';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PickATime() {
  // State for the form
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
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
  const [showLinksModal, setShowLinksModal] = useState(false); // New modal for links
  const [generatedLinks, setGeneratedLinks] = useState([]); // State to store generated links

  // Function to generate a random username
  const generateRandomUsername = () =>
  'user' + Math.floor(1000 + Math.random() * 9000);
  
  // Handle create button click
  const handleCreate = () => {
    setAttemptedSubmit(true);
    const isQuestionEmpty = question.trim() === '';
    const isAnyDateMissing = !votingStartDate || !votingEndDate || (allowVoteChange === 'yes' && !changeVoteUntilDate);
    const isVotingTimeInvalid = votingStartDate && votingEndDate && votingEndDate <= votingStartDate;
    const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && votingStartDate && changeVoteUntilDate && votingEndDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);
    const isOptionsPerVoteInvalid = minOptionsPerVote && maxOptionsPerVote && parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10);
    const isEmailsInvalid = emails.length === 0;
    const isDropdownInvalid =
      allowVoteChange === 'Select' ||
      minOptionsPerVote === 'Select' ||
      maxOptionsPerVote === 'Select' ||
      optionsStartDate === null ||
      optionsEndDate === null; // Check if any dropdown is not selected
    
    let error = '';
    if (isQuestionEmpty) error += 'Question cannot be empty.\n';
    if (isAnyDateMissing) error += 'All date fields must be filled.\n';
    if (isVotingTimeInvalid) error += 'Voting end time must be after start time.\n';
    if (isChangeVoteTimeInvalid) error += 'Vote change time limit must be in between voting start time and voting end time.\n';
    if (isEmailsInvalid) error += 'At least one email must be added.\n';
    if (isDropdownInvalid) error += 'All dropdowns must be selected.\n';
    if (isOptionsPerVoteInvalid) error += 'Minimum options per vote cannot exceed maximum options per vote.\n';
    
    setFormError(error);
    if (!error) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  };

  const handleConfirm = async () => {
    setShowModal(false);
    let createdRoomId = null;

    // Function to generate a random hexadecimal ID
    const generateRandomHexId = (length = 24) => { // You can adjust the length
        const characters = 'abcdef0123456789';
        let randomId = '';
        for (let i = 0; i < length; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomId;
    };

    try {
      // 1) Create the room
      const roomPayload = {
        title: question,
        description: '',
        type: 'PickATime',
        votingStart: votingStartDate,
        votingEnd: votingEndDate,
        canEditVote: allowVoteChange === 'yes',
        editVoteUntil: allowVoteChange==='yes' ? changeVoteUntilDate : null,
        minOptionsPerVote: minOptionsPerVote === 'no-limit' ? 0 : parseInt(minOptionsPerVote, 10),
        maxOptionsPerVote: maxOptionsPerVote === 'no-limit' ? Number.MAX_SAFE_INTEGER : parseInt(maxOptionsPerVote, 10),
      };
      const { data: room } = await axios.post('api/rooms', roomPayload);
      createdRoomId = room._id;

      // 2) Create the admin user
      const adminUsername = generateRandomUsername();
      const adminGeneratedId = generateRandomHexId();
      const { data: adminUser} = await axios.post('/api/users', {
        room:     createdRoomId,
        username: adminUsername,
        _id:      adminGeneratedId,
        email:  `${adminUsername}@example.com`, //TODO: replace with actual
        isAdmin: true
      });
      const adminId = adminGeneratedId;

      // 3) Create the users
      const userCreates = emails.map(email => {
        const username = generateRandomUsername();
        const voterGeneratedId = generateRandomHexId();
        return axios.post('/api/users', {
          room: createdRoomId,
          username,
          _id: voterGeneratedId,
          email
        });
      });
      const userResults = await Promise.all(userCreates);
      const voterData = userResults.map((r,i) => ({
        email: emails[i],
        id: r.data._id
      }));
      const voterIds = voterData.map(v => v.id);

      // 4) Patch the room with the user IDs
      await axios.put(`/api/rooms/${createdRoomId}`, {userList: [adminId, ...voterIds]
      });

      // 5) Create the options        
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

      console.log('slots are:', slots);
      const createOps = slots.map(iso =>
        axios.post("/api/options", { room:createdRoomId, content:iso}) // what is iso??
      );
      const results = await Promise.all(createOps);
      const optionIds = results.map(r => r.data._id);
      await axios.put(`/api/rooms/${createdRoomId}`, {
        optionList: optionIds
      });

      // 6) Create the admin and voter links
      const links = [
      {
        label: 'Admin Link',
        url:   `${window.location.origin}/rooms/${createdRoomId}?user=${adminId}`
      },
      ...voterData.map(u => ({
        label: u.email,
        url:   `${window.location.origin}/rooms/${createdRoomId}/vote?user=${u.id}`
      }))
    ];
    setGeneratedLinks(links);
    setShowLinksModal(true);    
  } catch (err) {
    console.error(err);
    alert(
      'Could not create room. Try again.\n' +
        (err.response?.data?.message || err.message)
    );
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
                // calendarClassName="bg-white shadow-lg border rounded"
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
                // calendarClassName="bg-white shadow-lg border rounded"
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

// *** NEW: Links Modal Component ***
  const LinksModal = () => {
    if (!showLinksModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative p-6">
           <button
              onClick={() => setShowLinksModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          <h3 className="text-xl font-semibold mb-4">Room Created! User Links:</h3>
          <p className="mb-4 text-sm text-gray-600">Copy and share these links with the respective users:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {generatedLinks.map((link, index) => (
              <div key={index} className="border p-2 rounded bg-gray-50">
                <p className="text-sm font-medium">{link.email}:</p>
                <input
                  type="text"
                  readOnly
                  value={link.url}
                  className="w-full text-xs text-blue-600 bg-transparent border-none p-1 focus:outline-none"
                  onFocus={(e) => e.target.select()} // Select text on focus
                />
              </div>
            ))}
          </div>
           <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLinksModal(false)} // Close this modal
                className="px-4 py-2 bg-[#3395ff] text-white rounded hover:bg-[#2980e4]"
              >
                Close
              </button>
            </div>
        </div>
      </div>
    );
  };

  // Add a new email
  const addEmail = () => {
    const email = newEmail.trim().toLowerCase(); // Normalize email
    if (!email) return;
    // Basic email format validation (optional but recommended)
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!emails.includes(email)) { // Prevent duplicates
      setEmails([...emails, email]);
      setNewEmail('');
      setShowEmailInput(false); // Hide input after adding
    } else {
      alert(`${email} has already been added.`);
      setNewEmail(''); // Clear input even if duplicate
    }
  };

  // Remove an email
  const removeEmail = (index) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
  };
  
  const isQuestionEmpty = question.trim() === '';
  const isAnyDateMissing = !votingStartDate || !votingEndDate || (allowVoteChange === 'yes' && !changeVoteUntilDate);
  const isVotingTimeInvalid = votingStartDate && votingEndDate && votingEndDate <= votingStartDate;
  const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && votingStartDate && changeVoteUntilDate && votingEndDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);
  const isOptionsPerVoteInvalid = minOptionsPerVote && maxOptionsPerVote && parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10);
  const isEmailsInvalid = emails.length === 0;
  const isDropdownInvalid =
      allowVoteChange === 'Select' ||
      minOptionsPerVote === 'Select' ||
      maxOptionsPerVote === 'Select';
  // Combine all validation checks
  const isFormInvalid =
      isQuestionEmpty ||
      isAnyDateMissing ||
      isVotingTimeInvalid ||
      isChangeVoteTimeInvalid ||
      isEmailsInvalid ||
      isDropdownInvalid;

  return (
    <div className='min-h-screen flex flex-col'>
      <main className="flex-grow flex justify-center p-8">
        <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
          {/* Left Section */}
          <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
            {/* Question Input */}
            <div className="mb-8">
              <textarea
                className={`w-full p-4 text-2xl text-gray-500 border-b focus:outline-none resize-none transition-colors duration-200 ${attemptedSubmit && isQuestionEmpty ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Write your question here..."
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              ></textarea>
              {attemptedSubmit && isQuestionEmpty && <p className="text-red-500 text-sm mt-1">Question is required.</p>}
            </div>

            {/* Date and Time Selectors */}
            <div className="space-y-4 relative">
              <DateTimePicker 
                label="Voting starts at:"
                selectedDate={votingStartDate}
                onChange={setVotingStartDate}
                id="voting-start"
                error={attemptedSubmit && !votingStartDate}
              />
              
              <DateTimePicker 
                label="Voting ends at:"
                selectedDate={votingEndDate}
                onChange={setVotingEndDate}
                id="voting-end"
                error={attemptedSubmit && !votingEndDate}
              />
              {isVotingTimeInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">End time must be after start time.</p>
              )}
              
              {/* Dropdown Selectors */}
              <div className="flex items-center mb-4">
                <label className="w-[400px] font-medium mr-4">Allow Users to change their votes?</label>
                <select 
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                    attemptedSubmit && allowVoteChange === 'Select' ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={allowVoteChange}
                  onChange={(e) => setAllowVoteChange(e.target.value)}
                >
                  <option disabled value="Select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              
              {allowVoteChange === 'yes' && (
                <>
                  <DateTimePicker 
                    label="Allow users to change their vote until:"
                    selectedDate={changeVoteUntilDate}
                    onChange={setChangeVoteUntilDate}
                    id="change-vote-until"
                    error={attemptedSubmit && !changeVoteUntilDate}
                  />
                  {isChangeVoteTimeInvalid && (
                    <p className="text-red-500 text-sm mt-1">Must be between voting start and end.</p>
                  )}
                </>
              )}

              <div className="flex items-center margin-between-2">
                <label className="w-[400px] font-medium mr-4">Minimum number of Options the Users must vote for:</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                    attemptedSubmit && minOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'
                  }`}                
                  value={minOptionsPerVote}
                  onChange={(e) => setMinOptionsPerVote(e.target.value)}
                >
                  <option disabled value="Select">Select</option>
                  <option value="no-limit">No limit</option>
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ) // TODO: instead of number of options, do like 10-20~
                  } 
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-[400px] font-medium mr-4">Maximum number of Options the Users can vote for:</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                    attemptedSubmit && maxOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'
                  }`}
                
                  value={maxOptionsPerVote}
                  onChange={(e) => setMaxOptionsPerVote(e.target.value)}
                >
                  <option disabled value= "Select">Select</option>
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                    <option key={i+1} value={i+1}>{i+1}</option>
                  )}
                  <option value="no-limit">No Limit</option>
                </select>
              </div>
              {isOptionsPerVoteInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Min options per vote must be less than or equal to max.</p>
              )}

              <div className="flex items-center mb-4">
                <label className="w-[400px] font-medium mr-4">The step size for time options:</label>
                  <select className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                        attemptedSubmit && stepSize === 'Select' ? 'border-red-500' : 'border-gray-300'
                      }`}
                  value={stepSize}
                  onChange={e => setStepSize(e.target.value)}
                >
                  <option disabled value= "Select">Select</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              
              <div className="flex items-center mb-4">
                <DateTimePicker 
                  label="The start time for time options:"
                  selectedDate={optionsStartDate}
                  onChange={setOptionsStartDate}
                  id="options-start-date"
                  error={attemptedSubmit && !optionsStartDate}
                />
              </div>
              <div className="flex items-center mb-4">
                <DateTimePicker 
                  label="The end time for time options:"
                  selectedDate={optionsEndDate}
                  onChange={setOptionsEndDate}
                  id="options-end-date"
                  error={attemptedSubmit && !optionsEndDate}
                />
              </div>
              <div className="flex items-center mb-4">
                <label className="w-[400px] font-medium mr-4">Include weekends?</label>
                <select className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${
                      attemptedSubmit && includeWeekends === 'Select' ? 'border-red-500' : 'border-gray-300'
                    }`}
                  value={includeWeekends}
                  onChange={e => setIncludeWeekends(e.target.value)}
                >
                  <option disabled value="Select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full md:w-1/3 p-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Voters:</h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {emails.map((email, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-100 p-1 px-2 rounded text-sm">
                      <span>{email}</span>
                      <button onClick={() => removeEmail(index)} className="text-red-500 hover:text-red-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                  {attemptedSubmit && isEmailsInvalid && <p className="text-red-500 text-sm mb-2">Add at least one voter email.</p>}

              <div className="space-y-3 mb-6">
                <button className="flex items-center border rounded-full px-4 py-1 text-sm">
                  <Plus size={16} className="mr-1" /> Add Voters' emails via .csv file...
                </button>
                <button 
                    onClick={() => setShowEmailInput(!showEmailInput)}
                    className="flex items-center border rounded-full px-4 py-1 text-sm">
                  <Plus size={16} className="mr-1" /> Add Voters' emails one by one...
                </button>
                {showEmailInput && (
                  <input
                    type="email"
                    placeholder="Type email and press Enter"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                    autoFocus
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Spacer to push buttons down */}
            <div className="flex-grow"></div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-auto">
                {formError && (
                  <p className="text-red-500 text-sm mb-2 text-center">{formError}</p>
                )}
              <button
                className="w-full bg-[#004999] text-white rounded py-2 font-medium hover:bg-[#003e80] transition-colors"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>          
          </div>
        </div>
        </main>
        
        {/* Render the confirmation modal */}
        <ConfirmationModal />
        <LinksModal /> {/* Add the new modal */}
      </div>
  );
}

export default PickATime;