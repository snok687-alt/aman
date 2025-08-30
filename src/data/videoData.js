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

    // กลยุทธ์ที่ 1: ค้นหาจากหมวดหมู่เดียวกัน (หลายรูปแบบ)
    if (currentVideoCategory) {
      const categoryStrategies = [
        // ใช้หมวดหมู่ตรงๆ
        `t=${encodeURIComponent(currentVideoCategory)}`,
        // ค้นหาจากคำค้นหา
        `wd=${encodeURIComponent(currentVideoCategory)}`,
        // ลองใช้ type_id หากมี
        currentVideoCategory.includes('ID:') ? `t=${currentVideoCategory.split('ID:')[1]}` : null
      ].filter(Boolean);

      for (const strategy of categoryStrategies) {
        if (allRelatedVideos.length >= limit) break;
        
        try {
          console.log(`Trying category strategy: ${strategy}`);
          
          const response = await retryRequest(
            () => axios.get(`/api/provide/vod/?ac=list&${strategy}&limit=${limit * 2}`),
            2,
            800
          );
          
          const categoryList = response.data?.list || [];
          console.log(`Category strategy found: ${categoryList.length} videos`);
          
          if (categoryList.length > 0) {
            const filteredIds = categoryList
              .filter(item => item.vod_id && !seenIds.has(item.vod_id))
              .slice(0, limit - allRelatedVideos.length)
              .map(item => {
                seenIds.add(item.vod_id);
                return item.vod_id;
              });
            
            if (filteredIds.length > 0) {
              const batchVideos = await fetchBatchVideoDetails(filteredIds);
              allRelatedVideos.push(...batchVideos);
              console.log(`Added ${batchVideos.length} videos from category strategy`);
            }
          }
        } catch (error) {
          console.warn(`Category strategy failed: ${strategy}`, error.message);
        }
      }
    }

    // กลยุทธ์ที่ 2: ค้นหาจากคำสำคัญในชื่อ
    if (allRelatedVideos.length < limit && currentVideoTitle) {
      try {
        // แยกคำสำคัญจากชื่อ (เอาคำที่สำคัญ)
        const keywords = currentVideoTitle
          .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ') // เอาแต่ไทย อังกฤษ ตัวเลข
          .split(/\s+/)
          .filter(word => word.length >= 2)
          .slice(0, 3); // เอาแค่ 3 คำแรก
        
        for (const keyword of keywords) {
          if (allRelatedVideos.length >= limit) break;
          
          console.log(`Searching by keyword: ${keyword}`);
          
          const response = await retryRequest(
            () => axios.get(`/api/provide/vod/?ac=list&wd=${encodeURIComponent(keyword)}&limit=${limit}`),
            2,
            800
          );
          
          const keywordList = response.data?.list || [];
          console.log(`Keyword "${keyword}" found: ${keywordList.length} videos`);
          
          if (keywordList.length > 0) {
            const filteredIds = keywordList
              .filter(item => item.vod_id && !seenIds.has(item.vod_id))
              .slice(0, Math.max(1, Math.floor((limit - allRelatedVideos.length) / keywords.length)))
              .map(item => {
                seenIds.add(item.vod_id);
                return item.vod_id;
              });
            
            if (filteredIds.length > 0) {
              const batchVideos = await fetchBatchVideoDetails(filteredIds);
              allRelatedVideos.push(...batchVideos);
              console.log(`Added ${batchVideos.length} videos from keyword: ${keyword}`);
            }
          }
        }
      } catch (error) {
        console.warn('Keyword search failed:', error.message);
      }
    }

    // กลยุทธ์ที่ 3: วิดีโอยอดนิยม/ล่าสุด (แบบสุ่มหน้า)
    if (allRelatedVideos.length < limit) {
      try {
        const randomPage = Math.floor(Math.random() * 5) + 1; // หน้า 1-5
        console.log(`Fetching popular videos from page ${randomPage}`);
        
        const response = await retryRequest(
          () => axios.get(`/api/provide/vod/?ac=list&pg=${randomPage}&limit=${limit * 2}`),
          2,
          800
        );
        
        const popularList = response.data?.list || [];
        console.log(`Popular videos found: ${popularList.length} videos`);
        
        if (popularList.length > 0) {
          // เรียงตามจำนวนการดู
          const sortedByViews = popularList
            .filter(item => item.vod_id && !seenIds.has(item.vod_id))
            .sort((a, b) => (parseInt(b.vod_hits) || 0) - (parseInt(a.vod_hits) || 0))
            .slice(0, limit - allRelatedVideos.length)
            .map(item => {
              seenIds.add(item.vod_id);
              return item.vod_id;
            });
          
          if (sortedByViews.length > 0) {
            const batchVideos = await fetchBatchVideoDetails(sortedByViews);
            allRelatedVideos.push(...batchVideos);
            console.log(`Added ${batchVideos.length} popular videos`);
          }
        }
      } catch (error) {
        console.warn('Popular videos search failed:', error.message);
      }
    }

    // กลยุทธ์ที่ 4: วิดีโอแบบสุ่ม (หากยังไม่พอ)
    if (allRelatedVideos.length < limit) {
      try {
        const randomStrategies = [
          '/api/provide/vod/?ac=list&limit=50',
          '/api/provide/vod/?ac=list&pg=2&limit=30',
          '/api/provide/vod/?ac=list&pg=3&limit=30'
        ];
        
        for (const url of randomStrategies) {
          if (allRelatedVideos.length >= limit) break;
          
          try {
            console.log('Fetching random videos from:', url);
            
            const response = await retryRequest(
              () => axios.get(url),
              1,
              500
            );
            
            const randomList = response.data?.list || [];
            
            if (randomList.length > 0) {
              // สุ่มเลือกวิดีโอ
              const shuffled = randomList
                .filter(item => item.vod_id && !seenIds.has(item.vod_id))
                .sort(() => 0.5 - Math.random())
                .slice(0, limit - allRelatedVideos.length)
                .map(item => {
                  seenIds.add(item.vod_id);
                  return item.vod_id;
                });
              
              if (shuffled.length > 0) {
                const batchVideos = await fetchBatchVideoDetails(shuffled);
                allRelatedVideos.push(...batchVideos);
                console.log(`Added ${batchVideos.length} random videos`);
                break; // หยุดหากได้วิดีโอแล้ว
              }
            }
          } catch (error) {
            console.warn(`Random strategy failed: ${url}`, error.message);
          }
        }
      } catch (error) {
        console.warn('Random videos search failed:', error.message);
      }
    }

    // กรองและจัดเรียงผลลัพธ์
    const finalRelatedVideos = allRelatedVideos
      .filter((video, index, self) => 
        video && video.id && self.findIndex(v => v.id === video.id) === index
      )
      .slice(0, limit);

    console.log(`Total related videos found: ${finalRelatedVideos.length}/${limit}`);
    return finalRelatedVideos;

  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

// ฟังก์ชันดึงหมวดหมู่ทั้งหมด - ปรับปรุงแล้ว
export const getCategories = async () => {
  try {
    console.log('Fetching categories');
    
    // ลองดึงจากหลายแหล่ง
    const responses = await Promise.allSettled([
      axios.get('/api/provide/vod/?ac=list&limit=100'),
      axios.get('/api/provide/vod/?ac=list&pg=2&limit=50'),
      axios.get('/api/provide/vod/?ac=videolist') // บาง API อาจใช้ path นี้
    ]);
    
    const allVideos = [];
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        const videoList = response.value.data?.list || [];
        allVideos.push(...videoList);
        console.log(`Source ${index + 1} provided ${videoList.length} videos`);
      }
    });
    
    // สกัดหมวดหมู่จากวิดีโอที่มี
    const categories = [...new Set(
      allVideos
        .map(item => item.type_name || item.vod_class)
        .filter(Boolean)
        .filter(cat => cat.length > 0 && cat !== 'undefined')
    )].sort();
    
    console.log('Categories found:', categories.length, categories);
    return categories;
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['ทั่วไป', 'บันเทิง', 'ข่าว', 'กีฬา']; // fallback categories
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