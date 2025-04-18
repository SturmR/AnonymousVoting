import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, X, Plus } from 'react-feather';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function CreateRoom() {
  // State for the form
  const [question, setQuestion] = useState('');
  const [newOption, setNewOption] = useState('');
  const [options, setOptions] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [emails, setEmails] = useState([
    'nazireata@gmail.com',
    'onurkafkas1@gmail.com',
    'birkan.yilmaz@bogazici.edu.tr'
  ]);

  const [discussionStartDate, setDiscussionStartDate] = useState(null);
  const [discussionEndDate, setDiscussionEndDate] = useState(null);
  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [changeVoteUntilDate, setChangeVoteUntilDate] = useState(null);

  // State to track which date picker is currently showing
  const [activeDatePicker, setActiveDatePicker] = useState(null);
    
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [canAddOption, setCanAddOption] = useState(true);
  const [canEditVote, setCanEditVote] = useState(true);
  const [minOptionsPerVote, setMinOptionsPerVote] = useState(1);
  const [maxOptionsPerVote, setMaxOptionsPerVote] = useState(1);

  // Handle create button click
  const handleCreate = () => {
    setShowModal(true);
  };
  
  // Handle confirmation: create the Room via backend, then navigate into it
  const handleConfirm = async () => {
    try {
      const payload = {
        title: question,
        description: '',            // or add a description field in state
        type: 'DiscussAndVote',
        discussionStart: discussionStartDate,
        discussionEnd:   discussionEndDate,
        votingStart:     votingStartDate,
        votingEnd:       votingEndDate,
        canAddOption,
        canEditVote,
        editVoteUntil:   changeVoteUntilDate,
        minOptionsPerVote,
        maxOptionsPerVote,
        userList:        emails     // assuming backend will create User docs
      };
  
      const { data: room } = await axios.post('/api/rooms', payload);
      setShowModal(false);
      // Redirect into the new room
      navigate(`/rooms/${room._id}`);
    } catch (err) {
      console.error('Room creation failed:', err);
      alert('Could not create room. Try again.');
    }
  };
  

  // Add this function inside your Meeting component
  const DateTimePicker = ({ label, selectedDate, onChange, id }) => {
    // Function to filter available times to 10-minute intervals (XX:X0)
    const filterTime = (time) => {
      const minutes = time.getMinutes();
      return minutes % 10 === 0;
    };

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
    if (newEmail.trim() && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
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
                className="w-full p-4 text-2xl text-gray-500 border-none focus:outline-none resize-none"
                placeholder="Write your question here..."
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              ></textarea>
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
                {options.length > 0 ? (
                  options.map((option, index) => (
                    <div key={index} className="bg-[#3395ff] text-white rounded-full px-3 py-1 flex items-center">
                      {option}
                      <button className="ml-2" onClick={() => removeOption(index)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  // Placeholder options
                  Array(10).fill(0).map((_, index) => (
                    <div key={index} className="bg-orange-500 text-white rounded-full px-3 py-1 flex items-center">
                      Orange
                      <button className="ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Date and Time Selectors */}
            {/* Date and Time Selectors */}
            <div className="space-y-4 relative">
              <DateTimePicker 
                label="Discussion starts at:"
                selectedDate={discussionStartDate}
                onChange={setDiscussionStartDate}
                id="discussion-start"
              />
              
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
              <div className="flex items-center">
                <label className="w-64 font-medium">Allow Users to submit new Options?</label>
                <select className="border rounded px-3 py-1 w-24"
                  value={canAddOption ? 'yes' : 'no'}
                  onChange={e => setCanAddOption(e.target.value === 'yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Allow Users to change their votes?</label>
                <select className="border rounded px-3 py-1 w-24"
                  value={canEditVote ? 'yes' : 'no'}
                  onChange={e => setCanEditVote(e.target.value === 'yes')}>
                  <option>Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Minimum number of Options the Users must vote for:</label>
                <select className="border rounded px-3 py-1 w-24"
                  value={minOptionsPerVote}
                  onChange={e => setMinOptionsPerVote(Number(e.target.value))}>
                 {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="0">No limit</option>
                </select>
              </div>

              <div className="flex items-center">
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

              <DateTimePicker 
                label="Allow users to change their vote until:"
                selectedDate={changeVoteUntilDate}
                onChange={setChangeVoteUntilDate}
                id="change-vote-until"
              />

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
      </main>
      
      {/* Render the confirmation modal */}
      <ConfirmationModal />
    </div>
  );
}

export default CreateRoom;