import React from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/'); // Redirects to the homepage
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
      <div className="bg-white shadow-xl p-8 md:p-12 text-center">
        <img
          src="cat.png" // Add the generated image
          alt="Cute Cat"
          className="mb-4 w-64 h-64 object-cover mx-auto"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4">Oopsie Daisy!</h1>
        <p className="text-xl md:text-2xl mb-6">Something went wrong or the page you requested could not be found.</p>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          It looks like the user ID might not be valid for this room, 
          or the room ID might be invalid, 
          or the poll might've been deleted, 
          or the world might be ending, 
          or there's another issue. Who knows?
        </p>
        <button
          onClick={handleGoHome}
          className="bg-[#3395ff] hover:bg-[#0066cc] text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;