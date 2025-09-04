import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cat from '../../../public/you.jpg';
import Navbar from './Navbar';
import SearchBox from './SearchBox';
import { CATEGORIES } from '../../data/constants/categories';

const Header = ({ searchTerm, onSearchChange, isDarkMode, toggleTheme, isVisible }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryClick = (path) => {
    navigate(path);
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-transform duration-300 shadow-md px-1 py-2 w-full ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="max-w-full md:px-6 md:pt-3 mx-auto flex flex-col gap-4">
        <div className="w-full flex items-center gap-4 justify-between">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')} 
          >
            <div className={`text-red-500 text-2xl mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              <img 
                src={Cat} 
                alt="Logo-Cat"
                className='rounded-full w-9 h-9 ml-1'
              />
            </div>
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'} hidden sm:block`}>
              Free for you
            </span>
          </div>
          
          <SearchBox 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            isDarkMode={isDarkMode}
          />
          
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="เปลี่ยนโหมดสี"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
        <Navbar 
          handleCategoryClick={handleCategoryClick} 
          categories={CATEGORIES} 
          isDarkMode={isDarkMode}
        />
      </div>
    </header>
  );
};

export default Header;