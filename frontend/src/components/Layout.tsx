import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-white via-[#F7FAF7] to-[#E3EFE5] font-serif text-[#243326]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden bg-transparent max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
