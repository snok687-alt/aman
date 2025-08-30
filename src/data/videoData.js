import axios from 'axios';

// กำหนด timeout และ retry settings
axios.defaults.timeout = 15000; // 15 วินาที

// ฟังก์ชัน retry สำหรับ request ที่ล้มเหลว
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.warn(`Request failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i === maxRetries - 1) throw error;
      
      // เพิ่ม delay แบบ exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// ฟังก์ชันดึงข้อมูลวิดีโอแบบ batch (หลาย ID พร้อมกัน) - ปรับปรุงแล้ว
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
    
    return videoDataList.map(videoData => ({
      id: videoData.vod_id,
      title: videoData.vod_name || 'ไม่มีชื่อ',
      channelName: videoData.vod_director || videoData.type_name || 'ไม่ระบุ',
      views: parseInt(videoData.vod_hits) || 0,
      duration: parseInt(videoData.vod_duration) || 0,
      uploadDate: videoData.vod_year || videoData.vod_time || 'ไม่ระบุ',
      thumbnail: videoData.vod_pic || '',
      videoUrl: videoData.vod_play_url || '',
      description: videoData.vod_content || 'ไม่มีคำอธิบาย',
      category: videoData.type_name || videoData.vod_class || 'ทั่วไป',
      rawData: videoData
    }));
  } catch (error) {
    console.error(`Error fetching batch details for videos:`, error);
    return [];
  }
};

// ฟังก์ชันแบ่ง array เป็น chunks
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// ฟังก์ชันดึงข้อมูลวิดีโอจาก API - ปรับปรุงแล้ว
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
    
    // เพิ่ม limit parameter
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
    
    // จำกัดจำนวนวิดีโอที่โหลด
    const limitedVideos = videoList.slice(0, Math.min(limit, videoList.length));
    const vodIds = limitedVideos.map(item => item.vod_id).filter(Boolean);
    
    if (vodIds.length === 0) {
      console.log('No valid video IDs found');
      return [];
    }
    
    // แบ่ง ID เป็นชุดๆ ละ 5 ID (ลดลงเพื่อความเสถียร)
    const idChunks = chunkArray(vodIds, 5);
    const allDetailedVideos = [];
    
    for (const [index, idChunk] of idChunks.entries()) {
      try {
        console.log(`Processing chunk ${index + 1}/${idChunks.length}:`, idChunk);
        
        const batchVideos = await fetchBatchVideoDetails(idChunk);
        if (batchVideos.length > 0) {
          allDetailedVideos.push(...batchVideos);
        }
        
        // เพิ่ม delay ระหว่าง batch เพื่อไม่ให้ server ล้น
        if (index < idChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`Error in batch ${index + 1}, falling back to individual requests:`, error);
        
        // หาก batch request ล้มเหลว ให้ลองทีละตัว
        for (const id of idChunk) {
          try {
            const individualVideo = await getVideoById(id);
            if (individualVideo) {
              allDetailedVideos.push(individualVideo);
            }
            
            // เพิ่ม delay ระหว่าง individual request
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (individualError) {
            console.error(`Failed to get details for video ${id}:`, individualError);
            
            // เพิ่มข้อมูลพื้นฐานหากดึง detail ไม่ได้
            const basicItem = limitedVideos.find(item => item.vod_id === id);
            if (basicItem) {
              allDetailedVideos.push({
                id: basicItem.vod_id,
                title: basicItem.vod_name || 'ไม่มีชื่อ',
                channelName: basicItem.vod_director || basicItem.type_name || 'ไม่ระบุ',
                views: parseInt(basicItem.vod_hits) || 0,
                duration: parseInt(basicItem.vod_duration) || 0,
                uploadDate: basicItem.vod_year || basicItem.vod_time || 'ไม่ระบุ',
                thumbnail: basicItem.vod_pic || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&h=360&fit=crop',
                videoUrl: basicItem.vod_play_url || '',
                description: basicItem.vod_content || 'ไม่มีคำอธิบาย',
                category: basicItem.type_name || basicItem.vod_class || 'ทั่วไป',
                rawData: basicItem
              });
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

// ฟังก์ชันสำหรับดึงวิดีโอโดย ID - ปรับปรุงแล้ว
export const getVideoById = async (id) => {
  try {
    if (!id) return null;
    
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
    
    return {
      id: videoData.vod_id,
      title: videoData.vod_name || 'ไม่มีชื่อ',
      channelName: videoData.vod_director || videoData.type_name || 'ไม่ระบุ',
      views: parseInt(videoData.vod_hits) || 0,
      duration: parseInt(videoData.vod_duration) || 0,
      uploadDate: videoData.vod_year || videoData.vod_time || 'ไม่ระบุ',
      thumbnail: videoData.vod_pic || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&h=360&fit=crop',
      videoUrl: videoData.vod_play_url || '',
      description: videoData.vod_content || 'ไม่มีคำอธิบาย',
      category: videoData.type_name || videoData.vod_class || 'ทั่วไป',
      rawData: videoData
    };
  } catch (error) {
    console.error(`Error fetching details for video ${id}:`, error);
    return null;
  }
};

// ฟังก์ชันสำหรับค้นหาวิดีโอ - ปรับปรุงแล้ว
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

// ฟังก์ชันสำหรับดึงวิดีโอตามหมวดหมู่ - ปรับปรุงแล้ว
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

// ฟังก์ชันสำหรับดึงวิดีโอทั้งหมด - ปรับปรุงแล้ว
export const getAllVideos = async (limit = 20) => {
  try {
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

// ฟังก์ชันสำหรับดึงวิดีโอที่เกี่ยวข้อง - ปรับปรุงใหม่หมด
export const getRelatedVideos = async (currentVideoId, currentVideoCategory, limit = 8) => {
  try {
    if (!currentVideoId) return [];
    
    console.log('Fetching related videos for:', { currentVideoId, currentVideoCategory });
    
    let relatedVideos = [];
    
    // วิธีที่ 1: หาจากหมวดหมู่เดียวกัน
    if (currentVideoCategory) {
      try {
        const categoryResponse = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&t=${encodeURIComponent(currentVideoCategory)}&limit=${limit * 2}`),
          2,
          1000
        );
        
        const categoryList = categoryResponse.data?.list || [];
        console.log('Category related videos found:', categoryList.length);
        
        if (categoryList.length > 0) {
          const filteredIds = categoryList
            .filter(item => item.vod_id && item.vod_id !== currentVideoId)
            .slice(0, limit)
            .map(item => item.vod_id);
          
          if (filteredIds.length > 0) {
            relatedVideos = await fetchBatchVideoDetails(filteredIds);
          }
        }
      } catch (error) {
        console.warn('Category search failed:', error);
      }
    }
    
    // วิธีที่ 2: หากไม่พอ ให้หาจาก keyword ในชื่อหมวดหมู่
    if (relatedVideos.length < limit && currentVideoCategory) {
      try {
        const keywordResponse = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&wd=${encodeURIComponent(currentVideoCategory)}&limit=${limit}`),
          2,
          1000
        );
        
        const keywordList = keywordResponse.data?.list || [];
        console.log('Keyword related videos found:', keywordList.length);
        
        if (keywordList.length > 0) {
          const additionalIds = keywordList
            .filter(item => item.vod_id && 
              item.vod_id !== currentVideoId && 
              !relatedVideos.some(existing => existing.id === item.vod_id))
            .slice(0, limit - relatedVideos.length)
            .map(item => item.vod_id);
          
          if (additionalIds.length > 0) {
            const additionalVideos = await fetchBatchVideoDetails(additionalIds);
            relatedVideos.push(...additionalVideos);
          }
        }
      } catch (error) {
        console.warn('Keyword search failed:', error);
      }
    }
    
    // วิธีที่ 3: หากยังไม่พอ ให้หาวิดีโอล่าสุด
    if (relatedVideos.length < limit) {
      try {
        console.log('Not enough related videos, fetching latest videos');
        
        const latestResponse = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&limit=${limit * 2}`),
          2,
          1000
        );
        
        const latestList = latestResponse.data?.list || [];
        console.log('Latest videos found:', latestList.length);
        
        if (latestList.length > 0) {
          const remainingIds = latestList
            .filter(item => item.vod_id && 
              item.vod_id !== currentVideoId && 
              !relatedVideos.some(existing => existing.id === item.vod_id))
            .slice(0, limit - relatedVideos.length)
            .map(item => item.vod_id);
          
          if (remainingIds.length > 0) {
            const remainingVideos = await fetchBatchVideoDetails(remainingIds);
            relatedVideos.push(...remainingVideos);
          }
        }
      } catch (error) {
        console.warn('Latest videos search failed:', error);
      }
    }
    
    console.log('Total related videos found:', relatedVideos.length);
    return relatedVideos.slice(0, limit); // ตัดให้เหลือตาม limit ที่ต้องการ
    
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

// ฟังก์ชันดึงหมวดหมู่ทั้งหมด
export const getCategories = async () => {
  try {
    console.log('Fetching categories');
    
    const response = await retryRequest(
      () => axios.get('/api/provide/vod/?ac=list'),
      2,
      1000
    );
    
    const videoList = response.data?.list || [];
    
    // สกัดหมวดหมู่จากวิดีโอที่มี
    const categories = [...new Set(
      videoList
        .map(item => item.type_name || item.vod_class)
        .filter(Boolean)
    )];
    
    console.log('Categories found:', categories.length);
    return categories;
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// ฟังก์ชันตรวจสอบสถานะ API
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