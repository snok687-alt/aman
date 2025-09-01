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
          <Route index element={<VideoGrid title="วิดีโอแนะนำ" filter="all" />} />
          {/* เส้นทางสำหรับหมวดหมู่จาก API */}
          <Route path="category/20" element={<VideoGrid title="伦理片" filter="all" />} />
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