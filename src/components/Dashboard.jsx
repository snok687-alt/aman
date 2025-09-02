import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';

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
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if (term.trim() !== '') {
        if (isSearchPage) {
          window.dispatchEvent(new CustomEvent('searchUpdated', { detail: term }));
        } else {
          navigate('/search', { state: { searchTerm: term } });
        }
      } else if (isSearchPage) {
        window.dispatchEvent(new CustomEvent('searchUpdated', { detail: '' }));
      }
    }, 500);
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

    // if (!isVideoPage) {
    //   window.addEventListener('scroll', handleScroll, { passive: true });
    // }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [isVideoPage]);

  useEffect(() => {
  const handleHeaderToggle = (e) => {
    setIsHeaderVisible(e.detail === 'show');
  };

  window.addEventListener('toggleHeader', handleHeaderToggle);
  return () => window.removeEventListener('toggleHeader', handleHeaderToggle);
}, []);


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
    </div>
  );
};

export default Dashboard;