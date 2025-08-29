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

  const getThumbnailUrl = (videoData) => {
    if (videoData.thumbnail) return videoData.thumbnail;
    
    if (videoData.videoUrl?.includes('youtube.com') || videoData.videoUrl?.includes('youtu.be')) {
      let videoId;
      
      if (videoData.videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoData.videoUrl.split('v=')[1].split('&')[0];
      } else if (videoData.videoUrl.includes('youtu.be/')) {
        videoId = videoData.videoUrl.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    
    return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&h=360&fit=crop';
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
          src={getThumbnailUrl(video)}
          alt={video.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&h=360&fit=crop';
          }}
        />

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

      <div className="p-3">
        <h3 className={`font-medium mb-1 line-clamp-2 text-sm leading-tight ${
          isDarkMode ? 'text-white' : 'text-black'
        }`} title={video.title}>
          {video.title}
        </h3>
        
        <p className={`text-xs font-medium truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {video.channelName}
        </p>
        
        <div className={`flex items-center text-xs mt-1 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>{formatViews(video.views)}</span>
          <span className="mx-1.5">•</span>
          <span>{video.uploadDate}</span>
        </div>
        
        {video.category && (
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {video.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;