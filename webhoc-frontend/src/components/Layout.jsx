import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header cố định ở trên */}
      <Header />
      
      {/* Nội dung chính sẽ thay đổi tùy theo trang (Outlet) */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer cố định ở dưới */}
      <Footer />
    </div>
  );
};

export default Layout;