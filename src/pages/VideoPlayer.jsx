import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import axios from 'axios';
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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        
        const detailRes = await axios.get(`/api/provide/vod/?ac=detail&ids=${videoId}`);
        const videoData = detailRes.data?.list?.[0];
        
        if (!videoData) {
          throw new Error('ไม่พบวิดีโอนี้');
        }

        let videoUrl = '';
        if (videoData.vod_play_url) {
          const match = videoData.vod_play_url.match(/(http[s]?:\/\/.*?\.m3u8)/);
          videoUrl = match ? match[1] : '';
        }

        setVideo({
          ...videoData,
          id: videoData.vod_id,
          title: videoData.vod_name,
          channelName: videoData.vod_director || 'ไม่ระบุ',
          views: parseInt(videoData.vod_hits) || 0,
          duration: 0,
          uploadDate: videoData.vod_year || 'ไม่ระบุ',
          thumbnail: videoData.vod_pic || '',
          videoUrl: videoUrl,
          description: videoData.vod_content || 'ไม่มีคำอธิบาย',
          category: videoData.vod_class || 'ทั่วไป'
        });

        if (videoData.vod_class) {
          const listRes = await axios.get(`/api/provide/vod/?ac=list&t=${encodeURIComponent(videoData.vod_class)}`);
          const relatedList = listRes.data?.list || [];
          
          const filteredRelated = relatedList
            .filter(item => item.vod_id !== videoData.vod_id)
            .slice(0, 6)
            .map(item => ({
              id: item.vod_id,
              title: item.vod_name,
              channelName: item.vod_director || 'ไม่ระบุ',
              views: parseInt(item.vod_hits) || 0,
              duration: 0,
              uploadDate: item.vod_year || 'ไม่ระบุ',
              thumbnail: item.vod_pic || '',
              videoUrl: '',
              category: item.vod_class || 'ทั่วไป'
            }));
            
          setRelatedVideos(filteredRelated);
        }

        setLoading(false);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลวิดีโอ:', err);
        setError('ไม่สามารถโหลดวิดีโอได้');
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video || !video.videoUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(video.videoUrl);
      hls.attachMedia(videoElement);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(e => console.log('Autoplay prevented:', e));
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Unrecoverable error');
              break;
          }
        }
      });
      
      hlsRef.current = hls;
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = video.videoUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(e => console.log('Autoplay prevented:', e));
      });
    } else {
      setError('เบราว์เซอร์ของคุณไม่รองรับรูปแบบวิดีโอนี้');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [video]);

  const handleVideoClick = (clickedVideo) => {
    navigate(`/watch/${clickedVideo.id}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}>
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg mb-4">{error || 'ไม่พบวิดีโอนี้'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          กลับไปหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
    }`}>
      <div className="max-w-full mx-auto md:m-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-x-8 md:mt-4">
          
          {/* Left Section: Video Player & Info */}
          <div className="w-full lg:w-2/3">
            {/* Video Player Container */}
            <div className="w-full aspect-video bg-black overflow-hidden shadow-lg rounded-lg">
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                poster={video.thumbnail}
              />
            </div>

            {/* Video Info Section */}
            <div className={`mt-4 p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{video.title}</h1>
              
              <div className="flex flex-wrap items-center text-sm mb-4">
                <span className="mr-3">{video.channelName}</span>
                <span className="mr-3">•</span>
                <span>{video.views.toLocaleString()} ครั้ง</span>
                <span className="mx-3">•</span>
                <span>{video.uploadDate}</span>
                <span className="mx-3">•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  {video.category}
                </span>
              </div>
              
              {video.vod_actor && (
                <p className="mb-2">
                  <strong>นักแสดง: </strong>
                  {video.vod_actor}
                </p>
              )}
              
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {video.description}
              </p>
            </div>
          </div>

          {/* Right Section: Related Videos */}
          <div className="w-full lg:w-1/3 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-80px)] lg:sticky top-4">
            <div className={`rounded-lg p-3 ${
              isDarkMode ? 'bg-gray-800 lg:bg-transparent' : 'bg-white lg:bg-transparent'
            }`}>
              <h3 className={`text-xl font-bold mb-4 py-3 z-10 pl-2 lg:sticky top-0 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-900 to-transparent' 
                  : 'bg-gradient-to-r from-gray-100 to-transparent'
              }`}>
                วิดีโอที่เกี่ยวข้อง
              </h3>
              
              {relatedVideos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-4">
                  {relatedVideos.map((relatedVideo) => (
                    <div key={relatedVideo.id} className="transform transition-transform duration-300 hover:scale-105">
                      <VideoCard 
                        video={relatedVideo} 
                        onClick={handleVideoClick} 
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  ไม่มีวิดีโอที่เกี่ยวข้อง
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;