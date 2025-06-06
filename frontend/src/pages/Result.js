import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, BarChart2, PieChart } from 'react-feather';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function RoomResults() {
  const { roomId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [isResultsReady, setIsResultsReady] = useState(false); // Controls rendering of main content
  const [showResultsNotStartedModal, setShowResultsNotStartedModal] = useState(false); // Controls blocking modal visibility

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Fetch all necessary data in parallel
        const [roomRes, optionsRes, votesRes, commentsRes] = await Promise.all([
          axios.get(`/api/rooms/${roomId}`),
          axios.get(`/api/options?room=${roomId}`),
          axios.get(`/api/votes?room=${roomId}`),
          axios.get(`/api/comments?room=${roomId}`)
        ]);

        if( new Date(roomRes.data.votingEnd) > new Date() ) { // voting has not ended
          setShowResultsNotStartedModal(true);
          setIsResultsReady(false); 
          return;
        } else {
          setShowResultsNotStartedModal(false);
          setIsResultsReady(true);
        }
        // Process data
        const optionsWithVotes = optionsRes.data.map(option => ({
          ...option,
          // Calculate percentage based on total votes, default to 0 if no votes
          percentage: (votesRes.data.length > 0) ? Math.round((option.numberOfVotes / votesRes.data.length) * 100) : 0
        }));

        // Determine winners (can be multiple)
        const winners = [];
        if (optionsWithVotes && optionsWithVotes.length > 0) {
          // Sort to find the highest vote count
          optionsWithVotes.sort((a, b) => b.numberOfVotes - a.numberOfVotes);
          const maxVotes = optionsWithVotes[0].numberOfVotes;

          // Collect all options that have the maximum vote count
          for (const option of optionsWithVotes) {
            if (option.numberOfVotes === maxVotes) {
              winners.push(option);
            } else {
              // Since the array is sorted, we can stop once we find an option with fewer votes
              break;
            }
          }
        }

        // Filter out options with 0 votes for chart display
        const filteredOptionsForCharts = optionsWithVotes.filter(opt => opt.numberOfVotes > 0);

        setStats({
          room: roomRes.data,
          winners, // Now an array
          options: optionsWithVotes, // Keep all options for detailed results
          totalUsers: roomRes.data.userList?.length || 0,
          totalVotes: votesRes.data.length,
          totalOptions: optionsRes.data.length,
          totalComments: commentsRes.data.length,
          roomType: roomRes.data.type,
          // Use filtered options for vote distribution in charts
          voteDistribution: filteredOptionsForCharts.map(opt => ({
            name: roomRes.data.type === 'DiscussAndVote' ? opt.content : formatDate(opt.content),
            votes: opt.numberOfVotes,
            percentage: opt.percentage
          }))
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [roomId]);

  // Formats date string to "DD/MM/YYYY, HH:MM" for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Convert to local time by adjusting for timezone offset
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).replace(/\./g, '/'); // Replace dots with slashes for DD/MM/YYYY
    const formattedTime = localDate.toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit'
    });
    return `${formattedDate}, ${formattedTime}`;
  };

  // Formats date string to "DD/MM/YYYY\nHH:MM" for chart labels
  const formatChartLabel = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).replace(/\./g, '/');
    const formattedTime = localDate.toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit'
    });
    return `${formattedDate}\n${formattedTime}`;
  };

  // Helper function to render winner name with multiline support for PickATime
  const renderWinnerName = (winner) => {
    if (stats.roomType === 'DiscussAndVote') {
      return winner.content;
    } else { // PickATime
      const formattedLabel = formatChartLabel(winner.content); // "DD/MM/YYYY\nHH:MM"
      const [datePart, timePart] = formattedLabel.split('\n');
      return (
        <>
          <br />
          {datePart} {timePart}
        </>
      );
    }
  };

  const handleDownload = () => {
    // Generate CSV content from all options (not just filtered ones)
    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...stats.options.map(opt => [
        stats.roomType === 'DiscussAndVote' ? opt.content : formatDate(opt.content),
        opt.numberOfVotes,
        `${opt.percentage}%`
      ])
    ].map(e => e.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `results_${roomId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center">Loading results...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  // Ensure stats and voteDistribution exist before rendering charts
  if( !isResultsReady ) { 
    return (
      <ResultsNotOutModal show={showResultsNotStartedModal} />
    );
  }
  if (!stats || !stats.voteDistribution) return <div className="p-8">No results found or data is incomplete.</div>;

  return (
    <div className="flex-grow flex justify-center p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl w-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#3395ff] text-white p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Results for: {stats.room.title}</h1>
          <p className="text-blue-100">{stats.room.description}</p>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Main Results */}
          <div className="w-full md:w-2/3 p-6 border-r border-gray-200">
            {/* Winner Banner */}
            <div className="mb-8 p-4 bg-green-50 border rounded-lg">
              <h2 className="text-3xl font-bold ">
                Winner{stats.winners.length > 1 ? 's' : ''}:
                {stats.winners.length > 0 ? (
                  stats.winners.map((winner, index) => (
                    <React.Fragment key={winner._id}>
                      {renderWinnerName(winner)}
                      {index < stats.winners.length - 1 ? ', ' : ''}
                    </React.Fragment>
                  ))
                ) : (
                  <span>No clear winner yet.</span>
                )}
                {stats.winners.length > 0 && stats.winners[0].numberOfVotes > 0 ? ' 🎉' : ''}
              </h2>
              {stats.winners.length > 0 && stats.winners[0].numberOfVotes > 0 && (
                <p className=" mt-2">
                  {stats.winners.length > 1
                    ? `All winners have ${stats.winners[0].percentage}% of votes (${stats.winners[0].numberOfVotes} votes)`
                    : `${stats.winners[0].percentage}% of votes (${stats.winners[0].numberOfVotes} votes)`}
                </p>
              )}
              {stats.winners.length === 0 && stats.totalVotes === 0 && (
                <p className="mt-2">No votes have been cast yet.</p>
              )}
            </div>

            {/* Chart Toggle */}
            <div className="flex justify-end mb-4 space-x-2">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-[#3395ff] text-white' : 'bg-gray-200'}`}
              >
                <BarChart2 size={16} className="inline mr-1" /> Bar
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 rounded ${chartType === 'pie' ? 'bg-[#3395ff] text-white' : 'bg-gray-200'}`}
              >
                <PieChart size={16} className="inline mr-1" /> Pie
              </button>
            </div>

            {/* Chart */}
            <div className="h-80 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={stats.voteDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name"
                            width={24}
                            height={24}
                            padding={{ left: 20, right: 20 }}
                            />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                    <Legend />
                    <Bar dataKey="votes" name="Votes" fill="#3395ff" />
                  </BarChart>
                ) : (
                  <RechartsPieChart>
                    <Pie
                      data={stats.voteDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {stats.voteDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [
                      `${value} votes`,
                      `${props.payload.percentage}%`
                    ]} />
                  </RechartsPieChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold mb-2">Detailed Results:</h3>
              {stats.options.map((option, index) => (
                <div key={option._id} className="flex items-center">
                  <div className="w-24 font-medium">{stats.roomType === 'DiscussAndVote' ? option.content : formatDate(option.content)}</div>
                  <div className="flex-1 mx-2">
                    <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${option.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    {option.percentage}% ({option.numberOfVotes})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="w-full md:w-1/3 p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Totals:</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li className="font-medium">Number of Users: {stats.totalUsers}</li>
                <li className="font-medium">Number of Votes: {stats.totalVotes}</li>
                <li className="font-medium">Number of Options: {stats.totalOptions}</li>
                <li className="font-medium">Number of Comments: {stats.totalComments}</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Export</h3>
              <button
                onClick={handleDownload}
                className="w-full bg-[#3395ff] hover:bg-[#0066cc] text-white py-2 px-4 rounded flex items-center justify-center"
              >
                <Download size={18} className="mr-2" />
                Download Full Results (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomResults;

const ResultsNotOutModal = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Results Are Not Available Yet</h2>
        <p className="text-gray-600 mb-6">
          Be patient! The results will be available after the voting ends.
        </p>
      </div>
    </div>
  );
};