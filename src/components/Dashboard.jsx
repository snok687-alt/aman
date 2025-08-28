// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  const isVideoPage = location.pathname.startsWith('/watch');
  const isSearchPage = location.pathname === '/search';

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    
    // ล้าง timeout เก่าถ้ามี
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // ตั้งค่า timeout ใหม่สำหรับการค้นหาแบบ real-time
    searchTimeout.current = setTimeout(() => {
      if (term.trim() !== '') {
        // ถ้าอยู่ในหน้าค้นหาแล้ว ให้อัปเดตผลการค้นหา
        if (isSearchPage) {
          // ส่ง event เพื่อ trigger การค้นหาใหม่ใน SearchResults
          window.dispatchEvent(new CustomEvent('searchUpdated', { detail: term }));
        } else {
          // นำทางไปยังหน้าค้นหา
          navigate('/search', { state: { searchTerm: term } });
        }
      } else if (isSearchPage) {
        // ถ้าลบคำค้นหาทั้งหมดและอยู่ในหน้าค้นหา
        window.dispatchEvent(new CustomEvent('searchUpdated', { detail: '' }));
      }
    }, 500); // ดีเลย์ 500ms ก่อนค้นหา
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    if (!isVideoPage) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [isVideoPage]);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}
    >
      {(!isVideoPage || (isVideoPage && isLargeScreen)) && (
        <Header
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          isVisible={isHeaderVisible}
        />
      )}

      <main className={`flex-grow ${isVideoPage ? 'pt-0' : ''}`}>
        <Outlet context={{ searchTerm, isDarkMode, setSearchTerm }} />
      </main>

      {!isVideoPage && (
        <>
          <div className="pb-16 md:pb-12"></div>
          <Footer isDarkMode={isDarkMode} />
        </>
      )}
    </div>
  );
};

export default Dashboard;