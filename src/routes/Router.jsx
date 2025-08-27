// Router.jsx
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
          <Route path="all" element={<VideoGrid title="ทั้งหมด" filter="all" />} />
          <Route path="trending" element={<VideoGrid title="กำลังฮิต" filter="trending" />} />
          <Route path="education" element={<VideoGrid title="การศึกษา" filter="education" />} />
          <Route path="travel" element={<VideoGrid title="ท่องเที่ยว" filter="travel" />} />
          <Route path="cooking" element={<VideoGrid title="ทำอาหาร" filter="cooking" />} />
          <Route path="music" element={<VideoGrid title="ดนตรี" filter="music" />} />
          <Route path="news" element={<VideoGrid title="ข่าว" filter="news" />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="watch/:videoId" element={<VideoPlayer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;