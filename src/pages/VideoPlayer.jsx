import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getVideoById, getRelatedVideos, getMoreVideosInCategory } from '../data/videoData';
import Hls from 'hls.js';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const relatedContainerRef = useRef(null);
  const { isDarkMode } = useOutletContext();

  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // States สำหรับ infinite scroll
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [hasMoreRelated, setHasMoreRelated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allVideoIds, setAllVideoIds] = useState(new Set());

  const maxRetries = 3;

  // ฟังก์ชันกรองและป้องกัน duplicate videos
  const removeDuplicateVideos = useCallback((videos) => {
    const seen = new Map();
    const uniqueVideos = [];

    videos.forEach(video => {
      if (!video || !video.id) return;

      // ใช้ ID เป็น key หลัก
      const key = video.id.toString();

      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueVideos.push(video);
      }
    });

    return uniqueVideos;
  }, []);

  // ฟังก์ชันอัพเดท related videos แบบ safe
  const safeUpdateRelatedVideos = useCallback((newVideos, isAppend = false) => {
    setRelatedVideos(prevVideos => {
      let combinedVideos;

      if (isAppend) {
        // รวมข้อมูลเดิมกับใหม่
        combinedVideos = [...prevVideos, ...newVideos];
      } else {
        // เปลี่ยนข้อมูลทั้งหมด
        combinedVideos = newVideos;
      }

      // กรอง duplicate และ return unique videos
      const uniqueVideos = removeDuplicateVideos(combinedVideos);

      console.log(`Updated related videos: ${uniqueVideos.length} unique items`);
      return uniqueVideos;
    });
  }, [removeDuplicateVideos]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        window.dispatchEvent(new CustomEvent('toggleHeader', { detail: 'hide' }));
      } else if (currentScrollY < lastScrollY) {
        window.dispatchEvent(new CustomEvent('toggleHeader', { detail: 'show' }));
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite Scroll Handler - ปรับปรุงแล้ว
  const handleRelatedScroll = useCallback(async () => {
    if (!relatedContainerRef.current || relatedLoading || !hasMoreRelated || !video) return;

    const container = relatedContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // เมื่อเลื่อนใกล้ถึงด้านล่าง (เหลือ 200px)
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log('Loading more related videos...');
      setRelatedLoading(true);

      try {
        const result = await getMoreVideosInCategory(
          video.category,
          Array.from(allVideoIds),
          currentPage + 1,
          12
        );

        if (result.videos && result.videos.length > 0) {
          // กรองเอาแต่วิดีโอที่ยังไม่มีใน current state
          const currentVideoIds = new Set(relatedVideos.map(v => v.id.toString()));
          const newVideos = result.videos.filter(v =>
            v && v.id && !currentVideoIds.has(v.id.toString()) && !allVideoIds.has(v.id.toString())
          );

          if (newVideos.length > 0) {
            // อัพเดทโดยใช้ safe function
            safeUpdateRelatedVideos(newVideos, true);

            // อัพเดท tracking IDs
            const newIds = new Set(allVideoIds);
            newVideos.forEach(v => newIds.add(v.id.toString()));
            setAllVideoIds(newIds);

            setCurrentPage(prev => prev + 1);
            setHasMoreRelated(result.hasMore);

            console.log(`Added ${newVideos.length} new unique related videos`);
          } else {
            console.log('No new unique videos found');
            setHasMoreRelated(false);
          }
        } else {
          setHasMoreRelated(false);
        }
      } catch (error) {
        console.error('Error loading more related videos:', error);
        setHasMoreRelated(false);
      } finally {
        setRelatedLoading(false);
      }
    }
  }, [relatedLoading, hasMoreRelated, video, allVideoIds, currentPage, relatedVideos, safeUpdateRelatedVideos]);

  // เพิ่ม scroll listener สำหรับ related videos container
  useEffect(() => {
    const container = relatedContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleRelatedScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleRelatedScroll);
    };
  }, [handleRelatedScroll]);

  const removeHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const truncateDescription = (text, maxLength = 20) => {
    const cleanText = removeHtmlTags(text);
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  const processVideoUrl = useCallback((playUrl) => {
    if (!playUrl) return null;

    console.log('Processing video URL:', playUrl);

    const patterns = [
      /(https?:\/\/[^$]+\.m3u8[^$]*)/i,
      /(https?:\/\/[^$]+\.mp4[^$]*)/i,
      /\$([^$]+\.m3u8[^$]*)/i,
      /\$([^$]+\.mp4[^$]*)/i
    ];

    for (const pattern of patterns) {
      const match = playUrl.match(pattern);
      if (match) {
        let url = match[1] || match[0];
        url = url.replace(/\$+/g, '');
        url = url.trim();
        console.log('Found video URL:', url);
        return url;
      }
    }

    console.log('No valid video URL found');
    return null;
  }, []);

  const loadVideo = useCallback(async (videoUrl, retries = 0) => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;

    setVideoLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    try {
      if (Hls.isSupported()) {
        console.log('Loading HLS video:', videoUrl);

        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          startLevel: 0,
          capLevelToPlayerSize: true,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 3,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 3,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 3,
        });

        hlsRef.current = hls;

        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          setVideoLoading(false);
          videoElement.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setVideoLoading(false);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...');
                if (retries < maxRetries) {
                  setTimeout(() => {
                    hls.startLoad();
                  }, 1000 * (retries + 1));
                } else {
                  setError('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
                  setVideoLoading(false);
                }
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...');
                if (retries < maxRetries) {
                  hls.recoverMediaError();
                } else {
                  setError('เกิดข้อผิดพลาดในการเล่นมีเดีย');
                  setVideoLoading(false);
                }
                break;

              default:
                console.log('Unrecoverable error');
                setError('ไม่สามารถเล่นวีดีโอได้');
                setVideoLoading(false);
                break;
            }
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          setVideoLoading(false);
        });

      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Loading native HLS video:', videoUrl);
        videoElement.src = videoUrl;

        videoElement.addEventListener('loadstart', () => {
          console.log('Video loading started');
        });

        videoElement.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded');
          setVideoLoading(false);
          videoElement.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setVideoLoading(false);
          });
        });

        videoElement.addEventListener('error', (e) => {
          console.error('Video error:', e);
          if (retries < maxRetries) {
            console.log(`Retrying video load... (${retries + 1}/${maxRetries})`);
            setTimeout(() => {
              loadVideo(videoUrl, retries + 1);
            }, 2000 * (retries + 1));
          } else {
            setError('ไม่สามารถเล่นวีดีโอได้');
            setVideoLoading(false);
          }
        });

      } else {
        setError('เบราว์เซอร์ของคุณไม่รองรับรูปแบบวีดีโอนี้');
        setVideoLoading(false);
      }

    } catch (err) {
      console.error('Error loading video:', err);
      if (retries < maxRetries) {
        setTimeout(() => {
          loadVideo(videoUrl, retries + 1);
        }, 2000 * (retries + 1));
      } else {
        setError('ไม่สามารถโหลดวีดีโอได้');
        setVideoLoading(false);
      }
    }
  }, [maxRetries]);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);
        setRetryCount(0);
        setRelatedVideos([]);
        setHasMoreRelated(false);
        setCurrentPage(1);
        setAllVideoIds(new Set([videoId]));

        console.log('Fetching video data for ID:', videoId);
        const videoData = await getVideoById(videoId);

        if (!videoData) throw new Error('ไม่พบวีดีโอนี้');

        const videoUrl = processVideoUrl(videoData.videoUrl || videoData.rawData?.vod_play_url);

        const processedVideo = {
          ...videoData,
          videoUrl: videoUrl
        };

        setVideo(processedVideo);
        setLoading(false);

        // เริ่มโหลดวิดีโอ
        if (videoUrl) {
          setTimeout(() => {
            loadVideo(videoUrl);
          }, 100);
        } else {
          setVideoLoading(false);
          setError('ไม่พบไฟล์วีดีโอ');
        }

      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดวีดีโอ:', err);
        setError(err.message || 'ไม่สามารถโหลดวีดีโอได้');
        setLoading(false);
        setVideoLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [videoId, processVideoUrl, loadVideo]);
  useEffect(() => {
    const fetchRelated = async () => {
      if (!video || !video.id || !video.category) return;

      try {
        console.log('Fetching related videos...');
        const related = await getRelatedVideos(
          video.id,
          video.category,
          video.title,
          12
        );

        if (related && related.length > 0) {
          safeUpdateRelatedVideos(related, false);

          const ids = new Set([video.id]);
          related.forEach(v => v?.id && ids.add(v.id.toString()));
          setAllVideoIds(ids);

          setHasMoreRelated(related.length >= 12);
        } else {
          setHasMoreRelated(false);
        }

      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดวิดีโอที่เกี่ยวข้อง:', error);
        setHasMoreRelated(false);
      }
    };

    // เรียกหลังจาก video ถูกตั้งค่า และ videoLoading เป็น false
    if (video && !videoLoading) {
      fetchRelated();
    }
  }, [video, videoLoading, safeUpdateRelatedVideos]);


  const handleVideoClick = useCallback((clickedVideo) => {
    navigate(`/watch/${clickedVideo.id}`);
  }, [navigate]);

  const handleRetryVideo = useCallback(() => {
    if (video && video.videoUrl && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);
      loadVideo(video.videoUrl, retryCount);
    }
  }, [video, retryCount, maxRetries, loadVideo]);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} p-4`}>
        <div className="max-w-full mx-auto md:mt-4">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Left side (video skeleton) */}
            <div className="w-full lg:w-2/3 space-y-4">
              <div className="relative w-full aspect-video bg-gray-800 animate-pulse rounded-lg" />

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4 animate-pulse" />
                <div className="flex gap-2 items-center mb-2">
                  <div className="h-4 w-24 bg-gray-600 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-600 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-gray-600 rounded animate-pulse" />
                </div>
                <div className="h-4 bg-gray-600 rounded w-full mb-2 animate-pulse" />
                <div className="h-4 bg-gray-600 rounded w-5/6 animate-pulse" />
              </div>
            </div>

            {/* Right side (related skeleton cards) */}
            <div className="w-full lg:w-1/3">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="h-6 w-2/3 mb-4 bg-gray-600 rounded animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <div className="aspect-video bg-gray-700 rounded" />
                      <div className="h-3 w-5/6 bg-gray-600 rounded" />
                      <div className="h-3 w-3/4 bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }


  if (error || !video) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
        }`}>
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg mb-4">{error || 'ไม่พบวีดีโอนี้'}</p>
        <div className="flex gap-4">
          {video && video.videoUrl && retryCount < maxRetries && (
            <button
              onClick={handleRetryVideo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ลองใหม่ ({retryCount + 1}/{maxRetries})
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const cleanDescription = removeHtmlTags(video.description);
  const shouldTruncate = cleanDescription.length > 150;
  const displayDescription = showFullDescription
    ? cleanDescription
    : truncateDescription(cleanDescription);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}>
      <div className="max-w-full mx-auto md:mt-4 md:ml-4 lg:p-1">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-x-8 md:mt-1">

          {/* Left Section: Video Player & Info */}
          <div className="w-full lg:w-2/3">
            {/* Video Player Container */}
            <div className="relative w-full aspect-video bg-black overflow-hidden shadow-lg">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                    <p className="text-white text-sm">กำลังโหลดวีดีโอ...</p>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                poster={video.thumbnail}
                playsInline
                preload="metadata"
              />
            </div>

            {/* Video Info Section */}
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{video.title}</h1>

              <div className="flex flex-wrap items-center text-sm mb-2">
                <span className="mr-3">{video.channelName}</span>
                <span className="mr-3">•</span>
                <span>{video.views.toLocaleString()} ครั้ง</span>
                <span className="mx-3">•</span>
                <span>{video.uploadDate}</span>
                <span className="mx-3">•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                  {video.category}
                </span>
              </div>

              {video.rawData?.vod_actor && (
                <p className="mb-2">
                  <strong>นักแสดง: </strong>
                  {video.rawData.vod_actor}
                </p>
              )}

              <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                <p className="whitespace-pre-line mb-2">{displayDescription}</p>

                {shouldTruncate && (
                  <button
                    onClick={toggleDescription}
                    className={`text-sm font-medium ${isDarkMode
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-500'
                      } transition-colors`}
                  >
                    {showFullDescription ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Related Videos with Infinite Scroll - แก้ไข key แล้ว */}
          <div className="w-full lg:w-1/3">
            <div
              className={`rounded-lg ${isDarkMode ? 'bg-gray-800 lg:bg-transparent' : 'bg-white lg:bg-transparent'
                }`}
            >
              <h3
                className={`text-xl font-bold mb-1 py-3 z-10 pl-2 lg:sticky top-0 ${isDarkMode
                  ? 'bg-gradient-to-r from-gray-900 to-transparent'
                  : 'bg-gradient-to-r from-gray-100 to-transparent'
                  }`}
              >
                วิดีโอที่เกี่ยวข้องใน "{video.category}" ({relatedVideos.length}{hasMoreRelated ? '+' : ''})
              </h3>

              {relatedVideos.length > 0 ? (
                <div
                  ref={relatedContainerRef}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-screen overflow-y-auto pr-2"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {relatedVideos.map((relatedVideo, index) => {
                    // สร้าง unique key โดยรวม ID + index เพื่อป้องกัน duplicate
                    const uniqueKey = `${relatedVideo.id}-${index}`;

                    return (
                      <div
                        key={uniqueKey}
                        className="transform transition-transform duration-300 hover:scale-105"
                      >
                        <VideoCard
                          video={relatedVideo}
                          onClick={handleVideoClick}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    );
                  })}

                  {/* Loading indicator สำหรับ infinite scroll */}
                  {relatedLoading && (
                    <div className="col-span-2 md:col-span-3 flex justify-center items-center py-4">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mb-2"></div>
                        <p className="text-sm">กำลังโหลดเพิ่มเติม...</p>
                      </div>
                    </div>
                  )}

                  {/* End of content indicator */}
                  {!hasMoreRelated && relatedVideos.length > 12 && (
                    <div className="col-span-2 md:col-span-3 text-center py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ไม่มีวิดีโอเพิ่มเติมในหมวดหมู่นี้
                      </p>
                    </div>
                  )}
                </div>
              ) : relatedLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <div className="aspect-video bg-gray-700 rounded" />
                      <div className="h-3 w-5/6 bg-gray-600 rounded" />
                      <div className="h-3 w-3/4 bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <div className="aspect-video bg-gray-700 rounded" />
                      <div className="h-3 w-5/6 bg-gray-600 rounded" />
                      <div className="h-3 w-3/4 bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;