import React from 'react';

const Footer = ({ isDarkMode }) => {
  return (
    <footer className={`fixed bottom-0 left-0 w-full border-t shadow-lg z-30 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            © {new Date().getFullYear()} VideoStream. All rights reserved.
          </p> */}
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className={`text-sm hover:text-red-500 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>นโยบายความเป็นส่วนตัว</a>
            <a href="#" className={`text-sm hover:text-red-500 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>ข้อกำหนดการใช้งาน</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;