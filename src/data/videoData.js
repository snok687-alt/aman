// videoData.js - Utility functions for video data

// Sample video data - เพิ่มวิดีโอให้ทุกหมวดหมู่มีอย่างน้อย 1 วิดีโอ
const videoData = [
  {
    id: 1,
    title: 'Docker & Containerization Tutorial',
    channelName: 'DevOps Academy',
    views: 567000,
    duration: 1350,
    uploadDate: '6 วันที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    description: 'เรียนรู้ Docker และการทำ Containerization สำหรับการพัฒนาแอปพลิเคชันสมัยใหม่',
    category: 'education'
  },
  {
    id: 2,
    title: 'Python Web Scraping Complete Guide',
    channelName: 'Python Expert',
    views: 734000,
    duration: 1680,
    uploadDate: '1 สัปดาห์ที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    description: 'เรียนรู้เทคนิค Web Scraping ด้วย Python พร้อมไลบรารีต่างๆ และแนวทางปฏิบัติที่ถูกต้อง',
    category: 'education'
  },
  {
    id: 3,
    title: 'สอนใช้ Git แบบเข้าใจง่าย',
    channelName: 'Thai Dev Channel',
    views: 85000,
    duration: 1120,
    uploadDate: '2 วันก่อน',
    thumbnail: 'https://img.youtube.com/vi/1Mj8PpSRMeA/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=1Mj8PpSRMeA',
    description: 'วิดีโอสอนการใช้งาน Git และ GitHub สำหรับผู้เริ่มต้นแบบ Step by Step',
    category: 'education'
  },
  {
    id: 4,
    title: 'Taylor Swift - Blank Space',
    channelName: 'Music Official',
    views: 1250000,
    duration: 245,
    uploadDate: '1 เดือนที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://www.youtube.com/watch?v=e-ORhEE9VVg',
    description: 'มิวสิกวิดีโอเพลง Blank Space โดย Taylor Swift',
    category: 'music'
  },
  {
    id: 5,
    title: 'BTS - Dynamite Official MV',
    channelName: 'BTS Official',
    views: 985000,
    duration: 220,
    uploadDate: '2 สัปดาห์ที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://www.youtube.com/watch?v=gdZLi9oWNZg',
    description: 'มิวสิกวิดีโอเพลง Dynamite โดย BTS',
    category: 'music'
  },
  {
    id: 6,
    title: 'Blackpink - How You Like That',
    channelName: 'BLACKPINK',
    views: 2150000,
    duration: 210,
    uploadDate: '3 เดือนที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://www.youtube.com/watch?v=ioNng23DkIM',
    description: 'มิวสิกวิดีโอเพลง How You Like That โดย BLACKPINK',
    category: 'trending'
  },
  {
    id: 7,
    title: 'สอน ReactJS ตั้งแต่เริ่มต้น',
    channelName: 'Web Dev Tutorial',
    views: 156000,
    duration: 1280,
    uploadDate: '1 สัปดาห์ที่แล้ว',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop&crop=center',
    videoUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
    description: 'คอร์สเรียน ReactJS ฟรีตั้งแต่พื้นฐานจนใช้งานได้จริง',
    category: 'education'
  },
  {
    id: 8,
    title: 'Travis Scott, Bad Bunny, The Weeknd - K-POP (Official Music Video)',
    channelName: 'TravisScottVEVO',
    views: 54000000,
    duration: 210,
    uploadDate: '1 เดือนที่แล้ว',
    thumbnail: 'https://img.youtube.com/vi/fXw1PERFGMs/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/fXw1PERFGMs',
    description: 'Official Music Video for “K-POP” by Travis Scott, Bad Bunny, and The Weeknd.',
    category: 'trending'
  },
  {
    id: 9,
    title: 'aespa 에스파 - Supernova MV',
    channelName: 'aespa',
    views: 38000000,
    duration: 200,
    uploadDate: '2 สัปดาห์ที่แล้ว',
    thumbnail: 'https://img.youtube.com/vi/Yu1Zfk8n0cQ/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/Yu1Zfk8n0cQ',
    description: 'aespa - “Supernova” Official MV',
    category: 'music'
  },
  {
    id: 10,
    title: 'สอนเขียน React แบบละเอียด | React Tutorial for Beginners',
    channelName: 'DevTep',
    views: 110000,
    duration: 3600,
    uploadDate: '3 วันที่แล้ว',
    thumbnail: 'https://img.youtube.com/vi/lHaCFlAm-e8/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/lHaCFlAm-e8',
    description: 'คลิปนี้จะพาไปเรียนรู้ React ตั้งแต่ 0 แบบละเอียด เข้าใจง่าย',
    category: 'education'
  },
  {
    id: 11,
    title: 'สอน Next.js + React ใช้งาน SSR และ Static',
    channelName: 'Thai Dev Master',
    views: 72000,
    duration: 2400,
    uploadDate: '5 วันที่แล้ว',
    thumbnail: 'https://img.youtube.com/vi/n-07s0oObI8/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/n-07s0oObI8',
    description: 'Next.js คือ framework ที่น่าจับตามองมากในสาย React',
    category: 'education'
  },
  {
    id: 12,
    title: 'เรียนรู้ Node.js และ Express.js เบื้องต้น',
    channelName: 'Code Camp Thailand',
    views: 49000,
    duration: 1800,
    uploadDate: '1 สัปดาห์ที่แล้ว',
    thumbnail: 'https://img.youtube.com/vi/9U2t4UL6Bc4/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/9U2t4UL6Bc4',
    description: 'Node.js คือ JavaScript runtime ที่รันได้บนฝั่ง server พร้อมใช้งานกับ Express.js',
    category: 'education'
  },

]

