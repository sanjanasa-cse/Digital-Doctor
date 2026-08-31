
import React, { useEffect, useState } from 'react';
import { UserProfile, ViewState, ScanType } from '../types';

interface HomeProps {
  user: UserProfile;
  isNewUser: boolean;
  changeView: (view: ViewState) => void;
  setScanType: (type: ScanType) => void;
}

export const Home: React.FC<HomeProps> = ({ user, isNewUser, changeView, setScanType }) => {
  const [timeGreeting, setTimeGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good Morning');
    else if (hour < 18) setTimeGreeting('Good Afternoon');
    else setTimeGreeting('Good Evening');
  }, []);
  
  const handleStartScan = (type: ScanType) => {
    setScanType(type);
    changeView(ViewState.SCAN);
  };

  const mainHeadline = isNewUser ? 'Welcome,' : 'Welcome Back,';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-6 md:pt-16 pb-12">
      
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.5)] p-8 md:p-14 text-white animate-fade-in-up group">
        
        {/* Animated Background Shapes */}
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px] group-hover:blur-[60px] transition-all duration-1000 animate-pulse-soft mix-blend-overlay"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[80px] animate-float mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              AI System Active
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-lg">
              {mainHeadline} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">{user.name}</span>
            </h1>
            
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-xl leading-relaxed opacity-90 border-l-4 border-cyan-400 pl-4 py-1">
               {timeGreeting}. Your comprehensive health dashboard is ready for analysis.
            </p>
          </div>
          
          <div className="flex gap-4 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
            <div className="px-6 py-3 text-center min-w-[100px] border-r border-white/10">
                <span className="block text-3xl font-black text-cyan-300">{user.age}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Age</span>
            </div>
            <div className="px-6 py-3 text-center min-w-[100px]">
                <span className="block text-3xl font-black text-cyan-300">{user.dob.split('-')[0]}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Birth Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tablet Scan Card */}
        <button
          onClick={() => handleStartScan(ScanType.TABLET)}
          className="group relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 text-left border border-white/60 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.25)] transition-all duration-500 hover:-translate-y-2 animate-fade-in-up delay-100"
        >
          {/* Holographic Hover Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-100/0 group-hover:from-blue-50/50 group-hover:to-blue-100/50 transition-all duration-500"></div>
          
          <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center text-4xl mb-8 shadow-inner border border-blue-100 group-hover:scale-110 transition-transform duration-500">
              💊
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Tablet Analysis</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">
              Identify medication instantly. Decode uses, side effects, and precautions with AI vision.
            </p>
            
            <div className="mt-10 flex items-center gap-3">
               <div className="h-10 w-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                 ➜
               </div>
               <span className="text-blue-600 font-bold uppercase tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">Initialize Scan</span>
            </div>
          </div>
        </button>

        {/* Report Scan Card */}
        <button
          onClick={() => handleStartScan(ScanType.REPORT)}
          className="group relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 text-left border border-white/60 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(20,184,166,0.25)] transition-all duration-500 hover:-translate-y-2 animate-fade-in-up delay-200"
        >
           {/* Holographic Hover Gradient */}
           <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 via-teal-50/0 to-teal-100/0 group-hover:from-teal-50/50 group-hover:to-teal-100/50 transition-all duration-500"></div>

          <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600 flex items-center justify-center text-4xl mb-8 shadow-inner border border-teal-100 group-hover:scale-110 transition-transform duration-500">
              📋
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">Report Decoder</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">
              Simplify complex lab reports. Extract values, understand risks, and get dietary advice.
            </p>
            
            <div className="mt-10 flex items-center gap-3">
               <div className="h-10 w-10 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                 ➜
               </div>
               <span className="text-teal-600 font-bold uppercase tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">Upload Document</span>
            </div>
          </div>
        </button>
      </div>

      {/* Quick Help Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-1.5 border border-white/50 shadow-lg animate-fade-in-up delay-300">
         <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-8 bg-gradient-to-r from-gray-50 to-white rounded-[1.5rem]">
            <div className="flex items-center gap-8">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                 <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-5xl shadow-inner relative z-10 animate-float-slow">
                   🤖
                 </div>
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-gray-900">Dr. AI Assistant</h3>
                  <p className="text-gray-500 mt-2 font-medium max-w-md">
                    Have questions about symptoms or remedies? Start a secure, private conversation with our medical AI.
                  </p>
               </div>
            </div>
            <button 
              onClick={() => changeView(ViewState.CHAT)}
              className="w-full md:w-auto px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_30px_rgba(0,0,0,0.4)] hover:bg-black transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-3"
            >
              Start Chat 💬
            </button>
         </div>
      </div>

      {/* Daily Health Insights - NEW SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-500 pb-8">
         <div className="group bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm hover:bg-white/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">💧</span>
            <h4 className="font-bold text-gray-900 text-lg">Daily Hydration</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">Target: 8 glasses. Adequate water intake improves brain function and energy levels.</p>
         </div>
         <div className="group bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm hover:bg-white/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">👣</span>
            <h4 className="font-bold text-gray-900 text-lg">Activity Goal</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">Aim for 30 mins of walking. Consistent movement supports cardiovascular health.</p>
         </div>
         <div className="group bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm hover:bg-white/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">😴</span>
            <h4 className="font-bold text-gray-900 text-lg">Sleep Quality</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">Try to get 7-8 hours. Quality sleep is essential for immune system recovery.</p>
         </div>
      </div>

    </div>
  );
};
