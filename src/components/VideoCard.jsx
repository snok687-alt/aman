// VideoCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const VideoCard = ({ video, onClick, isDarkMode }) => {
  const navigate = useNavigate();

  const handleVideoClick = () => {
    if (onClick) {
      onClick(video);
    } else {
      navigate(`/watch/${video.id}`);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M ดู`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K ดู`;
    return `${views} ดู`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isYouTubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  const getYouTubeThumbnail = (url) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return video.thumbnail;
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      onClick={handleVideoClick}
    >
      <div className="relative aspect-video bg-gray-700 overflow-hidden">
        <img
          src={isYouTubeUrl(video.videoUrl) ? getYouTubeThumbnail(video.videoUrl) : video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-1 py-1 rounded text-xs">
          {formatDuration(video.duration)}
        </div>

        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-0 hover:opacity-100 group">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 border border-white/20">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="p-1">
        <h3 className={`font-medium mb-1 line-clamp-2 text-sm leading-tight ${
          isDarkMode ? 'text-white' : 'text-black'
        }`} title={video.title}>
          {video.title}
        </h3>
        <p className={`text-xs font-medium truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>{video.channelName}</p>
        <div className={`flex items-center text-xs mt-1 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>{formatViews(video.views)}</span>
          <span className="mx-1.5">•</span>
          <span>{video.uploadDate}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;