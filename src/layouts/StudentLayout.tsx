import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';

export const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-dark-text">
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};
