// hooks/useVideoPlayer.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

export const useVideoPlayer = (videoId) => {
  // logic ทั้งหมดของ useEffect, loadVideo, processVideoUrl, handleScroll, infinite scroll เป็นต้น
  // คืนค่าทุก state ที่จำเป็นให้ component หลักใช้งาน

  return {
    video,
    setVideo,
    error,
    videoLoading,
    retryCount,
    handleRetryVideo,
    showFullDescription,
    toggleDescription,
    relatedVideos,
    relatedLoading,
    hasMoreRelated,
    handleVideoClick,
    relatedContainerRef,
    videoRef,
    cleanDescription,
    displayDescription,
    loading,
  };
};
