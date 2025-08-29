import axios from 'axios';

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
export const fetchVideosFromAPI = async (category = '', searchQuery = '') => {
  try {
    let url = '/api/provide/vod/?ac=list';
    
    if (category && category !== 'all') {
      url += `&t=${encodeURIComponent(category)}`;
    }
    
    if (searchQuery) {
      url += `&wd=${encodeURIComponent(searchQuery)}`;
    }
    
    const response = await axios.get(url);
    const videoList = response.data?.list || [];
    
    return videoList.map(item => ({
      id: item.vod_id,
      title: item.vod_name,
      channelName: item.vod_director || 'ไม่ระบุ',
      views: parseInt(item.vod_hits) || 0,
      duration: 0,
      uploadDate: item.vod_year || 'ไม่ระบุ',
      thumbnail: item.vod_pic || '',
      videoUrl: '',
      description: item.vod_content || 'ไม่มีคำอธิบาย',
      category: item.vod_class || 'ทั่วไป',
      rawData: item
    }));
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
    
    let videoUrl = '';
    if (videoData.vod_play_url) {
      const match = videoData.vod_play_url.match(/(http[s]?:\/\/.*?\.m3u8)/);
      videoUrl = match ? match[1] : '';
    }
    
    return {
      id: videoData.vod_id,
      title: videoData.vod_name,
      channelName: videoData.vod_director || 'ไม่ระบุ',
      views: parseInt(videoData.vod_hits) || 0,
      duration: 0,
      uploadDate: videoData.vod_year || 'ไม่ระบุ',
      thumbnail: videoData.vod_pic || '',
      videoUrl: videoUrl,
      description: videoData.vod_content || 'ไม่มีคำอธิบาย',
      category: videoData.vod_class || 'ทั่วไป',
      vod_actor: videoData.vod_actor,
      vod_director: videoData.vod_director,
      rawData: videoData
    };
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    return null;
  }
};

// ฟังก์ชันสำหรับค้นหาวิดีโอ
export const searchVideos = async (query) => {
  return await fetchVideosFromAPI('', query);
};

// ฟังก์ชันสำหรับดึงวิดีโอตามหมวดหมู่
export const getVideosByCategory = async (category) => {
  return await fetchVideosFromAPI(category);
};

// ฟังก์ชันสำหรับดึงวิดีโอทั้งหมด
export const getAllVideos = async () => {
  return await fetchVideosFromAPI();
};

// ฟังก์ชันสำหรับดึงวิดีโอที่เกี่ยวข้อง
export const getRelatedVideos = async (currentVideoId, currentVideoCategory, limit = 6) => {
  const videos = await fetchVideosFromAPI(currentVideoCategory);
  return videos
    .filter(video => video.id !== currentVideoId)
    .slice(0, limit);
};