// src/pages/SearchResults.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';

const SearchResults = () => {
  const { searchTerm } = useOutletContext();
  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    // จำลองการโหลดข้อมูล
    setTimeout(() => {
      if (searchTerm && searchTerm.trim() !== '') {
        const searchResults = require('../data/videoData').getAllVideos().filter(video => {
          const searchLower = searchTerm.toLowerCase();
          return (
            video.title.toLowerCase().includes(searchLower) ||
            video.channelName.toLowerCase().includes(searchLower) ||
            (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
            video.category.toLowerCase().includes(searchLower)
          );
        });
        setResults(searchResults);
      } else {
        setResults([]);
      }
    }, 300);
  }, [searchTerm]);

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-white">
          ผลการค้นหาสำหรับ: "{searchTerm}"
        </h1>
        
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg mb-2">ไม่พบผลลัพธ์การค้นหา</p>
            <p className="text-sm">ลองใช้คำค้นหาอื่นหรือลองค้นด้วยแท็ก</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">พบ {results.length} วิดีโอ</p>
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {results.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;