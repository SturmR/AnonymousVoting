// src/pages/CreateRoom.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Calendar, Clock, X, Plus } from 'react-feather';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

// Set default base URL for axios if not already set elsewhere
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CreateRoom() {
  // State for the form
  const [question, setQuestion] = useState('');
  const [newOption, setNewOption] = useState('');
  const [options, setOptions] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [formError, setFormError] = useState('');

  const [discussionStartDate, setDiscussionStartDate] = useState(null);
  const [discussionEndDate, setDiscussionEndDate] = useState(null);
  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);
  const [allowSubmitOptions, setAllowSubmitOptions] = useState('Select');
  const [allowVoteChange, setAllowVoteChange] = useState('Select');
  const [minOptionsPerVote, setMinOptionsPerVote] = useState('Select');
  const [maxOptionsPerVote, setMaxOptionsPerVote] = useState('Select');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // State to track which date picker is currently showing
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false); // New modal for links
  const [generatedLinks, setGeneratedLinks] = useState([]); // State to store generated links

  const fileInputRef = useRef(null);

  // 1) Utility to generate a random username like "user8342"
  const generateRandomUsername = () =>
    'user' + Math.floor(1000 + Math.random() * 9000);

  // Handle create button click
  const handleCreate = () => {
    setAttemptedSubmit(true);
    // Validation checks... (ensure these are accurate)
    const isQuestionEmpty = question.trim() === '';
    const isAnyDateMissing = !discussionStartDate || !discussionEndDate || !votingStartDate || !votingEndDate || (allowVoteChange === 'yes' && !changeVoteUntilDate);
    const isDiscussionTimeInvalid = discussionStartDate && discussionEndDate && discussionEndDate <= discussionStartDate;
    const isVotingTimeInvalid = votingStartDate && votingEndDate && votingEndDate <= votingStartDate;
    const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && votingStartDate && changeVoteUntilDate && votingEndDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);
    const isEmailsInvalid = emails.length === 0;
    const isDropdownInvalid =
        allowSubmitOptions === 'Select' ||
        allowVoteChange === 'Select' ||
        minOptionsPerVote === 'Select' ||
        maxOptionsPerVote === 'Select';

    let error = '';
    if (isQuestionEmpty) error = 'Please enter a discussion question.';
    else if (isAnyDateMissing) error = 'Please fill in all required date and time fields.';
    else if (isDiscussionTimeInvalid || isVotingTimeInvalid) error = 'Please make sure all end times are after their respective start times.';
    else if (isChangeVoteTimeInvalid) error = 'Please make sure vote change time limit is in between voting start time and voting end time.';
    else if (isDropdownInvalid) error = 'Please make sure to select all settings.';
    else if (isEmailsInvalid) error = 'Please add at least one voter email.';

    setFormError(error);
    if (!error) {
        setShowModal(true); // Show confirmation modal if no errors
    } else {
        setShowModal(false); // Hide confirmation modal if there are errors
    }
  };

