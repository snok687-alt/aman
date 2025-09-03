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
          <Route index element={<VideoGrid title="วิดีโอทั้งหมด" filter="all" />} />
          {/* เส้นทางสำหรับหมวดหมู่จาก API - แก้ไข ID ที่ซ้ำกัน */}
          <Route path="category/20" element={<VideoGrid title="巨乳" filter="all" />} />
          <Route path="category/40" element={<VideoGrid title="自拍" filter="all" />} />
          <Route path="category/41" element={<VideoGrid title="偷情" filter="all" />} />
          <Route path="category/42" element={<VideoGrid title="偷拍" filter="all" />} />
          <Route path="category/43" element={<VideoGrid title="萝莉" filter="all" />} />
          <Route path="category/44" element={<VideoGrid title="动漫" filter="all" />} />
          <Route path="category/45" element={<VideoGrid title="强奸" filter="all" />} />
          <Route path="category/46" element={<VideoGrid title="迷奸" filter="all" />} />
          <Route path="category/47" element={<VideoGrid title="乱伦" filter="all" />} />
          <Route path="category/48" element={<VideoGrid title="虐待" filter="all" />} />
          <Route path="category/49" element={<VideoGrid title="网红" filter="all" />} />
          <Route path="category/50" element={<VideoGrid title="制服" filter="all" />} />
          <Route path="category/51" element={<VideoGrid title="麻豆" filter="all" />} />
          <Route path="category/52" element={<VideoGrid title="果冻" filter="all" />} />
          <Route path="category/53" element={<VideoGrid title="SM" filter="all" />} />
          {/* หมวดหมู่ที่เหลือควรมี ID ไม่ซ้ำกัน */}
          <Route path="category/54" element={<VideoGrid title="重口" filter="all" />} />
          <Route path="category/55" element={<VideoGrid title="处女" filter="all" />} />
          <Route path="category/56" element={<VideoGrid title="熟女" filter="all" />} />
          <Route path="category/57" element={<VideoGrid title="换妻" filter="all" />} />
          <Route path="category/58" element={<VideoGrid title="明星" filter="all" />} />
          <Route path="category/59" element={<VideoGrid title="人妻" filter="all" />} />
          <Route path="category/60" element={<VideoGrid title="孕妇" filter="all" />} />
          <Route path="category/61" element={<VideoGrid title="人妖" filter="all" />} />
          <Route path="category/62" element={<VideoGrid title="人兽" filter="all" />} />
          <Route path="category/63" element={<VideoGrid title="爆菊" filter="all" />} />
          <Route path="category/64" element={<VideoGrid title="潮喷" filter="all" />} />
          <Route path="category/65" element={<VideoGrid title="剧情" filter="all" />} />
          <Route path="category/66" element={<VideoGrid title="无码" filter="all" />} />
          <Route path="category/67" element={<VideoGrid title="日韩" filter="all" />} />
          <Route path="category/68" element={<VideoGrid title="精品" filter="all" />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="watch/:videoId" element={<VideoPlayer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;