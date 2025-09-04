export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

export const isNearBottom = (element, threshold = 200) => {
  if (!element) return false;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop <= clientHeight + threshold;
};

export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const removeDuplicateVideos = (videos, keyField = 'id') => {
  const seen = new Set();
  return videos.filter(video => {
    const key = video[keyField];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

class VideoCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }
}

export const videoCache = new VideoCache();

export const createCacheKey = (type, ...params) => {
  return `${type}:${params.filter(Boolean).join(':')}`;
};

export const sortVideosByRelevance = (videos, currentVideo) => {
  if (!currentVideo || !videos.length) return videos;
  
  return videos.sort((a, b) => {
    const aMatchesCategory = a.category === currentVideo.category ? 1 : 0;
    const bMatchesCategory = b.category === currentVideo.category ? 1 : 0;
    
    if (aMatchesCategory !== bMatchesCategory) {
      return bMatchesCategory - aMatchesCategory;
    }
    
    const aViews = parseInt(a.views) || 0;
    const bViews = parseInt(b.views) || 0;
    
    if (aViews !== bViews) {
      return bViews - aViews;
    }
    
    const aTime = new Date(a.uploadDate || 0).getTime();
    const bTime = new Date(b.uploadDate || 0).getTime();
    
    return bTime - aTime;
  });
};

export const formatVideoData = (rawVideo) => {
  return {
    id: rawVideo.vod_id || rawVideo.id,
    title: rawVideo.vod_name || rawVideo.title || 'ไม่มีชื่อ',
    channelName: rawVideo.vod_director || rawVideo.channelName || rawVideo.type_name || 'ไม่ระบุ',
    views: parseInt(rawVideo.vod_hits || rawVideo.views) || 0,
    duration: parseInt(rawVideo.vod_duration || rawVideo.duration) || 0,
    uploadDate: rawVideo.vod_year || rawVideo.uploadDate || rawVideo.vod_time || 'ไม่ระบุ',
    thumbnail: rawVideo.vod_pic || rawVideo.thumbnail || '',
    videoUrl: rawVideo.vod_play_url || rawVideo.videoUrl || '',
    description: rawVideo.vod_content || rawVideo.description || 'ไม่มีคำอธิบาย',
    category: rawVideo.type_name || rawVideo.category || rawVideo.vod_class || 'ทั่วไป',
    rawData: rawVideo
  };
};

export const validateVideoData = (video) => {
  if (!video) return false;
  if (!video.id && !video.vod_id) return false;
  if (!video.title && !video.vod_name) return false;
  return true;
};

export const processBatch = async (items, processor, batchSize = 5, delay = 500) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    const successResults = batchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(Boolean);
    
    results.push(...successResults);
    
    if (i + batchSize < items.length && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

export const preloadVideos = async (videoIds, processor) => {
  const promises = videoIds.map(async (id) => {
    try {
      const cacheKey = createCacheKey('video', id);
      if (videoCache.has(cacheKey)) {
        return videoCache.get(cacheKey);
      }
      
      const video = await processor(id);
      if (video) {
        videoCache.set(cacheKey, video);
      }
      return video;
    } catch (error) {
      console.warn(`Failed to preload video ${id}:`, error);
      return null;
    }
  });
  
  const results = await Promise.allSettled(promises);
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(Boolean);
};

export const useInfiniteScroll = (callback, options = {}) => {
  const {
    threshold = 200,
    debounceMs = 100,
    disabled = false
  } = options;
  
  const debouncedCallback = debounce(callback, debounceMs);
  
  return (element) => {
    if (!element || disabled) return;
    
    const handleScroll = () => {
      if (isNearBottom(element, threshold)) {
        debouncedCallback();
      }
    };
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  };
};

export const performanceTracker = {
  timers: new Map(),
  
  start(label) {
    this.timers.set(label, performance.now());
  },
  
  end(label) {
    const startTime = this.timers.get(label);
    if (!startTime) return null;
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  },
  
  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
};