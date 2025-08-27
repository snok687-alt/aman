// src/components/VideoGrid.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getAllVideos, getVideosByCategory } from '../data/videoData';

const VideoGrid = ({ title, filter }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let allVideos;
      
      if (searchTerm && searchTerm.trim() !== '') {
        // หากมีคำค้นหา ให้ค้นหาจากคำค้นหา
        const searchResults = getAllVideos().filter(video => {
          const searchLower = searchTerm.toLowerCase();
          return (
            video.title.toLowerCase().includes(searchLower) ||
            video.channelName.toLowerCase().includes(searchLower) ||
            (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
            video.category.toLowerCase().includes(searchLower)
          );
        });
        allVideos = searchResults;
      } else if (filter && filter !== 'all') {
        // หากไม่มีคำค้นหา แต่มี filter ให้กรองตามหมวดหมู่
        allVideos = getVideosByCategory(filter);
      } else {
        // หากไม่มีทั้งคำค้นหาและ filter ให้แสดงทั้งหมด
        allVideos = getAllVideos();
      }
      
      setVideos(allVideos);
      setLoading(false);
    }, 500);
  }, [filter, searchTerm]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">กำลังโหลดวิดีโอ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {searchTerm && searchTerm.trim() !== '' && (
          <h1 className="text-xl md:text-2xl font-bold mb-6 text-white">
            ผลการค้นหาสำหรับ: "{searchTerm}"
          </h1>
        )}
        
        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
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
              <p className="text-gray-400 mb-6">พบ {videos.length} วิดีโอ</p>
            )}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;