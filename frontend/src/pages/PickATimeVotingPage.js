// src/pages/PickATimeVoting.js
import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'react-feather';

function PickATimeVotingPage() {
  // State for user data
  const [nickname, setNickname] = useState('user#4687');
  const [question, setQuestion] = useState('Time to discuss the annual report! What time shall we meet?');
  
  // Generate dates for the time grid (7 columns for 7 days)
  const dates = Array(7).fill(0).map((_, i) => {
    const date = new Date('2025-04-04');
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '');
  });
  
  // Generate time slots (09:00 repeated for the grid)
  const timeSlots = Array(16).fill('09:00');
  
  // State for selected time slots
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // Poll info
  const [pollInfo, setPollInfo] = useState({
    votingBegins: new Date('2025-03-18T10:00:00'),
    votingEnds: new Date('2025-03-22T23:59:00'),
    votesEditableUntil: new Date('2025-03-22T10:00:00'),
  });
  
  // Toggle time slot selection
  const toggleTimeSlot = (dateIndex, timeIndex) => {
    const slotKey = `${dateIndex}-${timeIndex}`;
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(slot => slot !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
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
        {/* Left Section - Time Selection */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{question}</h2>
          </div>

          {/* Date Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dates.map((date, index) => (
              <div key={index} className="text-center font-medium">
                {date}
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-7 gap-2">
            {timeSlots.map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {dates.map((_, colIndex) => (
                  <button
                    key={`${colIndex}-${rowIndex}`}
                    className={`border rounded p-2 text-center ${
                      selectedSlots.includes(`${colIndex}-${rowIndex}`)
                        ? 'bg-[#3395ff] text-white'
                        : 'border-[#3395ff] text-[#3395ff] hover:bg-blue-50'
                    }`}
                    onClick={() => toggleTimeSlot(colIndex, rowIndex)}
                  >
                    09:00
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Section - Info */}
        <div className="w-full md:w-1/3 p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Welcome, {nickname}</h3>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Poll Info:</h3>
            <p className="mb-1">Voting begins: {formatDate(pollInfo.votingBegins)}</p>
            <p className="mb-1">Voting ends: {formatDate(pollInfo.votingEnds)}</p>
            <p className="mb-4">Votes can be edited until: {formatDate(pollInfo.votesEditableUntil)}</p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Time remaining for Voting:</h3>
            <p>Voting hasn't started yet.</p>
          </div>
          
          <div className="mt-auto">
            <button 
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-2 w-full justify-center"
            >
              Submit Vote <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickATimeVotingPage;