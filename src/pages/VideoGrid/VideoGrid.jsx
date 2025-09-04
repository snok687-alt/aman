import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { VideoCard, VideoCardSkeleton } from '../../components/VideoCard';
import { getCategoryName } from '../../utils/Category';
import { fetchVideosFromAPI, getVideosByCategory, searchVideos, getMoreVideosInCategory, getAllVideosWithPagination } from '../../data/api/videoApi';

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

  const isCategoryPage = location.pathname.startsWith('/category/');
  const isHomePage = location.pathname === '/';
  const categoryId = isCategoryPage ? location.pathname.split('/').pop() : null;

  const loadInitialVideos = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    setTotalPagesLoaded(0);

    try {
      let videosData = [];

      if (searchTerm && searchTerm.trim() !== '') {
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
        if (isHomePage) {
          console.log('Loading initial 15 pages for homepage...');
          const result = await getAllVideosWithPagination(1, 15, 18);
          videosData = result.videos;
          setTotalPagesLoaded(15);
          setHasMore(result.hasMore);
          console.log(`Loaded ${videosData.length} videos from 15 pages`);

          setTimeout(() => {
            loadAllDataInBackground();
          }, 0);

        } else if (isCategoryPage) {
          videosData = await getVideosByCategory(categoryId, 18);
          setHasMore(true);
        } else if (filter && filter !== 'all') {
          videosData = await fetchVideosFromAPI(filter, '', 18);
          setHasMore(true);
        } else {
          videosData = await fetchVideosFromAPI('', '', 18);
          setHasMore(false);
        }
      }

      setVideos(videosData);

    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, isCategoryPage, categoryId, isHomePage]);

  const loadAllDataInBackground = useCallback(async () => {
    if (!isHomePage || loadingAllData) return;

    setLoadingAllData(true);
    console.log('Starting to load all data in background...');

    try {
      const startPage = 16;
      const maxPages = 100;
      let currentBatchPage = startPage;
      let allNewVideos = [];

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

          setVideos(prevVideos => {
            const existingIds = new Set(prevVideos.map(v => v.id));
            const newUniqueVideos = result.videos.filter(v => !existingIds.has(v.id));
            return [...prevVideos, ...newUniqueVideos];
          });

          setTotalPagesLoaded(endPage);
          setHasMore(result.hasMore);

          currentBatchPage = endPage + 1;

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

      console.log(`Background loading completed. Total pages loaded: ${totalPagesLoaded}`);

    } catch (error) {
      console.error('Error in background loading:', error);
    } finally {
      setLoadingAllData(false);
    }
  }, [isHomePage, loadingAllData, totalPagesLoaded]);

  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore || isHomePage) return;

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
        }
      }

      if (moreVideos.length > 0) {
        setVideos(prevVideos => [...prevVideos, ...moreVideos]);
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, searchTerm, isCategoryPage, categoryId, filter, videos, isHomePage]);

  useEffect(() => {
    if (isHomePage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreVideos();
        }
      },
      { threshold: 0.5 }
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

  useEffect(() => {
    const timeoutId = setTimeout(loadInitialVideos, searchTerm ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [loadInitialVideos, searchTerm]);

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

  if (loading) {
    return (
      <div className={`min-h-screen p-2 md:p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 w-64 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}></div>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2 md:gap-4">
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

            {!isHomePage && loadingMore && (
              <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 mt-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <VideoCardSkeleton key={`skeleton-${index}`} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}

            {isHomePage && loadingAllData && (
              <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 mt-4">
                {Array.from({ length: 18 }).map((_, index) => (
                  <VideoCardSkeleton key={`background-skeleton-${index}`} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}

            {!isHomePage && hasMore && <div id="scroll-sentinel" className="h-10 w-full"></div>}

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