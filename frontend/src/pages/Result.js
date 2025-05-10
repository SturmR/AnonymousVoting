// src/pages/RoomResults.js
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

        // Process data
        const optionsWithVotes = optionsRes.data.map(option => ({
          ...option,
          percentage: Math.round((option.numberOfVotes / votesRes.data.length) * 100) || 0
        }));

        // Determine winner
        const winner = [...optionsWithVotes].sort((a, b) => b.numberOfVotes - a.numberOfVotes)[0];

        setStats({
          room: roomRes.data,
          winner,
          options: optionsWithVotes,
          totalUsers: roomRes.data.userList?.length || 0,
          totalVotes: votesRes.data.length,
          totalOptions: optionsRes.data.length,
          totalComments: commentsRes.data.length,
          voteDistribution: optionsWithVotes.map(opt => ({
            name: opt.content,
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

  const handleDownload = () => {
    // Generate CSV content
    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...stats.voteDistribution.map(opt => [opt.name, opt.votes, `${opt.percentage}%`])
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
  if (!stats) return <div className="p-8">No results found</div>;

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
                Winner: {stats.winner.content} {stats.options[0].content} {stats.options[0].votes}
              </h2>
              <p className=" mt-2">
                {stats.winner.percentage}% of votes ({stats.winner.numberOfVotes} votes)
              </p>
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
                    <XAxis dataKey="name" />
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
                  <div className="w-24 font-medium">{option.content}</div>
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