// Handle confirmation: create the Room via backend, then navigate into it
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
        // A) Create the room
        const roomPayload = {
            title: question,
            description: '',
            type: 'DiscussAndVote',
            discussionStart: discussionStartDate,
            discussionEnd:    discussionEndDate,
            votingStart:      votingStartDate,
            votingEnd:        votingEndDate,
            canAddOption:     allowSubmitOptions === 'yes',
            canEditVote:      allowVoteChange     === 'yes',
            editVoteUntil:    allowVoteChange === 'yes' ? changeVoteUntilDate : null,
            minOptionsPerVote: minOptionsPerVote === 'no-limit' ? 0 : parseInt(minOptionsPerVote, 10),
            maxOptionsPerVote: maxOptionsPerVote === 'no-limit'
                                        ? Number.MAX_SAFE_INTEGER
                                        : parseInt(maxOptionsPerVote, 10),
        };
        const { data: room } = await axios.post('/api/rooms', roomPayload);
        createdRoomId = room._id;

        // B) Create the **admin** user with a random ID
        const adminUsername = generateRandomUsername();
        const adminGeneratedId = generateRandomHexId(); // Generate random hex ID
        await axios.post('/api/users', {
            room:       createdRoomId,
            username:   adminUsername,
            // Instead of relying on MongoDB's ObjectId, use the generated one
            _id:        adminGeneratedId,
            email:      `${adminUsername}@example.com`,
            isAdmin:    true
        });
        const adminId = adminGeneratedId; // Use the generated ID

        // C) Create each voter user with a random ID
        const userCreates = emails.map(email => {
            const username = generateRandomUsername();
            const voterGeneratedId = generateRandomHexId(); // Generate random hex ID
            return axios.post('/api/users', {
                room:       createdRoomId,
                username,
                _id:        voterGeneratedId,
                email,
            });
        });
        const userResults = await Promise.all(userCreates);
        const voterData = userResults.map((r, i) => ({
            email: emails[i],
            id:    r.data._id // Use the generated ID from the response
        }));
        const voterIds = voterData.map(u => u.id);

        // D) Patch room -> userList = [admin, ...voters]
        await axios.put(`/api/rooms/${createdRoomId}`, {
            userList: [adminId, ...voterIds]
        });

        // E) Create each option and patch optionList (unchanged)
        const optionCreates = options.map(text =>
            axios.post('/api/options', { room: createdRoomId, content: text })
        );
        const optionResults = await Promise.all(optionCreates);
        const optionIds      = optionResults.map(r => r.data._id);
        await axios.put(`/api/rooms/${createdRoomId}`, {
            optionList: optionIds
        });

        // F) Generate the admin + voter links using the generated IDs
        const links = [
            {
                label: 'Admin Link',
                url:   `${window.location.origin}/rooms/${createdRoomId}?user=${adminId}`
            },
            ...voterData.map(u => ({
                label: u.email,
                url:   `${window.location.origin}/rooms/${createdRoomId}?user=${u.id}`
            }))
        ];
        setGeneratedLinks(links.filter(link => link.label === 'Admin Link'));
        setShowLinksModal(true);

        // ------------------------------------------------
        // >>> ADDED: Send all voter links (excluding Admin) via email
        // ------------------------------------------------
        try {
          // Build an array of { email, url } for each non-admin link:
          const invitePayload = links
            .filter(link => link.label !== 'Admin Link')
            .map(link => ({
              email: link.label,  // since label was set to the user’s email
              url:   link.url
            }));

          // POST to our new endpoint:
          await axios.post(
            `/api/rooms/${createdRoomId}/send-invites`,
            { invites: invitePayload }
          );
          // Optionally, show a success toast:
          toast.success("Invitation emails sent to voters!");
        } catch (emailErr) {
          console.error("Failed to send invitation emails:", emailErr);
          toast.error("Could not send invitation emails. Check console for details.");
        }
        // ------------------------------------------------

    } catch (err) {
        console.error('Creation failed:', err);
        // Optionally roll back partial creations here
        toast.error(`Could not create room/users/options: ${err.message}`);
    }
};

  // Add this function inside your Meeting component
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
          <h3 className="text-xl font-semibold mb-4">Room Created! Here is your link:</h3>
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

  // Add a new email
  const addEmail = () => {
    const email = newEmail.trim().toLowerCase(); // Normalize email
    if (!email) return;
    // Basic email format validation (optional but recommended)
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast.error('Please enter a valid email address.');
        return;
    }
    if (!emails.includes(email)) { // Prevent duplicates
        setEmails([...emails, email]);
        setNewEmail('');
        setShowEmailInput(false); // Hide input after adding
    } else {
        toast.error(`${email} has already been added.`);
        setNewEmail(''); // Clear input even if duplicate
    }
  };

  // Remove an email
  const removeEmail = (index) => {
      const newEmails = [...emails];
      newEmails.splice(index, 1);
      setEmails(newEmails);
  };


  // Validation flags (derived state)
  const isQuestionEmpty = question.trim() === '';
  // const isAnyDateMissing = !discussionStartDate || !discussionEndDate || !votingStartDate || !votingEndDate || (allowVoteChange === 'yes' && !changeVoteUntilDate);
  const isDiscussionTimeInvalid = discussionStartDate && discussionEndDate && discussionEndDate <= discussionStartDate;
  const isVotingTimeInvalid = votingStartDate && votingEndDate && votingEndDate <= votingStartDate;
  const isChangeVoteTimeInvalid = allowVoteChange === 'yes' && votingStartDate && changeVoteUntilDate && votingEndDate && (changeVoteUntilDate <= votingStartDate || votingEndDate < changeVoteUntilDate);
  const isEmailsInvalid = emails.length === 0;
  const isOptionsPerVoteInvalid = minOptionsPerVote && maxOptionsPerVote && (parseInt(minOptionsPerVote, 10) > parseInt(maxOptionsPerVote, 10));
  /*
  const isDropdownInvalid =
      allowSubmitOptions === 'Select' ||
      allowVoteChange === 'Select' ||
      minOptionsPerVote === 'Select' ||
      maxOptionsPerVote === 'Select';
  // Combine all validation checks
  */

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Quick type check
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      // split on newlines or commas
      const entries = text
        .split(/[\r\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const emailRx = /\S+@\S+\.\S+/;
      const newEmails = [];
      entries.forEach(addr => {
        if (emailRx.test(addr) && !emails.includes(addr) && !newEmails.includes(addr)) {
          newEmails.push(addr);
        }
      });

      if (newEmails.length) {
        setEmails(prev => [...prev, ...newEmails]);
      } else {
        toast.error('No new valid email addresses found in the CSV.');
      }
      // reset file input so you can re‐upload same file if needed
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
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

              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => (
                    <div key={index} className="bg-[#3395ff] text-white rounded-full px-3 py-1 flex items-center text-sm">
                      {option}
                      <button className="ml-2 text-white opacity-70 hover:opacity-100" onClick={() => removeOption(index)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {options.length === 0 && <p className="text-xs text-gray-500">Add at least one option.</p>}
              </div>
            </div>

            {/* Date and Time Selectors */}
            <div className="space-y-4 relative">
              <DateTimePicker
                label="Discussion starts at:"
                selectedDate={discussionStartDate}
                onChange={setDiscussionStartDate}
                id="discussion-start"
                error={attemptedSubmit && !discussionStartDate}
              />

              <DateTimePicker
                label="Discussion ends at:"
                selectedDate={discussionEndDate}
                onChange={setDiscussionEndDate}
                id="discussion-end"
                error={attemptedSubmit && !discussionEndDate}
              />
              {isDiscussionTimeInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">End time must be after start time.</p>
              )}

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
              <div className="flex items-center">
                <label className="w-[400px] font-medium mr-4">Allow Users to submit new Options?</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${attemptedSubmit && allowSubmitOptions === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={allowSubmitOptions}
                  onChange={(e) => setAllowSubmitOptions(e.target.value)}
                >
                  <option disabled value="Select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-[400px] font-medium mr-4">Allow Users to change their votes?</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${attemptedSubmit && allowVoteChange === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={allowVoteChange}
                  onChange={(e) => setAllowVoteChange(e.target.value)}
                >
                 <option disabled value="Select">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {/* Conditionally render the "change vote until" picker */}
              {allowVoteChange === 'yes' && (
                <>
                  <DateTimePicker
                    label="Allow users to change their vote until: *"
                    selectedDate={changeVoteUntilDate}
                    onChange={setChangeVoteUntilDate}
                    id="change-vote-until"
                    error={attemptedSubmit && !changeVoteUntilDate}
                  />
                  {isChangeVoteTimeInvalid && (
                    <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Must be between voting start and end.</p>
                  )}
                </>
              )}

              <div className="flex items-center">
                <label className="w-[400px] font-medium mr-4">Minimum number of Options the Users must vote for:</label>
                <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${attemptedSubmit && minOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
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
                <label className="w-[400px] font-medium mr-4">Maximum number of Options the Users can vote for:*</label>
                 <select
                  className={`border rounded px-3 py-1 w-24 transition-colors duration-200 ${attemptedSubmit && maxOptionsPerVote === 'Select' ? 'border-red-500' : 'border-gray-300'}`}
                  value={maxOptionsPerVote}
                  onChange={(e) => setMaxOptionsPerVote(e.target.value)}
                >
                  <option disabled value="Select">Select</option>
                  {[...Array(Math.max(1, options.length)).keys()].map(i =>
                     <option key={i+1} value={i+1}>{i+1}</option>
                   )}
                  <option value="no-limit">No Limit</option>
                </select>
              </div>
              {isOptionsPerVoteInvalid && (
                <p className="text-red-500 text-sm -mt-2 ml-64 pl-1">Min options per vote must be less than or equal to max.</p>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full md:w-1/3 p-8 flex flex-col">
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
                {/* hidden CSV input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleCsvUpload}
                />
                {/* CSV‐upload button */}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center border rounded-full px-4 py-1 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Plus size={16} className="mr-1" /> Add via .csv file...
                </button>
                <button
                    onClick={() => setShowEmailInput(!showEmailInput)}
                    className="flex items-center border rounded-full px-4 py-1 text-sm text-gray-600 hover:bg-gray-50">
                  <Plus size={16} className="mr-1" /> Add one by one...
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
            {/* Description */}
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#999', 
              marginTop: '2em' 
            }}>
              You can change these features afterwards. 
            </div>  
          </div>
        </div>
      </main>

      {/* Render the confirmation and links modals */}
      <ConfirmationModal />
      <LinksModal /> {/* Add the new modal */}
    </div>
  );
}

export default CreateRoom;