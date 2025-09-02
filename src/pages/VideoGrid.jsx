import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getCategoryName, getFilterName } from '../utils/Category';
import { fetchVideosFromAPI, getVideosByCategory, searchVideos, getMoreVideosInCategory } from '../data/videoData';

// Skeleton Loading Component
const VideoCardSkeleton = ({ isDarkMode }) => (
  <div className={`rounded-lg overflow-hidden shadow-md ${
    isDarkMode ? 'bg-gray-800' : 'bg-white'
  }`}>
    <div className="relative aspect-[3/4] bg-gray-600 animate-pulse"></div>
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { searchTerm, isDarkMode } = useOutletContext();
  const location = useLocation();

  // ตรวจสอบว่าเป็น path category หรือไม่
  const isCategoryPage = location.pathname.startsWith('/category/');
  const categoryId = isCategoryPage ? location.pathname.split('/').pop() : null;

  // ฟังก์ชันโหลดวิดีโอครั้งแรก
  const loadInitialVideos = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    
    try {
      let videosData = [];
      
      if (searchTerm && searchTerm.trim() !== '') {
        // กรณีค้นหา - ค้นหาในหมวดหมู่ปัจจุบัน
        if (isCategoryPage) {
          // ค้นหาในหมวดหมู่เฉพาะ
          const allCategoryVideos = await getVideosByCategory(categoryId);
          // กรองด้วยคำค้นหา
          videosData = allCategoryVideos.filter(video => 
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.channelName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (filter && filter !== 'all') {
          // ค้นหาในหมวดหมู่ filter
          const allFilterVideos = await fetchVideosFromAPI(filter);
          // กรองด้วยคำค้นหา
          videosData = allFilterVideos.filter(video => 
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.channelName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          // ค้นหาทั้งหมด
          videosData = await searchVideos(searchTerm);
        }
      } else {
        // กรณีไม่ค้นหา - แสดงตามหมวดหมู่
        if (isCategoryPage) {
          // แสดงเฉพาะหมวดหมู่
          videosData = await getVideosByCategory(categoryId, 20); // โหลด 20 วิดีโอ
        } else if (filter && filter !== 'all') {
          // แสดงตาม filter
          videosData = await fetchVideosFromAPI(filter, '', 20); // โหลด 20 วิดีโอ
        } else {
          // แสดงทั้งหมด
          videosData = await fetchVideosFromAPI('', '', 20); // โหลด 20 วิดีโอ
        }
      }
      
      setVideos(videosData);
      setHasMore(videosData.length >= 20); // ตรวจสอบว่ามีข้อมูลเพิ่มเติมหรือไม่
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, isCategoryPage, categoryId]);

  // ฟังก์ชันโหลดวิดีโอเพิ่มเติม
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      let moreVideos = [];
      const nextPage = currentPage + 1;
      
      if (searchTerm && searchTerm.trim() !== '') {
        // ในกรณีค้นหา เราโหลดทั้งหมดมาแล้ว ไม่ต้องโหลดเพิ่ม
        setHasMore(false);
      } else {
        // กรณีไม่ค้นหา - โหลดเพิ่มตามหมวดหมู่
        if (isCategoryPage) {
          // โหลดเพิ่มในหมวดหมู่เดียวกัน
          const categoryName = getCategoryName(categoryId);
          const result = await getMoreVideosInCategory(
            categoryName, 
            videos.map(v => v.id), 
            nextPage, 
            5 // โหลดเพิ่มครั้งละ 5 วิดีโอ
          );
          moreVideos = result.videos;
          setHasMore(result.hasMore);
        } else if (filter && filter !== 'all') {
          // โหลดเพิ่มตาม filter
          moreVideos = await fetchVideosFromAPI(filter, '', 5, nextPage); // โหลด 5 วิดีโอ
          setHasMore(moreVideos.length >= 5);
        } else {
          // โหลดเพิ่มทั้งหมด
          moreVideos = await fetchVideosFromAPI('', '', 5, nextPage); // โหลด 5 วิดีโอ
          setHasMore(moreVideos.length >= 5);
        }
      }
      
      if (moreVideos.length > 0) {
        setVideos(prevVideos => [...prevVideos, ...moreVideos]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, searchTerm, isCategoryPage, categoryId, filter, videos]);

  // ตั้งค่า Intersection Observer สำหรับ infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreVideos();
        }
      },
      { threshold: 1.0 }
    );
    
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }
    
    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [loadMoreVideos, hasMore, loadingMore]);

  // โหลดวิดีโอครั้งแรกเมื่อพารามิเตอร์เปลี่ยน
  useEffect(() => {
    // ใช้ debounce สำหรับ search เพื่อไม่ให้เรียก API บ่อยเกินไป
    const timeoutId = setTimeout(loadInitialVideos, searchTerm ? 300 : 0);
    
    return () => clearTimeout(timeoutId);
  }, [loadInitialVideos, searchTerm]);

  // ตั้งชื่อ title ตามสถานะ
  let displayTitle = title;
  if (searchTerm && searchTerm.trim() !== '') {
    if (isCategoryPage) {
      const categoryName = getCategoryName(categoryId);
      displayTitle = `ค้นหา "${searchTerm}" ใน ${categoryName}`;
    } else if (filter && filter !== 'all') {
      const filterName = getFilterName(filter);
      displayTitle = `ค้นหา "${searchTerm}" ใน ${filterName}`;
    } else {
      displayTitle = `ผลการค้นหาสำหรับ: "${searchTerm}"`;
    }
  } else if (isCategoryPage) {
    const categoryName = getCategoryName(categoryId);
    displayTitle = categoryName;
  }

  // แสดง Skeleton Loading ครั้งแรก
  if (loading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 w-64 rounded mb-6 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
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
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-xl md:text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {displayTitle}
        </h1>
        
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
            <div className="grid grid-cols-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {videos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
            
            {/* Loading More Skeleton */}
            {loadingMore && (
              <div className="grid grid-cols-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 mt-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <VideoCardSkeleton key={`skeleton-${index}`} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}
            
            {/* Scroll Sentinel สำหรับตรวจจับเมื่อเลื่อนถึงล่าง */}
            <div id="scroll-sentinel" className="h-10 w-full"></div>
            
            {/* แสดงข้อความเมื่อโหลดครบทั้งหมดแล้ว */}
            {!hasMore && videos.length > 0 && (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>โหลดวิดีโอครบทั้งหมดแล้ว</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;