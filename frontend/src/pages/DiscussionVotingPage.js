// src/pages/VotingPage.js
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'react-feather';

function DiscussionVotingPage() {
  // State for user data
  const [nickname, setNickname] = useState('user#4687');
  const [question, setQuestion] = useState('We are planning to paint all the walls of the office! What should be the new color?');
  
  // Options with selection state
  const [options, setOptions] = useState([
    { id: 1, text: 'Blue', votes: 10, selected: false },
    { id: 2, text: 'Blue', votes: 10, selected: false },
    { id: 3, text: 'Blue', votes: 10, selected: false },
    { id: 4, text: 'Blue', votes: 10, selected: false },
    { id: 5, text: 'Blue', votes: 10, selected: false },
    { id: 6, text: 'Blue', votes: 10, selected: false },
    { id: 7, text: 'Blue', votes: 10, selected: false },
    { id: 8, text: 'Blue', votes: 10, selected: false },
    { id: 9, text: 'Blue', votes: 10, selected: false },
    { id: 10, text: 'Orangensaftgeschmack', votes: 10, selected: false },
    { id: 11, text: 'Blue', votes: 10, selected: true },
  ]);
  
  // Poll info
  const [pollInfo, setPollInfo] = useState({
    canAddOptions: true,
    votingBegins: new Date('2025-03-18T10:00:00'),
    votingEnds: new Date('2025-03-22T23:59:00'),
    votesEditableUntil: new Date('2025-03-22T10:00:00'),
    minSelectOptions: 2,
    maxSelectOptions: 6
  });
  
  // Time remaining states
  const [discussionTimeRemaining, setDiscussionTimeRemaining] = useState({ days: 1, hours: 2, minutes: 30 });
  const [votingTimeRemaining, setVotingTimeRemaining] = useState({ days: 3, hours: 2, minutes: 30 });
  
  // Count selected options
  const selectedCount = options.filter(option => option.selected).length;
  const canSubmit = selectedCount >= pollInfo.minSelectOptions && selectedCount <= pollInfo.maxSelectOptions;
  
  // Toggle option selection
  const toggleOption = (id) => {
    setOptions(options.map(option => 
      option.id === id 
        ? { ...option, selected: !option.selected } 
        : option
    ));
  };
  
  // Format date to display
  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '') + ', ' + 
    date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section - Voting */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{question}</h2>
          </div>

          {/* Options */}
          <div className="mb-8">
            <div className="flex items-start mb-4">
              <h3 className="text-xl font-bold mr-4 mt-2">Options:</h3>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    className={`${
                      option.selected 
                        ? 'bg-[#0066cc] text-white' 
                        : 'bg-[#3395ff] text-white'
                    } rounded-full px-3 py-1 flex items-center`}
                    onClick={() => toggleOption(option.id)}
                  >
                    {option.text} ({option.votes})
                    {option.selected && (
                      <span className="ml-1">
                        <X size={14} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection Requirements */}
          <div className="mt-12">
            <p className="text-lg font-medium">
              You must select at least {pollInfo.minSelectOptions}, at most {pollInfo.maxSelectOptions} Options to submit your Vote.
            </p>
          </div>
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Welcome, {nickname}</h3>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
            <p className="mb-2">{pollInfo.canAddOptions ? 'You can add options' : 'You cannot add options'}</p>
            <p className="mb-1">Voting begins: {formatDate(pollInfo.votingBegins)}</p>
            <p className="mb-1">Voting ends: {formatDate(pollInfo.votingEnds)}</p>
            <p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Time remaining for Discussion:</h3>
            <p className="mb-1">{discussionTimeRemaining.days} days</p>
            <p className="mb-1">{discussionTimeRemaining.hours} hours</p>
            <p className="mb-4">{discussionTimeRemaining.minutes} minutes</p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Time remaining for Voting:</h3>
            <p className="mb-1">{votingTimeRemaining.days} days</p>
            <p className="mb-1">{votingTimeRemaining.hours} hours</p>
            <p className="mb-4">{votingTimeRemaining.minutes} minutes</p>
          </div>
          
          <div className="space-y-4">
            <button className="flex items-center bg-[#3395ff] hover:bg-[#2980e4] text-white rounded px-4 py-2 w-full justify-center">
              <ArrowLeft size={16} className="mr-2" /> Go back to Discussion
            </button>
            
            <button 
              className={`flex items-center ${
                canSubmit 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } rounded px-4 py-2 w-full justify-center`}
              disabled={!canSubmit}
            >
              Submit Vote <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscussionVotingPage;