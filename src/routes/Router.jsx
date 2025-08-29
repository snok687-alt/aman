import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import VideoPlayer from '../pages/VideoPlayer';
import VideoGrid from '../pages/VideoGrid';
import SearchResults from '../pages/SearchResults';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />}>
          {/* <Route index element={<VideoGrid title="วิดีโอแนะนำ" filter="all" />} />
          <Route path="all" element={<VideoGrid title="ทั้งหมด" filter="all" />} />
          <Route path="trending" element={<VideoGrid title="กำลังฮิต" filter="trending" />} />
          <Route path="education" element={<VideoGrid title="การศึกษา" filter="education" />} />
          <Route path="travel" element={<VideoGrid title="ท่องเที่ยว" filter="travel" />} />
          <Route path="cooking" element={<VideoGrid title="ทำอาหาร" filter="cooking" />} />
          <Route path="music" element={<VideoGrid title="ดนตรี" filter="music" />} />
          <Route path="news" element={<VideoGrid title="ข่าว" filter="news" />} /> */}
          {/* เส้นทางสำหรับหมวดหมู่จาก API */}
          <Route index path="category/20" element={<VideoGrid title="伦理片" filter="all" />} />
          <Route path="category/40" element={<VideoGrid title="悬疑片" filter="all" />} />
          <Route path="category/41" element={<VideoGrid title="战争片" filter="all" />} />
          <Route path="category/42" element={<VideoGrid title="犯罪片" filter="all" />} />
          <Route path="category/43" element={<VideoGrid title="剧情片" filter="all" />} />
          <Route path="category/44" element={<VideoGrid title="恐怖片" filter="all" />} />
          <Route path="category/45" element={<VideoGrid title="科幻片" filter="all" />} />
          <Route path="category/46" element={<VideoGrid title="爱情片" filter="all" />} />
          <Route path="category/47" element={<VideoGrid title="喜剧片" filter="all" />} />
          <Route path="category/48" element={<VideoGrid title="动作片" filter="all" />} />
          <Route path="category/49" element={<VideoGrid title="奇幻片" filter="all" />} />
          <Route path="category/50" element={<VideoGrid title="冒险片" filter="all" />} />
          <Route path="category/51" element={<VideoGrid title="惊悚片" filter="all" />} />
          <Route path="category/52" element={<VideoGrid title="动画片" filter="all" />} />
          <Route path="category/53" element={<VideoGrid title="记录片" filter="all" />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="watch/:videoId" element={<VideoPlayer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;