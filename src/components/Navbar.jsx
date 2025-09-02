import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ handleCategoryClick, categories, isDarkMode }) => {
  const location = useLocation();
  const scrollRef = useRef(null);

  const [showLeftIcon, setShowLeftIcon] = useState(false);
  const [showRightIcon, setShowRightIcon] = useState(false);

  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setShowLeftIcon(scrollLeft > 10); // มีอะไรอยู่ทางซ้าย
    setShowRightIcon(scrollLeft + clientWidth < scrollWidth - 10); // มีอะไรอยู่ทางขวา
  };

  useEffect(() => {
    checkScrollPosition(); // เช็คตอนโหลด
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }

    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      }
    };
  }, []);

  return (
    <>
    <div className="relative w-full">
      {/* ปุ่มเลื่อนซ้าย */}
      {showLeftIcon && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-white/80 dark:from-gray-800/80 px-1">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}

      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
        <nav className="flex flex-nowrap gap-2 justify-start sm:justify-center px-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.path)}
              className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap transition-colors ${
                location.pathname === category.path
                  ? 'bg-red-500 text-white border-red-500'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      {/* ปุ่มเลื่อนขวา */}
      {showRightIcon && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-white/80 dark:from-gray-800/80 px-1">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
    </>
  );
};

export default Navbar;