// ถ้าคุณมี component ที่เรียกใช้ VideoGrid อยู่แล้ว
// เช่น ใน App.jsx หรือ component หลัก

// วิธีที่ 1: ใน Router หรือ Component ที่เรียกใช้ VideoGrid
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import VideoGrid from './VideoGrid';

// ถ้าใช้ใน routing โดยตรง
const MainContent = () => {
  const context = useOutletContext();
  const { searchTerm } = context || {};
  
  return (
    <VideoGrid 
      title="หน้าแรก" 
      filter="all" 
      searchTerm={searchTerm}
    />
  );
};

// หรือ วิธีที่ 2: ถ้าเรียกใช้ VideoGrid โดยตรงในหน้าอื่น
// เพียงเพิ่มการรับ context ใน component นั้น

// วิธีที่ 3: แก้ไขใน Router configuration
// ใน App.jsx หรือ main router file

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VideoGrid from './components/VideoGrid';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />}>
          {/* แทนที่จะใช้ VideoGrid โดยตรง ให้สร้าง wrapper component */}
          <Route index element={<HomeWrapper />} />
          <Route path="/all" element={<AllWrapper />} />
          <Route path="/education" element={<EducationWrapper />} />
          <Route path="/music" element={<MusicWrapper />} />
          {/* ... routes อื่นๆ */}
        </Route>
      </Routes>
    </Router>
  );
}

// Wrapper components
const HomeWrapper = () => {
  const context = useOutletContext();
  const { searchTerm } = context || {};
  return <VideoGrid title="หน้าแรก" filter="all" searchTerm={searchTerm} />;
};

const AllWrapper = () => {
  const context = useOutletContext();
  const { searchTerm } = context || {};
  return <VideoGrid title="ทั้งหมด" filter="all" searchTerm={searchTerm} />;
};

const EducationWrapper = () => {
  const context = useOutletContext();
  const { searchTerm } = context || {};
  return <VideoGrid title="การศึกษา" filter="education" searchTerm={searchTerm} />;
};

const MusicWrapper = () => {
  const context = useOutletContext();
  const { searchTerm } = context || {};
  return <VideoGrid title="ดนตรี" filter="music" searchTerm={searchTerm} />;
};

export default App;