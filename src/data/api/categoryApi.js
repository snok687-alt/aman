import axios from 'axios';
import { withRetry } from '../cache/videoCache';

export const getCategories = async () => {
  try {
    console.log('Fetching categories');
    
    const responses = await Promise.allSettled([
      axios.get('/api/provide/vod/?ac=list&limit=100'),
      axios.get('/api/provide/vod/?ac=list&pg=2&limit=50'),
      axios.get('/api/provide/vod/?ac=videolist')
    ]);
    
    const allVideos = [];
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        const videoList = response.value.data?.list || [];
        allVideos.push(...videoList);
        console.log(`Source ${index + 1} provided ${videoList.length} videos`);
      }
    });
    
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
    return ['ทั่วไป', 'บันเทิง', 'ข่าว', 'กีฬา'];
  }
};