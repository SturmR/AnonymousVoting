import React from 'react';
import { ThumbsUp, ThumbsDown } from 'react-feather';

export default function Comment({ comment, onVote }) {
  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) return 'today';
    if (diffInDays === 1) return 'yesterday';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="border-b pb-4">
      <div className="flex items-center mb-2">
        <span className="font-semibold mr-2">{comment.user?.username || 'Anonymous'}</span>

        {comment.isPro && (
          <span className="bg-green-100 text-green-700 text-xs rounded-full px-2 py-1 mr-1">
            Pro
          </span>
        )}
        {comment.isCon && (
          <span className="bg-red-100 text-red-700 text-xs rounded-full px-2 py-1 mr-1">
            Con
          </span>
        )}
        {comment.relatedOption?.content && (
          <span className="bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1 mr-1">
            {comment.relatedOption.content}
          </span>
        )}

        <span className="ml-auto text-gray-500 text-sm">{timeAgo(comment.createdAt)}</span>
      </div>

      <p className="mb-2">{comment.content}</p>

      <div className="flex items-center text-gray-500">
        <button
          onClick={() => onVote(comment._id, 'upvote')}
          className={`mr-2 ${comment.upvoted ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <ThumbsUp size={16} />
        </button>
        <button
          onClick={() => onVote(comment._id, 'downvote')}
          className={`mr-2 ${comment.downvoted ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <ThumbsDown size={16} />
        </button>
        <span>{comment.votes ?? 0} votes</span>
      </div>
    </div>
  );
}
