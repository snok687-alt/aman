// src/components/SearchBox.jsx
import React, { useState } from 'react';

const SearchBox = ({ onSearchResults, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchResults) {
      onSearchResults(searchTerm);
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="flex-1 max-w-2xl mx-4"
    >
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาวิดีโอ..."
          className={`w-full py-2 pl-10 pr-4 rounded-full border focus:outline-none focus:ring-2 focus:ring-red-500 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-black placeholder-gray-500'
          }`}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </form>
  );
};

export default SearchBox;