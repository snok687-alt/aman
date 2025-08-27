// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const lastScrollY = useRef(0);
  const location = useLocation();

  const isVideoPage = location.pathname.startsWith('/watch');

  const handleSearchChange = (term) => {
    setSearchTerm(term);
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

    return () => window.removeEventListener('scroll', handleScroll);
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
        <Outlet context={{ searchTerm, isDarkMode }} />
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