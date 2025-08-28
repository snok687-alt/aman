// src/components/VideoGrid.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getAllVideos, getVideosByCategory, searchVideos } from '../data/videoData';

const VideoGrid = ({ title, filter }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm, isDarkMode } = useOutletContext();

  useEffect(() => {
    setLoading(true);
    
    // ใช้ setTimeout เพื่อจำลองการโหลดข้อมูล
    const timer = setTimeout(() => {
      let allVideos;
      
      if (searchTerm && searchTerm.trim() !== '') {
        // ใช้ฟังก์ชัน searchVideos ที่อัปเดตแล้ว
        allVideos = searchVideos(searchTerm);
      } else if (filter && filter !== 'all') {
        allVideos = getVideosByCategory(filter);
      } else {
        allVideos = getAllVideos();
      }
      
      setVideos(allVideos);
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filter, searchTerm]);

  if (loading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>กำลังโหลดวิดีโอ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-2 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-full mx-auto">
        {searchTerm && searchTerm.trim() !== '' ? (
          <h1 className={`text-xl md:text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ผลการค้นหาสำหรับ: "{searchTerm}"
          </h1>
        ) : (
          <h1 className={`text-xl md:text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {title}
          </h1>
        )}
        
        {videos.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">
              {searchTerm && searchTerm.trim() !== '' 
                ? 'ไม่พบผลลัพธ์การค้นหา' 
                : 'ไม่พบวิดีโอในหมวดหมู่นี้'}
            </p>
            <p className="text-sm">
              {searchTerm && searchTerm.trim() !== '' 
                ? 'ลองใช้คำค้นหาอื่นหรือลองค้นด้วยแท็ก' 
                : 'ลองดูหมวดหมู่อื่นๆ ที่น่าสนใจ'}
            </p>
          </div>
        ) : (
          <>
            {searchTerm && searchTerm.trim() !== '' && (
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                พบ {videos.length} วิดีโอ
              </p>
            )}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {videos.map((video) => (
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

export default VideoGrid;