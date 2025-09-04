import React from 'react';

const VideoCardSkeleton = ({ isDarkMode }) => (
  <div className={`rounded-lg overflow-hidden shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
    <div className="relative aspect-[3/4] bg-gray-600 animate-pulse"></div>
    <div className="p-3">
      <div className={`h-4 bg-gray-600 rounded mb-2 animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}></div>
      <div className={`h-3 bg-gray-600 rounded mb-1 animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}></div>
      <div className={`h-3 bg-gray-600 rounded w-2/3 animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}></div>
    </div>
  </div>
);

export default VideoCardSkeleton;