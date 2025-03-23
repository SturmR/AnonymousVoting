// src/pages/Meeting.js
import React, { useState } from 'react';
import { Calendar, Clock, X, Plus } from 'react-feather';

function Meeting() {
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
      {/* Header */}
      <header className="bg-[#3395ff] py-16 text-center">
        <h1 className="text-white text-4xl font-bold">Creation Page - Discuss&Vote</h1>
      </header>

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
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-48 font-medium">Discussion starts at:</label>
                <div className="flex">
                  <button className="border p-2 mr-2 rounded">
                    <Calendar size={20} />
                  </button>
                  <button className="border p-2 rounded">
                    <Clock size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="w-48 font-medium">Discussion ends at:</label>
                <div className="flex">
                  <button className="border p-2 mr-2 rounded">
                    <Calendar size={20} />
                  </button>
                  <button className="border p-2 rounded">
                    <Clock size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="w-48 font-medium">Voting starts at:</label>
                <div className="flex">
                  <button className="border p-2 mr-2 rounded">
                    <Calendar size={20} />
                  </button>
                  <button className="border p-2 rounded">
                    <Clock size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="w-48 font-medium">Voting ends at:</label>
                <div className="flex">
                  <button className="border p-2 mr-2 rounded">
                    <Calendar size={20} />
                  </button>
                  <button className="border p-2 rounded">
                    <Clock size={20} />
                  </button>
                </div>
              </div>

              {/* Dropdown Selectors */}
              <div className="flex items-center">
                <label className="w-64 font-medium">Allow Users to submit new Options?</label>
                <select className="border rounded px-3 py-1 w-24">
                  <option>Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-64 font-medium">Allow Users to change their votes?</label>
                <select className="border rounded px-3 py-1 w-24">
                  <option>Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center">
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

              <div className="flex items-center">
                <label className="w-64 font-medium">Allow users to change their vote until:</label>
                <div className="flex">
                  <button className="border p-2 mr-2 rounded">
                    <Calendar size={20} />
                  </button>
                  <button className="border p-2 rounded">
                    <Clock size={20} />
                  </button>
                </div>
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
      </main>
    </div>
  );
}

export default Meeting;