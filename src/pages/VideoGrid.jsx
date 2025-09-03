import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getCategoryName, getFilterName } from '../utils/Category';
import { fetchVideosFromAPI, getVideosByCategory, searchVideos, getMoreVideosInCategory, getAllVideosWithPagination } from '../data/videoData';

// Skeleton Loading Component
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

const VideoGrid = ({ title, filter }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPagesLoaded, setTotalPagesLoaded] = useState(0);
  const [loadingAllData, setLoadingAllData] = useState(false);
  const { searchTerm, isDarkMode } = useOutletContext();
  const location = useLocation();

  // ตรวจสอบว่าเป็น path category หรือไม่
  const isCategoryPage = location.pathname.startsWith('/category/');
  const isHomePage = location.pathname === '/'; // ตรวจสอบว่าเป็นหน้าหลักหรือไม่
  const categoryId = isCategoryPage ? location.pathname.split('/').pop() : null;

  // ฟังก์ชันโหลดวิดีโอครั้งแรก
  const loadInitialVideos = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    setTotalPagesLoaded(0);

    try {
      let videosData = [];

      if (searchTerm && searchTerm.trim() !== '') {
        // กรณีค้นหา - ค้นหาในหมวดหมู่ปัจจุบัน
        if (isCategoryPage) {
          const allCategoryVideos = await getVideosByCategory(categoryId);
          videosData = allCategoryVideos.filter(video =>
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.channelName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (filter && filter !== 'all') {
          const allFilterVideos = await fetchVideosFromAPI(filter);
          videosData = allFilterVideos.filter(video =>
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.channelName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          videosData = await searchVideos(searchTerm);
        }
      } else {
        // กรณีไม่ค้นหา
        if (isHomePage) {
          // หน้าหลัก - โหลด 15 หน้าแรก (ประมาณ 270 วิดีโอ)
          console.log('Loading initial 15 pages for homepage...');
          const result = await getAllVideosWithPagination(1, 1, 18); // 15 หน้า หน้าละ 18 วิดีโอ
          videosData = result.videos;
          setTotalPagesLoaded(1);
          setHasMore(result.hasMore);
          console.log(`Loaded ${videosData.length} videos from 15 pages`);

          // เริ่มโหลดข้อมูลทั้งหมดในพื้นหลัง
          setTimeout(() => {
            loadAllDataInBackground();
          }, 0); // ไม่ต้องรอ 2 วินาทีหลังแสดงข้อมูลแล้วค่อยโหลดเพิ่ม

        } else if (isCategoryPage) {
          videosData = await getVideosByCategory(categoryId, 18);
        } else if (filter && filter !== 'all') {
          videosData = await fetchVideosFromAPI(filter, '', 18);
        } else {
          videosData = await fetchVideosFromAPI('', '', 18);
        }
      }

      setVideos(videosData);

      if (!isHomePage) {
        setHasMore(videosData.length >= 18);
      }

    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, isCategoryPage, categoryId, isHomePage]);

  // ฟังก์ชันโหลดข้อมูลทั้งหมดในพื้นหลัง (เฉพาะหน้าหลัก)
  const loadAllDataInBackground = useCallback(async () => {
    if (!isHomePage || loadingAllData) return;

    setLoadingAllData(true);
    console.log('Starting to load all data in background...');

    try {
      // โหลดข้อมูลจากหน้า 1 เป็นต้นไป
      const startPage = totalPagesLoaded + 1;
      const maxPages = 100; // จำกัดไม่ให้เกิน 100 หน้า
      let currentBatchPage = startPage;
      let allNewVideos = [];

      // โหลดครั้งละ 5 หน้า
      while (currentBatchPage <= maxPages) {
        try {
          const batchSize = 5;
          const endPage = Math.min(currentBatchPage + batchSize - 1, maxPages);

          console.log(`Loading pages ${currentBatchPage}-${endPage} in background...`);

          const result = await getAllVideosWithPagination(
            currentBatchPage,
            endPage - currentBatchPage + 1,
            18
          );

          if (result.videos.length === 0) {
            console.log('No more videos available');
            setHasMore(false);
            break;
          }

          allNewVideos.push(...result.videos);

          // อัปเดตวิดีโอที่แสดงทีละ batch
          setVideos(prevVideos => {
            // กรองซ้ำเพื่อป้องกันวิดีโอซ้ำ
            const existingIds = new Set(prevVideos.map(v => v.id));
            const newUniqueVideos = result.videos.filter(v => !existingIds.has(v.id));
            return [...prevVideos, ...newUniqueVideos];
          });

          setTotalPagesLoaded(endPage);
          setHasMore(result.hasMore);

          currentBatchPage = endPage + 1;

          // หยุดชั่วคราวระหว่าง batch เพื่อไม่ให้เซิร์ฟเวอร์ล้น
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (!result.hasMore) {
            console.log('All available data loaded');
            setHasMore(false);
            break;
          }

        } catch (error) {
          console.error(`Error loading batch ${currentBatchPage}:`, error);
          break;
        }
      }

      console.log(`Background loading completed. Total pages loaded: ${totalPagesLoaded}, Total videos: ${videos.length + allNewVideos.length}`);

    } catch (error) {
      console.error('Error in background loading:', error);
    } finally {
      setLoadingAllData(false);
    }
  }, [isHomePage, loadingAllData, totalPagesLoaded]);

  // ฟังก์ชันโหลดวิดีโอเพิ่มเติม (สำหรับหน้าอื่นที่ไม่ใช่หน้าหลัก)
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore || isHomePage) return; // หน้าหลักไม่ใช้ฟังก์ชันนี้

    setLoadingMore(true);

    try {
      let moreVideos = [];
      const nextPage = currentPage + 1;

      if (searchTerm && searchTerm.trim() !== '') {
        setHasMore(false);
      } else {
        if (isCategoryPage) {
          const categoryName = getCategoryName(categoryId);
          const result = await getMoreVideosInCategory(
            categoryName,
            videos.map(v => v.id),
            nextPage,
            12
          );
          moreVideos = result.videos;
          setHasMore(result.hasMore);
        } else if (filter && filter !== 'all') {
          moreVideos = await fetchVideosFromAPI(filter, '', 12, nextPage);
          setHasMore(moreVideos.length >= 12);
        } else {
          moreVideos = await fetchVideosFromAPI('', '', 12, nextPage);
          setHasMore(moreVideos.length >= 12);
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
  }, [currentPage, loadingMore, hasMore, searchTerm, isCategoryPage, categoryId, filter, videos, isHomePage]);

  // ตั้งค่า Intersection Observer สำหรับ infinite scroll (เฉพาะหน้าที่ไม่ใช่หน้าหลัก)
  useEffect(() => {
    if (isHomePage) return; // หน้าหลักไม่ใช้ infinite scroll

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
  }, [loadMoreVideos, hasMore, loadingMore, isHomePage]);

  // โหลดวิดีโอครั้งแรกเมื่อพารามิเตอร์เปลี่ยน
  useEffect(() => {
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
  } else if (isHomePage) {
    displayTitle = "วิดีโอทั้งหมด";
  }

  // แสดง Skeleton Loading ครั้งแรก
  if (loading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 w-64 rounded mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}></div>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols6 xl:grid-cols-6 gap-2 md:gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
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
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {displayTitle}
          </h1>
        </div>

        {videos.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">
              {searchTerm && searchTerm.trim() !== ''
                ? 'ไม่พบผลลัพธ์การค้นหา'
                : 'ไม่พบวิดีโอ'}
            </p>
          </div>
        ) : (
          <>
            {searchTerm && searchTerm.trim() !== '' && (
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                พบ {videos.length} วิดีโอ
              </p>
            )}
            <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>

            {/* Loading More Skeleton (เฉพาะหน้าที่ไม่ใช่หน้าหลัก) */}
            {!isHomePage && loadingMore && (
              <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 mt-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <VideoCardSkeleton key={`skeleton-${index}`} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}

            {/* 👇 แสดง Skeleton ตอนโหลดในพื้นหลัง (เฉพาะหน้า Home) */}
            {isHomePage && loadingAllData && (
              <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 mt-4">
                {Array.from({ length: 18 }).map((_, index) => (
                  <VideoCardSkeleton key={`background-skeleton-${index}`} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}

            {/* Scroll Sentinel สำหรับตรวจจับเมื่อเลื่อนถึงล่าง (เฉพาะหน้าที่ไม่ใช่หน้าหลัก) */}
            {!isHomePage && <div id="scroll-sentinel" className="h-10 w-full"></div>}

            {/* แสดงข้อความเมื่อโหลดครบทั้งหมดแล้ว */}
            {!hasMore && videos.length > 0 && !loadingAllData && (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>
                  {isHomePage
                    ? `โหลดวิดีโอครบทั้งหมดแล้ว (${videos.length} วิดีโอ)`
                    : 'โหลดวิดีโอครบทั้งหมดแล้ว'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;