import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getVideoById, getRelatedVideos } from '../data/videoData'; // import จาก api service
import Hls from 'hls.js';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { isDarkMode } = useOutletContext();

  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // ฟังก์ชันลบ tag HTML
  const removeHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  // ฟังก์ชันตัดคำอธิบายให้สั้น
  const truncateDescription = (text, maxLength = 150) => {
    const cleanText = removeHtmlTags(text);
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  // ฟังก์ชันตรวจสอบและแปลง URL วีดีโอ
  const processVideoUrl = useCallback((playUrl) => {
    if (!playUrl) return null;

    console.log('Processing video URL:', playUrl);

    // ลองหา URL หลายรูปแบบ
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

        // ทำความสะอาด URL
        url = url.replace(/\$+/g, '');
        url = url.trim();

        console.log('Found video URL:', url);
        return url;
      }
    }

    console.log('No valid video URL found');
    return null;
  }, []);

  // ฟังก์ชันโหลดวีดีโอ
  const loadVideo = useCallback(async (videoUrl, retries = 0) => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;

    setVideoLoading(true);

    // ทำลาย HLS instance เก่า
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
          // เพิ่มการตั้งค่าสำหรับการโหลดที่เร็วขึ้น
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

        console.log('Fetching video data for ID:', videoId);

        // ใช้ฟังก์ชันจาก api service
        const videoData = await getVideoById(videoId);

        if (!videoData) {
          throw new Error('ไม่พบวีดีโอนี้');
        }

        console.log('Video data received:', videoData);

        const videoUrl = processVideoUrl(videoData.videoUrl || videoData.rawData?.vod_play_url);

        const processedVideo = {
          ...videoData,
          videoUrl: videoUrl
        };

        setVideo(processedVideo);

        // ดึงวีดีโอที่เกี่ยวข้องด้วยฟังก์ชันใหม่
        console.log('Fetching related videos...');
        const related = await getRelatedVideos(
          videoData.id, 
          videoData.category,
          videoData.title,
          12 // จำนวนวิดีโอที่เกี่ยวข้องที่ต้องการ
        );
        
        console.log('Related videos received:', related.length);
        setRelatedVideos(related);

        setLoading(false);

        // โหลดวีดีโอหลังจากที่ข้อมูลพร้อม
        if (videoUrl) {
          setTimeout(() => {
            loadVideo(videoUrl);
          }, 100);
        } else {
          setVideoLoading(false);
          setError('ไม่พบไฟล์วีดีโอ');
        }

      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลวีดีโอ:', err);
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
          <p className={isDarkMode ? 'text-white' : 'text-black'}>กำลังโหลดวีดีโอ...</p>
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
      <div className="max-w-full mx-auto md:m-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-x-8 md:mt-4">

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

          {/* Right Section: Related Videos */}
          <div className="w-full lg:w-1/3">
            <div
              className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800 lg:bg-transparent' : 'bg-white lg:bg-transparent'
                }`}
            >
              <h3
                className={`text-xl font-bold mb-4 py-3 z-10 pl-2 lg:sticky top-0 ${isDarkMode
                    ? 'bg-gradient-to-r from-gray-900 to-transparent'
                    : 'bg-gradient-to-r from-gray-100 to-transparent'
                  }`}
              >
                วิดีโอที่เกี่ยวข้อง ({relatedVideos.length})
              </h3>

              {relatedVideos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {relatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      className="transform transition-transform duration-300 hover:scale-105"
                    >
                      <VideoCard
                        video={relatedVideo}
                        onClick={handleVideoClick}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  <div className="animate-pulse">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                      <p>กำลังค้นหาวิดีโอที่เกี่ยวข้อง...</p>
                    </div>
                  </div>
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