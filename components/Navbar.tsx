import React from 'react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  changeView: (view: ViewState) => void;
  logout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, changeView, logout }) => {
  const navItems = [
    { label: 'Home', view: ViewState.HOME, icon: '🏠' },
    { label: 'Scanner', view: ViewState.SCAN, icon: '📸' },
    { label: 'History', view: ViewState.HISTORY, icon: '📂' },
    { label: 'Chat Doctor', view: ViewState.CHAT, icon: '💬' },
  ];

  return (
    <>
      {/* Desktop Floating Navbar */}
      <nav className="hidden md:flex fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full px-6 py-3 items-center gap-6 animate-fade-in-up">
        <div className="flex items-center gap-2 pr-6 border-r border-gray-200/50">
          <div className="bg-gradient-to-tr from-medical-500 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg">
            <span className="text-lg">🩺</span>
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-medical-700 to-indigo-800">
            Digital Doctor
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => changeView(item.view)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                currentView === item.view
                  ? 'bg-medical-50 text-medical-600 shadow-sm ring-1 ring-medical-200'
                  : 'text-gray-500 hover:text-medical-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="pl-6 border-l border-gray-200/50">
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-sm hover:bg-red-500 hover:text-white transition-all duration-300 group"
            title="Logout"
          >
            <span>🚪</span>
            <span className="group-hover:text-white">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => changeView(item.view)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] transition-all duration-300 ${
                currentView === item.view 
                  ? 'text-medical-600 bg-medical-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-2xl transition-transform duration-300 ${currentView === item.view ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          ))}
          <button
              onClick={logout}
              className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="text-[10px] font-medium mt-1">Exit</span>
          </button>
        </div>
      </nav>
    </>
  );
};