// Function to get video by ID
export const getVideoById = (id) => {
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  return videoData.find(video => video.id === numericId);
};

// Function to get related videos (exclude current video)
export const getRelatedVideos = (currentVideoId, limit = 10) => {
  const numericId = typeof currentVideoId === 'string' ? parseInt(currentVideoId) : currentVideoId;
  const currentVideo = getVideoById(numericId);

  if (!currentVideo) return [];

  const relatedVideos = videoData
    .filter(video => video.id !== numericId && video.category === currentVideo.category)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return relatedVideos;
};

// Function to get all videos
export const getAllVideos = () => {
  return videoData;
};

// Helper function for fuzzy search
const fuzzySearch = (text, query) => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // ถ้าคำค้นหาอยู่ในข้อความเลย
  if (textLower.includes(queryLower)) return true;
  
  // ตรวจสอบคำที่คล้ายกัน ( fuzzy matching แบบง่าย)
  const queryWords = queryLower.split(/\s+/);
  return queryWords.some(word => textLower.includes(word));
};

// Function to search videos (title, channelName, category, description, tags)
export const searchVideos = (query) => {
  if (!query) return videoData;

  const lowercaseQuery = query.toLowerCase();

  // ถ้า query ตรงกับ videoUrl เป๊ะ ๆ ให้แสดงวิดีโอเดียว
  const urlMatch = videoData.find(video =>
    video.videoUrl?.toLowerCase() === lowercaseQuery
  );

  if (urlMatch) {
    return [urlMatch];
  }

  // ค้นหาด้วย title, channelName, description, category, tags
  return videoData
    .filter(video => {
      const fieldsToSearch = [
        video.title,
        video.channelName,
        video.description,
        video.category,
        video.tags ? video.tags.join(' ') : ''
      ];

      return fieldsToSearch.some(field =>
        field && fuzzySearch(field, lowercaseQuery)
      );
    })
    .sort((a, b) => {
      // เรียงลำดับตามความเกี่ยวข้อง
      const aTitleMatch = a.title.toLowerCase().includes(lowercaseQuery);
      const bTitleMatch = b.title.toLowerCase().includes(lowercaseQuery);
      
      // วิดีโอที่มีคำใน title ได้คะแนนสูงกว่า
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // ถ้าเท่ากันเรียงตามจำนวนยอดวิว (มากกว่ามาก่อน)
      return b.views - a.views;
    });
};

// Function to search by tags
export const searchVideosByTags = (tags) => {
  if (!tags || tags.length === 0) return videoData;
  
  const lowercaseTags = Array.isArray(tags) 
    ? tags.map(tag => tag.toLowerCase())
    : [tags.toLowerCase()];
    
  return videoData.filter(video => {
    return video.tags && lowercaseTags.some(tag => 
      video.tags.some(videoTag => 
        videoTag.toLowerCase().includes(tag)
      )
    );
  });
};

// Function to get popular videos
export const getPopularVideos = (limit = 10) => {
  return [...videoData]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

// Function to get videos by category
export const getVideosByCategory = (category) => {
  if (!category) return videoData;
  
  return videoData.filter(video => 
    video.category && video.category.toLowerCase() === category.toLowerCase()
  );
};