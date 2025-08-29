import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { fetchVideosFromAPI } from '../data/videoData';

// Skeleton Loading Component
const VideoCardSkeleton = ({ isDarkMode }) => (
  <div className={`rounded-lg overflow-hidden shadow-md ${
    isDarkMode ? 'bg-gray-800' : 'bg-white'
  }`}>
    <div className="relative aspect-video bg-gray-600 animate-pulse"></div>
    <div className="p-3">
      <div className={`h-4 bg-gray-600 rounded mb-2 animate-pulse ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
      }`}></div>
      <div className={`h-3 bg-gray-600 rounded mb-1 animate-pulse ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
      }`}></div>
      <div className={`h-3 bg-gray-600 rounded w-2/3 animate-pulse ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
      }`}></div>
    </div>
  </div>
);

const VideoGrid = ({ title, filter }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm, isDarkMode } = useOutletContext();

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      
      try {
        const videosData = await fetchVideosFromAPI(filter === 'all' ? '' : filter, searchTerm);
        setVideos(videosData);
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // ใช้ debounce สำหรับ search เพื่อไม่ให้เรียก API บ่อยเกินไป
    const timeoutId = setTimeout(loadVideos, searchTerm ? 300 : 0);
    
    return () => clearTimeout(timeoutId);
  }, [filter, searchTerm]);

  // แสดง Skeleton Loading
  if (loading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 w-64 rounded mb-6 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <VideoCardSkeleton key={index} isDarkMode={isDarkMode} />
            ))}
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