import axios from 'axios';
import { videoCache, createCacheKey, withRetry, processBatch } from '../cache/videoCache';
import { formatVideoData, validateVideoData } from '../../utils/infiniteScrollUtils';

axios.defaults.timeout = 15000;

const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.warn(`Request failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i === maxRetries - 1) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const fetchBatchVideoDetails = async (vodIds) => {
  try {
    if (!vodIds || vodIds.length === 0) return [];
    
    console.log('Fetching batch details for IDs:', vodIds);
    
    const idsParam = vodIds.join(',');
    const response = await retryRequest(
      () => axios.get(`/api/provide/vod/?ac=detail&ids=${idsParam}`),
      2,
      1000
    );
    
    const videoDataList = response.data?.list || [];
    console.log('Batch response received:', videoDataList.length, 'items');
    
    return videoDataList.map(videoData => formatVideoData(videoData));
  } catch (error) {
    console.error(`Error fetching batch details for videos:`, error);
    return [];
  }
};

const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const fetchVideosFromAPI = async (category = '', searchQuery = '', limit = 20) => {
  try {
    let url = '/api/provide/vod/?ac=list';
    const params = [];
    
    if (category && category !== 'all') {
      params.push(`t=${encodeURIComponent(category)}`);
    }
    
    if (searchQuery) {
      params.push(`wd=${encodeURIComponent(searchQuery)}`);
    }
    
    params.push(`limit=${limit}`);
    
    if (params.length > 0) {
      url += '&' + params.join('&');
    }
    
    console.log('Fetching video list from:', url);
    
    const response = await retryRequest(
      () => axios.get(url),
      3,
      1000
    );
    
    const videoList = response.data?.list || [];
    console.log('Found', videoList.length, 'videos in list');
    
    if (videoList.length === 0) {
      console.log('No videos found, trying alternative approach');
      return [];
    }
    
    const limitedVideos = videoList.slice(0, Math.min(limit, videoList.length));
    const vodIds = limitedVideos.map(item => item.vod_id).filter(Boolean);
    
    if (vodIds.length === 0) {
      console.log('No valid video IDs found');
      return [];
    }
    
    const idChunks = chunkArray(vodIds, 5);
    const allDetailedVideos = [];
    
    for (const [index, idChunk] of idChunks.entries()) {
      try {
        console.log(`Processing chunk ${index + 1}/${idChunks.length}:`, idChunk);
        
        const batchVideos = await fetchBatchVideoDetails(idChunk);
        if (batchVideos.length > 0) {
          allDetailedVideos.push(...batchVideos);
        }
        
        if (index < idChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`Error in batch ${index + 1}, falling back to individual requests:`, error);
        
        for (const id of idChunk) {
          try {
            const individualVideo = await getVideoById(id);
            if (individualVideo) {
              allDetailedVideos.push(individualVideo);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (individualError) {
            console.error(`Failed to get details for video ${id}:`, individualError);
            
            const basicItem = limitedVideos.find(item => item.vod_id === id);
            if (basicItem) {
              allDetailedVideos.push(formatVideoData(basicItem));
            }
          }
        }
      }
    }
    
    console.log('Total detailed videos fetched:', allDetailedVideos.length);
    return allDetailedVideos;
    
  } catch (error) {
    console.error('Error fetching videos from API:', error);
    return [];
  }
};

export const getVideoById = async (id) => {
  try {
    if (!id) return null;
    
    const cacheKey = createCacheKey('video', id);
    const cachedVideo = videoCache.get(cacheKey);
    if (cachedVideo) {
      console.log('Using cached video:', id);
      return cachedVideo;
    }
    
    console.log('Fetching video details for ID:', id);
    
    const response = await retryRequest(
      () => axios.get(`/api/provide/vod/?ac=detail&ids=${id}`),
      3,
      1000
    );
    
    const videoData = response.data?.list?.[0];
    
    if (!videoData) {
      console.log('No video data found for ID:', id);
      return null;
    }
    
    const video = formatVideoData(videoData);
    videoCache.set(cacheKey, video);
    
    return video;
  } catch (error) {
    console.error(`Error fetching details for video ${id}:`, error);
    return null;
  }
};

export const searchVideos = async (query, limit = 20) => {
  try {
    if (!query || query.trim() === '') {
      console.log('Empty search query');
      return [];
    }
    
    console.log('Searching videos for query:', query);
    
    const response = await retryRequest(
      () => axios.get(`/api/provide/vod/?ac=list&wd=${encodeURIComponent(query)}&limit=${limit}`),
      3,
      1000
    );
    
    const videoList = response.data?.list || [];
    console.log('Search found', videoList.length, 'results');
    
    if (videoList.length === 0) return [];
    
    const vodIds = videoList.slice(0, limit).map(item => item.vod_id).filter(Boolean);
    
    if (vodIds.length === 0) return [];
    
    return await fetchBatchVideoDetails(vodIds);
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};

export const getVideosByCategory = async (category, limit = 20) => {
  try {
    if (!category || category === 'all') {
      return await getAllVideos(limit);
    }
    
    console.log('Fetching videos for category:', category);
    
    const response = await retryRequest(
      () => axios.get(`/api/provide/vod/?ac=list&t=${encodeURIComponent(category)}&limit=${limit}`),
      3,
      1000
    );
    
    const videoList = response.data?.list || [];
    console.log('Category search found', videoList.length, 'results');
    
    if (videoList.length === 0) {
      console.log('No videos found for category, trying alternative search');
      return await searchVideos(category, limit);
    }
    
    const vodIds = videoList.slice(0, limit).map(item => item.vod_id).filter(Boolean);
    
    if (vodIds.length === 0) return [];
    
    return await fetchBatchVideoDetails(vodIds);
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return [];
  }
};

export const getAllVideosWithPagination = async (startPage = 1, pageCount = 1, limit = 18) => {
  try {
    console.log(`Loading pages ${startPage} to ${startPage + pageCount - 1}, limit per page: ${limit}`);
    
    const allVideos = [];
    const seenIds = new Set();
    let totalPagesProcessed = 0;
    let hasMorePages = true;

    const batchSize = 3;
    
    for (let batchStart = startPage; batchStart < startPage + pageCount; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, startPage + pageCount - 1);
      const batchPromises = [];
      
      for (let page = batchStart; page <= batchEnd; page++) {
        batchPromises.push(
          retryRequest(
            () => axios.get(`/api/provide/vod/?ac=list&pg=${page}&limit=${limit}`),
            2,
            1000
          ).catch(error => {
            console.warn(`Failed to load page ${page}:`, error.message);
            return { data: { list: [] } };
          })
        );
      }
      
      try {
        console.log(`Processing batch: pages ${batchStart}-${batchEnd}`);
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          const currentPage = batchStart + i;
          
          if (result.status === 'fulfilled') {
            const videoList = result.value.data?.list || [];
            console.log(`Page ${currentPage}: found ${videoList.length} videos`);
            
            if (videoList.length === 0) {
              console.log(`Page ${currentPage}: No videos found, might be end of data`);
              hasMorePages = false;
              continue;
            }
            
            const pageVideoIds = videoList
              .map(item => item.vod_id)
              .filter(id => id && !seenIds.has(id))
              .slice(0, limit);
            
            if (pageVideoIds.length > 0) {
              try {
                const batchDetails = await fetchBatchVideoDetails(pageVideoIds);
                
                const validVideos = batchDetails.filter(video => 
                  video && video.id && !seenIds.has(video.id)
                );
                
                validVideos.forEach(video => seenIds.add(video.id));
                allVideos.push(...validVideos);
                
                console.log(`Page ${currentPage}: added ${validVideos.length} valid videos`);
                
              } catch (detailError) {
                console.error(`Error fetching details for page ${currentPage}:`, detailError);
                
                const basicVideos = videoList
                  .filter(item => item.vod_id && !seenIds.has(item.vod_id))
                  .slice(0, limit)
                  .map(item => {
                    seenIds.add(item.vod_id);
                    return formatVideoData(item);
                  });
                
                allVideos.push(...basicVideos);
                console.log(`Page ${currentPage}: added ${basicVideos.length} basic videos as fallback`);
              }
            }
            
            totalPagesProcessed++;
          } else {
            console.warn(`Page ${currentPage}: Request failed`);
          }
        }
        
        if (batchEnd < startPage + pageCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
      } catch (error) {
        console.error(`Error processing batch ${batchStart}-${batchEnd}:`, error);
      }
    }

    const sortedVideos = allVideos
      .filter((video, index, self) => 
        video && video.id && self.findIndex(v => v.id === video.id) === index
      )
      .sort((a, b) => {
        const viewsA = parseInt(a.views) || 0;
        const viewsB = parseInt(b.views) || 0;
        
        if (viewsB !== viewsA) {
          return viewsB - viewsA;
        }
        
        const timeA = new Date(a.uploadDate || 0).getTime();
        const timeB = new Date(b.uploadDate || 0).getTime();
        return timeB - timeA;
      });

    console.log(`
      Total pages processed: ${totalPagesProcessed}/${pageCount}
      Total unique videos loaded: ${sortedVideos.length}
      Has more pages: ${hasMorePages && totalPagesProcessed === pageCount}
    `);

    return {
      videos: sortedVideos,
      hasMore: hasMorePages && totalPagesProcessed === pageCount,
      totalPagesLoaded: totalPagesProcessed,
      totalVideos: sortedVideos.length
    };
    
  } catch (error) {
    console.error('Error in getAllVideosWithPagination:', error);
    return {
      videos: [],
      hasMore: false,
      totalPagesLoaded: 0,
      totalVideos: 0
    };
  }
};

export const validateAndCleanVideos = (videos) => {
  return videos
    .filter(video => {
      if (!video || !video.id) return false;
      if (!video.title || video.title.trim() === '') return false;
      
      if (video.title.length > 200) video.title = video.title.substring(0, 200) + '...';
      if (!video.thumbnail || video.thumbnail === '') {
        video.thumbnail = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&h=360&fit=crop';
      }
      
      return true;
    })
    .map(video => ({
      ...video,
      views: parseInt(video.views) || 0,
      duration: parseInt(video.duration) || 0,
      uploadDate: video.uploadDate || 'ไม่ระบุ',
      channelName: video.channelName || 'ไม่ระบุ',
      description: video.description || 'ไม่มีคำอธิบาย',
      category: video.category || 'ทั่วไป'
    }));
};

export const homepageVideoCache = {
  data: null,
  timestamp: null,
  ttl: 30 * 60 * 1000,
  
  get() {
    if (!this.data || !this.timestamp) return null;
    if (Date.now() - this.timestamp > this.ttl) {
      this.clear();
      return null;
    }
    return this.data;
  },
  
  set(videos) {
    this.data = videos;
    this.timestamp = Date.now();
    console.log(`Cached ${videos.length} videos for homepage`);
  },
  
  clear() {
    this.data = null;
    this.timestamp = null;
  },
  
  isValid() {
    return this.data && this.timestamp && (Date.now() - this.timestamp <= this.ttl);
  }
};

export const getProgressiveAllVideos = async (initialPages = 5, maxPages = 50) => {
  try {
    const cachedData = homepageVideoCache.get();
    if (cachedData) {
      console.log('Using cached homepage data');
      return cachedData;
    }
    
    console.log(`Starting progressive loading: initial ${initialPages} pages, max ${maxPages} pages`);
    
    const initialResult = await getAllVideosWithPagination(1, initialPages, 18);
    
    if (initialResult.videos.length === 0) {
      console.warn('No initial videos loaded');
      return initialResult;
    }
    
    console.log(`Initial load complete: ${initialResult.videos.length} videos from ${initialPages} pages`);
    
    homepageVideoCache.set(initialResult);
    
    if (initialResult.hasMore && initialPages < maxPages) {
      setTimeout(async () => {
        try {
          console.log('Starting background loading for remaining pages...');
          const remainingPages = maxPages - initialPages;
          const backgroundResult = await getAllVideosWithPagination(
            initialPages + 1, 
            remainingPages, 
            18
          );
          
          if (backgroundResult.videos.length > 0) {
            const combinedVideos = [
              ...initialResult.videos,
              ...backgroundResult.videos
            ].filter((video, index, self) => 
              self.findIndex(v => v.id === video.id) === index
            );
            
            const combinedResult = {
              videos: combinedVideos,
              hasMore: backgroundResult.hasMore,
              totalPagesLoaded: initialPages + backgroundResult.totalPagesLoaded,
              totalVideos: combinedVideos.length
            };
            
            homepageVideoCache.set(combinedResult);
            console.log(`Background loading complete: total ${combinedVideos.length} videos`);
          }
        } catch (error) {
          console.error('Background loading failed:', error);
        }
      }, 2000);
    }
    
    return initialResult;
    
  } catch (error) {
    console.error('Error in progressive loading:', error);
    return {
      videos: [],
      hasMore: false,
      totalPagesLoaded: 0,
      totalVideos: 0
    };
  }
};

export const getAllVideos = async (limit = 20, useProgressive = false) => {
  try {
    if (useProgressive) {
      const result = await getProgressiveAllVideos(15, 100);
      return result.videos.slice(0, limit);
    }
    
    console.log('Fetching all videos, limit:', limit);
    
    const response = await retryRequest(
      () => axios.get(`/api/provide/vod/?ac=list&limit=${limit}`),
      3,
      1000
    );
    
    const videoList = response.data?.list || [];
    console.log('All videos found:', videoList.length);
    
    if (videoList.length === 0) return [];
    
    const vodIds = videoList.slice(0, limit).map(item => item.vod_id).filter(Boolean);
    
    if (vodIds.length === 0) return [];
    
    return await fetchBatchVideoDetails(vodIds);
  } catch (error) {
    console.error('Error fetching all videos:', error);
    return [];
  }
};

export const getRelatedVideos = async (currentVideoId, currentVideoCategory, currentVideoTitle, limit = 12) => {
  try {
    if (!currentVideoId) return [];
    
    console.log('Fetching related videos for:', { 
      currentVideoId, 
      currentVideoCategory, 
      currentVideoTitle: currentVideoTitle?.substring(0, 50) 
    });
    
    let allRelatedVideos = [];
    const seenIds = new Set([currentVideoId]);

    if (!currentVideoCategory || currentVideoCategory.trim() === '') {
      console.log('No category provided, returning empty results');
      return [];
    }

    try {
      console.log(`Searching for videos in category: ${currentVideoCategory}`);
      
      const categoryStrategies = [
        `t=${encodeURIComponent(currentVideoCategory)}`,
        `class=${encodeURIComponent(currentVideoCategory)}`,
        `wd=${encodeURIComponent(currentVideoCategory)}`,
        currentVideoCategory.includes('伦理片') ? 't=20' : 
        currentVideoCategory.includes('悬疑片') ? 't=40' :
        currentVideoCategory.includes('战争片') ? 't=41' :
        currentVideoCategory.includes('犯罪片') ? 't=42' :
        currentVideoCategory.includes('剧情片') ? 't=43' :
        currentVideoCategory.includes('恐怖片') ? 't=44' :
        currentVideoCategory.includes('科幻片') ? 't=45' :
        currentVideoCategory.includes('爱情片') ? 't=46' :
        currentVideoCategory.includes('喜剧片') ? 't=47' :
        currentVideoCategory.includes('动作片') ? 't=48' :
        currentVideoCategory.includes('奇幻片') ? 't=49' :
        currentVideoCategory.includes('冒险片') ? 't=50' :
        currentVideoCategory.includes('惊悚片') ? 't=51' :
        currentVideoCategory.includes('动画片') ? 't=52' :
        currentVideoCategory.includes('记录片') ? 't=53' : null
      ].filter(Boolean);

      for (const strategy of categoryStrategies) {
        if (allRelatedVideos.length >= limit) break;
        
        try {
          console.log(`Trying category strategy: ${strategy}`);
          
          const pages = [1, 2, 3];
          
          for (const page of pages) {
            if (allRelatedVideos.length >= limit) break;
            
            const response = await retryRequest(
              () => axios.get(`/api/provide/vod/?ac=list&${strategy}&pg=${page}&limit=${limit * 2}`),
              2,
              1000
            );
            
            const categoryList = response.data?.list || [];
            console.log(`Category strategy page ${page} found: ${categoryList.length} videos`);
            
            if (categoryList.length > 0) {
              const filteredVideos = categoryList.filter(item => {
                if (!item.vod_id || seenIds.has(item.vod_id)) return false;
                
                const itemCategory = item.type_name || item.vod_class || '';
                return itemCategory === currentVideoCategory;
              });
              
              const idsToFetch = filteredVideos
                .slice(0, limit - allRelatedVideos.length)
                .map(item => {
                  seenIds.add(item.vod_id);
                  return item.vod_id;
                });
              
              if (idsToFetch.length > 0) {
                const batchVideos = await fetchBatchVideoDetails(idsToFetch);
                const sameCategoryVideos = batchVideos.filter(video => 
                  video.category === currentVideoCategory || 
                  video.rawData?.type_name === currentVideoCategory
                );
                
                allRelatedVideos.push(...sameCategoryVideos);
                console.log(`Added ${sameCategoryVideos.length} videos from category strategy page ${page}`);
                
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }
          }
          
          if (allRelatedVideos.length >= limit) break;
          
        } catch (error) {
          console.warn(`Category strategy failed: ${strategy}`, error.message);
          continue;
        }
      }
      
    } catch (error) {
      console.warn('All category strategies failed:', error.message);
    }

    if (allRelatedVideos.length < limit && currentVideoTitle) {
      try {
        const keywords = currentVideoTitle
          .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 2)
          .slice(0, 2);
        
        for (const keyword of keywords) {
          if (allRelatedVideos.length >= limit) break;
          
          console.log(`Searching by keyword in same category: ${keyword}`);
          
          const response = await retryRequest(
            () => axios.get(`/api/provide/vod/?ac=list&wd=${encodeURIComponent(keyword)}&limit=${limit * 2}`),
            2,
            1000
          );
          
          const keywordList = response.data?.list || [];
          
          if (keywordList.length > 0) {
            const sameCategoryItems = keywordList.filter(item => {
              if (!item.vod_id || seenIds.has(item.vod_id)) return false;
              const itemCategory = item.type_name || item.vod_class || '';
              return itemCategory === currentVideoCategory;
            });
            
            const idsToFetch = sameCategoryItems
              .slice(0, limit - allRelatedVideos.length)
              .map(item => {
                seenIds.add(item.vod_id);
                return item.vod_id;
              });
            
            if (idsToFetch.length > 0) {
              const batchVideos = await fetchBatchVideoDetails(idsToFetch);
              const sameCategoryVideos = batchVideos.filter(video => 
                video.category === currentVideoCategory ||
                video.rawData?.type_name === currentVideoCategory
              );
              
              allRelatedVideos.push(...sameCategoryVideos);
              console.log(`Added ${sameCategoryVideos.length} videos from keyword: ${keyword} in same category`);
            }
          }
        }
      } catch (error) {
        console.warn('Keyword search in same category failed:', error.message);
      }
    }

    const finalRelatedVideos = allRelatedVideos
      .filter((video, index, self) => 
        video && video.id && self.findIndex(v => v.id === video.id) === index
      )
      .sort((a, b) => {
        const viewsA = parseInt(a.views) || 0;
        const viewsB = parseInt(b.views) || 0;
        
        if (viewsB !== viewsA) {
          return viewsB - viewsA;
        }
        
        const timeA = new Date(a.uploadDate || 0).getTime();
        const timeB = new Date(b.uploadDate || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);

    console.log(`Found ${finalRelatedVideos.length}/${limit} related videos in category: ${currentVideoCategory}`);
    
    if (finalRelatedVideos.length === 0) {
      console.log(`No related videos found in category: ${currentVideoCategory}`);
    }

    return finalRelatedVideos;

  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

export const getMoreVideosInCategory = async (categoryName, excludeIds = [], page = 1, limit = 12) => {
  try {
    if (!categoryName || categoryName.trim() === '') {
      return { videos: [], hasMore: false };
    }

    console.log(`Getting more videos in category: ${categoryName}, page: ${page}`);
    
    const seenIds = new Set(excludeIds);
    let foundVideos = [];

    const getTypeId = (category) => {
      const categoryMap = {
        '伦理片': '20',
        '悬疑片': '40',
        '战争片': '41',
        '犯罪片': '42',
        '剧情片': '43',
        '恐怖片': '44',
        '科幻片': '45',
        '爱情片': '46',
        '喜剧片': '47',
        '动作片': '48',
        '奇幻片': '49',
        '冒险片': '50',
        '惊悚片': '51',
        '动画片': '52',
        '记录片': '53'
      };
      return categoryMap[category];
    };

    const typeId = getTypeId(categoryName);
    
    const strategies = [
      typeId ? `t=${typeId}` : null,
      `t=${encodeURIComponent(categoryName)}`,
      `wd=${encodeURIComponent(categoryName)}`
    ].filter(Boolean);

    for (const strategy of strategies) {
      if (foundVideos.length >= limit) break;
      
      try {
        console.log(`Trying strategy: ${strategy} on page ${page}`);
        
        const response = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&${strategy}&pg=${page}&limit=${limit * 2}`),
          2,
          1000
        );
        
        const videoList = response.data?.list || [];
        console.log(`Strategy found ${videoList.length} videos on page ${page}`);
        
        if (videoList.length > 0) {
          const filteredVideos = videoList.filter(item => {
            if (!item.vod_id || seenIds.has(item.vod_id)) return false;
            const itemCategory = item.type_name || item.vod_class || '';
            return itemCategory === categoryName;
          });
          
          const idsToFetch = filteredVideos
            .slice(0, limit - foundVideos.length)
            .map(item => {
              seenIds.add(item.vod_id);
              return item.vod_id;
            });
          
          if (idsToFetch.length > 0) {
            const batchVideos = await fetchBatchVideoDetails(idsToFetch);
            const sameCategoryVideos = batchVideos.filter(video => 
              video.category === categoryName || 
              video.rawData?.type_name === categoryName
            );
            
            foundVideos.push(...sameCategoryVideos);
            console.log(`Added ${sameCategoryVideos.length} videos from strategy`);
          }
        }
        
        if (foundVideos.length >= limit) break;
        
      } catch (error) {
        console.warn(`Strategy failed: ${strategy}`, error.message);
      }
    }

    let hasMore = false;
    if (foundVideos.length > 0) {
      try {
        const typeId = getTypeId(categoryName);
        const checkStrategy = typeId ? `t=${typeId}` : `t=${encodeURIComponent(categoryName)}`;
        
        const nextPageResponse = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&${checkStrategy}&pg=${page + 1}&limit=1`),
          1,
          500
        );
        
        const nextPageList = nextPageResponse.data?.list || [];
        hasMore = nextPageList.length > 0;
      } catch (error) {
        console.warn('Could not check for more pages:', error.message);
        hasMore = foundVideos.length >= limit;
      }
    }

    const sortedVideos = foundVideos
      .filter((video, index, self) => 
        video && video.id && self.findIndex(v => v.id === video.id) === index
      )
      .sort((a, b) => {
        const viewsA = parseInt(a.views) || 0;
        const viewsB = parseInt(b.views) || 0;
        return viewsB - viewsA;
      })
      .slice(0, limit);

    console.log(`Found ${sortedVideos.length} more videos in category: ${categoryName}, hasMore: ${hasMore}`);
    
    return {
      videos: sortedVideos,
      hasMore: hasMore
    };

  } catch (error) {
    console.error('Error getting more videos in category:', error);
    return { videos: [], hasMore: false };
  }
};

export const checkAPIStatus = async () => {
  try {
    const response = await axios.get('/api/provide/vod/?ac=list&limit=1', { timeout: 5000 });
    return {
      status: 'ok',
      data: response.data
    };
  } catch (error) {
    console.error('API Status check failed:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};