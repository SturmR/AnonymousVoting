// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Main Content */}
      <main className="flex-grow flex justify-center items-center p-8">
        <div className="max-w-6xl w-full flex flex-col md:flex-row gap-0">
          {/* Discuss & Vote Panel */}
          <div className="w-full md:w-1/2 bg-[#cce4ff] border border-dashed border-[#99caff] p-12 flex flex-col items-center justify-between">
            <div className="text-center space-y-6">
              <h2 className="text-[#303030] text-3xl font-bold">Discuss & Vote</h2>
              <p className="text-[#303030] max-w-md mx-auto">
                Users discuss and vote on Options, with configurable settings defined by the Host.
              </p>
            </div>
            <button 
              className="mt-8 bg-[#004999] text-white px-6 py-2 rounded hover:bg-[#003d80] transition-colors"
              onClick={() => navigate('/meeting')}
            >
              Start Setting Up
            </button>
          </div>

          {/* Pick A Time Panel */}
          <div className="w-full md:w-1/2 bg-[#99caff] border border-dashed border-[#99caff] p-12 flex flex-col items-center justify-between">
            <div className="text-center space-y-6">
              <h2 className="text-[#303030] text-3xl font-bold">Pick A Time</h2>
              <p className="text-[#303030] max-w-md mx-auto">
                A simplified poll for scheduling without discussion.
              </p>
            </div>
            <button 
              className="mt-8 bg-[#004999] text-white px-6 py-2 rounded hover:bg-[#003d80] transition-colors"
              onClick={() => navigate('/pickatime')}
            >
              Start Setting Up
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;