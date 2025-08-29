import axios from 'axios';

// ฟังก์ชันดึงข้อมูลวิดีโอแบบ批量 (หลาย ID พร้อมกัน)
const fetchBatchVideoDetails = async (vodIds) => {
  try {
    if (vodIds.length === 0) return [];
    
    const idsParam = vodIds.join(',');
    const response = await axios.get(`/api/provide/vod/?ac=detail&ids=${idsParam}`);
    const videoDataList = response.data?.list || [];
    
    return videoDataList.map(videoData => ({
      id: videoData.vod_id,
      title: videoData.vod_name,
      channelName: videoData.vod_director || videoData.type_name || 'ไม่ระบุ',
      views: parseInt(videoData.vod_hits) || 0,
      duration: 0,
      uploadDate: videoData.vod_year || 'ไม่ระบุ',
      thumbnail: videoData.vod_pic || '',
      videoUrl: '',
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

// ฟังก์ชันดึงข้อมูลวิดีโอจาก API
export const fetchVideosFromAPI = async (category = '', searchQuery = '') => {
  try {
    let url = '/api/provide/vod/?ac=list';
    
    if (category && category !== 'all') {
      url += `&t=${encodeURIComponent(category)}`;
    }
    
    if (searchQuery) {
      url += `&wd=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log('Fetching video list from:', url);
    
    const response = await axios.get(url);
    const videoList = response.data?.list || [];
    
    console.log('Found', videoList.length, 'videos in list');
    
    // จำกัดจำนวนวิดีโอที่โหลด
    const limitedVideos = videoList.slice(0, 20);
    const vodIds = limitedVideos.map(item => item.vod_id);
    
    // แบ่ง ID เป็นชุดๆ ละ 5-10 ID (แล้วแต่ server รองรับ)
    const idChunks = chunkArray(vodIds, 8);
    const allDetailedVideos = [];
    
    for (const idChunk of idChunks) {
      try {
        const batchVideos = await fetchBatchVideoDetails(idChunk);
        allDetailedVideos.push(...batchVideos);
      } catch (error) {
        console.error('Error in batch request, falling back to individual requests');
        
        // หาก批量 request ล้มเหลว ให้ลองทีละตัว
        for (const id of idChunk) {
          try {
            const response = await axios.get(`/api/provide/vod/?ac=detail&ids=${id}`);
            const videoData = response.data?.list?.[0];
            
            if (videoData) {
              allDetailedVideos.push({
                id: videoData.vod_id,
                title: videoData.vod_name,
                channelName: videoData.vod_director || videoData.type_name || 'ไม่ระบุ',
                views: parseInt(videoData.vod_hits) || 0,
                duration: 0,
                uploadDate: videoData.vod_year || 'ไม่ระบุ',
                thumbnail: videoData.vod_pic || '',
                videoUrl: '',
                description: videoData.vod_content || 'ไม่มีคำอธิบาย',
                category: videoData.type_name || videoData.vod_class || 'ทั่วไป',
                rawData: videoData
              });
            }
          } catch (individualError) {
            console.error(`Failed to get details for video ${id}:`, individualError);
            // เพิ่มข้อมูลพื้นฐานหากดึง detail ไม่ได้
            const basicItem = limitedVideos.find(item => item.vod_id === id);
            if (basicItem) {
              allDetailedVideos.push({
                id: basicItem.vod_id,
                title: basicItem.vod_name,
                channelName: basicItem.vod_director || basicItem.type_name || 'ไม่ระบุ',
                views: parseInt(basicItem.vod_hits) || 0,
                duration: 0,
                uploadDate: basicItem.vod_year || 'ไม่ระบุ',
                thumbnail: '',
                videoUrl: '',
                description: basicItem.vod_content || 'ไม่มีคำอธิบาย',
                category: basicItem.type_name || basicItem.vod_class || 'ทั่วไป',
                rawData: basicItem
              });
            }
          }
        }
      }
    }
    
    return allDetailedVideos;
  } catch (error) {
    console.error('Error fetching videos from API:', error);
    return [];
  }
};

// ฟังก์ชันสำหรับดึงวิดีโอโดย ID
export const getVideoById = async (id) => {
  try {
    const response = await axios.get(`/api/provide/vod/?ac=detail&ids=${id}`);
    const videoData = response.data?.list?.[0];
    
    if (!videoData) return null;
    
    return {
      id: videoData.vod_id,
      title: videoData.vod_name,
      channelName: videoData.vod_director || videoData.type_name || 'ไม่ระบุ',
      views: parseInt(videoData.vod_hits) || 0,
      duration: 0,
      uploadDate: videoData.vod_year || 'ไม่ระบุ',
      thumbnail: videoData.vod_pic || '',
      videoUrl: '',
      description: videoData.vod_content || 'ไม่มีคำอธิบาย',
      category: videoData.type_name || videoData.vod_class || 'ทั่วไป',
      rawData: videoData
    };
  } catch (error) {
    console.error(`Error fetching details for video ${id}:`, error);
    return null;
  }
};

// ฟังก์ชันสำหรับค้นหาวิดีโอ
export const searchVideos = async (query) => {
  try {
    const response = await axios.get(`/api/provide/vod/?ac=list&wd=${encodeURIComponent(query)}`);
    const videoList = response.data?.list || [];
    
    const vodIds = videoList.slice(0, 20).map(item => item.vod_id);
    return await fetchBatchVideoDetails(vodIds);
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};

// ฟังก์ชันสำหรับดึงวิดีโอตามหมวดหมู่
export const getVideosByCategory = async (category) => {
  try {
    const response = await axios.get(`/api/provide/vod/?ac=list&t=${encodeURIComponent(category)}`);
    const videoList = response.data?.list || [];
    
    const vodIds = videoList.slice(0, 20).map(item => item.vod_id);
    return await fetchBatchVideoDetails(vodIds);
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return [];
  }
};

// ฟังก์ชันสำหรับดึงวิดีโอทั้งหมด
export const getAllVideos = async () => {
  return await fetchVideosFromAPI();
};

// ฟังก์ชันสำหรับดึงวิดีโอที่เกี่ยวข้อง
export const getRelatedVideos = async (currentVideoId, currentVideoCategory, limit = 6) => {
  try {
    const response = await axios.get(`/api/provide/vod/?ac=list&t=${encodeURIComponent(currentVideoCategory)}`);
    const videoList = response.data?.list || [];
    
    const relatedIds = videoList
      .filter(item => item.vod_id !== currentVideoId)
      .slice(0, limit)
      .map(item => item.vod_id);
    
    return await fetchBatchVideoDetails(relatedIds);
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};