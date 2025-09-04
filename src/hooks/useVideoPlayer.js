import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

export const useVideoPlayer = (videoId) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const maxRetries = 3;

  const processVideoUrl = useCallback((playUrl) => {
    if (!playUrl) return null;

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
        return url.trim();
      }
    }

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
          setVideoLoading(false);
          videoElement.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setVideoLoading(false);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
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
                if (retries < maxRetries) {
                  hls.recoverMediaError();
                } else {
                  setError('เกิดข้อผิดพลาดในการเล่นมีเดีย');
                  setVideoLoading(false);
                }
                break;

              default:
                setError('ไม่สามารถเล่นวีดีโอได้');
                setVideoLoading(false);
                break;
            }
          }
        });

      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoUrl;

        videoElement.addEventListener('loadedmetadata', () => {
          setVideoLoading(false);
          videoElement.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setVideoLoading(false);
          });
        });

        videoElement.addEventListener('error', (e) => {
          if (retries < maxRetries) {
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

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return {
    video,
    setVideo,
    error,
    videoLoading,
    retryCount,
    handleRetryVideo,
    showFullDescription,
    toggleDescription,
    videoRef,
    processVideoUrl,
    loadVideo
  };
};