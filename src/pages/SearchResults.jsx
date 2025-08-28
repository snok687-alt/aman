// src/pages/SearchResults.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { searchVideos } from '../data/videoData';

const SearchResults = () => {
  const location = useLocation();
  const { isDarkMode, searchTerm, setSearchTerm } = useOutletContext();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // รับคำค้นหาจาก state หรือ query parameters
  const searchQuery = location.state?.searchTerm || 
                      new URLSearchParams(location.search).get('q') || 
                      searchTerm || 
                      '';

  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
      performSearch(searchQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchQuery, setSearchTerm]);

  // ฟังก์ชันสำหรับการค้นหา
  const performSearch = (query) => {
    setLoading(true);
    
    // ใช้ฟังก์ชัน searchVideos จาก videoData.js
    const searchResults = searchVideos(query);
    
    setTimeout(() => {
      setResults(searchResults);
      setLoading(false);
    }, 300);
  };

  // ฟังก์ชันสำหรับการอัปเดตการค้นหาผ่าน event
  useEffect(() => {
    const handleSearchUpdated = (event) => {
      const newSearchTerm = event.detail;
      setSearchTerm(newSearchTerm);
      performSearch(newSearchTerm);
    };

    window.addEventListener('searchUpdated', handleSearchUpdated);
    
    return () => {
      window.removeEventListener('searchUpdated', handleSearchUpdated);
    };
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>กำลังค้นหาวิดีโอ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-xl md:text-2xl text-start font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {searchQuery ? `ผลการค้นหาสำหรับ: "${searchQuery}"` : 'ค้นหาวิดีโอ'}
        </h1>
        
        {results.length === 0 && searchQuery ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg mb-2">ไม่พบผลลัพธ์การค้นหา</p>
            <p className="text-sm">ลองใช้คำค้นหาอื่นหรือลองค้นด้วยแท็ก</p>
          </div>
        ) : results.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg mb-2">เริ่มต้นการค้นหา</p>
            <p className="text-sm">พิมพ์คำค้นหาในช่องด้านบนเพื่อค้นหาวิดีโอ</p>
          </div>
        ) : (
          <>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              พบ {results.length} วิดีโอ
            </p>
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {results.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;