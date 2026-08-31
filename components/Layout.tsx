
import React from 'react';
import { Navbar } from './Navbar';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  changeView: (view: ViewState) => void;
  logout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, changeView, logout }) => {
  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-24 bg-[#F8FAFC] relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Top Right Orb */}
         <div className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] animate-float-slow"></div>
         
         {/* Bottom Left Orb */}
         <div className="absolute -bottom-[10%] -left-[10%] w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] animate-float-delayed"></div>
         
         {/* Center Accent */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[100px] animate-pulse-soft"></div>
         
         {/* Noise Texture for Realism */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar currentView={currentView} changeView={changeView} logout={logout} />
        <main className="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 transition-all duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};
