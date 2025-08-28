// src/pages/VideoPlayer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getVideoById, getRelatedVideos } from '../data/videoData';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // รับค่า isDarkMode จาก context
  const { isDarkMode } = useOutletContext();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const foundVideo = getVideoById(videoId);
      setVideo(foundVideo);
      if (foundVideo) {
        const related = getRelatedVideos(videoId, 6);
        setRelatedVideos(related);
      }
      setLoading(false);
    }, 500);
  }, [videoId]);

  const handleVideoClick = (video) => {
    navigate(`/watch/${video.id}`);
  };

  const isYouTubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  const convertToEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
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

  if (!video) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}>
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>ไม่พบวิดีโอนี้</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        {/* Main grid layout for larger screens, and a single column for small screens */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-x-8 md:mt-4">
          
          {/* Left Section: Video Player & Info */}
          <div className="w-full lg:w-2/3">
            {/* Fullscreen Video Player Container */}
            <div className="w-full aspect-video bg-black overflow-hidden shadow-lg">
              {isYouTubeUrl(video.videoUrl) ? (
                <iframe
                  src={convertToEmbedUrl(video.videoUrl)}
                  className="w-full h-full"
                  title={video.title}
                  style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  className="w-full h-full"
                  poster={video.thumbnail}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  เบราว์เซอร์ของคุณไม่สนับสนุนการเล่นวิดีโอ
                </video>
              )}
            </div>

            {/* Video Info Section */}
            <div className={`mt-4 mx-1 p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{video.title}</h1>
              <div className="flex flex-wrap items-center text-sm mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }">
                <span className="mr-3">{video.channelName}</span>
                <span className="mr-3">•</span>
                <span>{video.views.toLocaleString()} ครั้ง</span>
                <span className="mx-3">•</span>
                <span>{video.uploadDate}</span>
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{video.description}</p>
            </div>
          </div>

          {/* Right Section: Related Videos - สำหรับจอเล็กให้เลื่อนได้ */}
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
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;