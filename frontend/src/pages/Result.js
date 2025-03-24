// src/pages/Result.js
import React from 'react';
import { Download } from 'react-feather';

function Result() {
  // Statistics data
  const stats = {
    winner: 'Blue',
    users: 196,
    votes: 153,
    options: 6,
    comments: 526
  };

  // Handle download results
  const handleDownload = () => {
    // In a real app, this would generate and download a CSV or PDF file
    console.log('Downloading results...');
    alert('Results download started');
  };

  return (
    <div className="flex-grow flex justify-center p-8">
      <div className="max-w-6xl w-full border border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row">
        {/* Left Section - Results */}
        <div className="w-full md:w-2/3 p-8 border-r border-dashed border-gray-300">
          {/* Winner */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-800">Winner: {stats.winner}</h2>
          </div>

          {/* This is where a chart or detailed results would go */}
          <div className="h-96">
            {/* Placeholder for chart or detailed results */}
            {/* In a real app, you would add a chart component here */}
          </div>
        </div>

        {/* Right Section - Statistics */}
        <div className="w-full md:w-1/3 p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Totals:</h3>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li className="font-medium">Number of Users: {stats.users}</li>
              <li className="font-medium">Number of votes: {stats.votes}</li>
              <li className="font-medium">Number of Options: {stats.options}</li>
              <li className="font-medium">Number of comments: {stats.comments}</li>
            </ul>
          </div>

          <div className="mt-8">
            <button 
              className="w-full bg-[#004999] text-white rounded py-2 font-medium flex items-center justify-center"
              onClick={handleDownload}
            >
              Download the results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Result;