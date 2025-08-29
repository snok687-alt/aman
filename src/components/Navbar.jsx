import React from 'react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ handleCategoryClick, categories, isDarkMode }) => {
  const location = useLocation();

  return (
    <div className="overflow-x-auto">
      <nav className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.path)}
            className={`text-sm px-4 py-1 rounded-full border whitespace-nowrap transition-colors ${
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
  );
};

export default Navbar;