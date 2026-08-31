import React from 'react';
import { ScanResult, ScanType } from '../types';

interface HistoryProps {
  history: ScanResult[];
  onSelectResult: (result: ScanResult) => void;
}

export const History: React.FC<HistoryProps> = ({ history, onSelectResult }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in-up">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-6xl mb-6 shadow-inner">
          📂
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Medical Records</h3>
        <p className="text-gray-500 max-w-xs">
          Your scan history will appear here safely. Start a new scan to begin.
        </p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500 shadow-red-200';
      case 'moderate': return 'bg-amber-400 shadow-amber-200';
      case 'safe': return 'bg-emerald-500 shadow-emerald-200';
      default: return 'bg-blue-400 shadow-blue-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-6 md:pt-20 pb-12">
      <div className="flex items-end justify-between mb-8 animate-fade-in-up">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Medical History</h2>
           <p className="text-gray-500 mt-1">Archive of your past analyses</p>
        </div>
        <span className="bg-white/50 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 border border-gray-200/50">
          {history.length} Records
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {history.map((item, index) => (
          <button 
            key={item.id} 
            onClick={() => onSelectResult(item)}
            style={{ animationDelay: `${index * 100}ms` }}
            className="group relative w-full text-left bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 animate-fade-in-up transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-5">
              
              {/* Thumbnail */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-1 right-1">
                   {item.type === ScanType.TABLET ? '💊' : '📋'}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-800 truncate group-hover:text-medical-600 transition-colors">
                    {item.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    item.isDanger 
                        ? 'bg-red-50 text-red-600 border-red-100' 
                        : item.riskLevel === 'Moderate' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {item.riskLevel}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
                  <span>{item.date}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{item.type}</span>
                </div>
                
                {/* Micro Analysis Preview */}
                <div className="flex gap-2 items-center overflow-hidden">
                   {item.analysis && item.analysis.slice(0, 3).map((pt, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 max-w-[150px]">
                         <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${getSeverityColor(pt.severity)}`}></span>
                         <span className="text-xs text-gray-600 truncate">{pt.point}</span>
                      </div>
                   ))}
                   {item.analysis && item.analysis.length > 3 && (
                     <span className="text-xs text-gray-400 pl-1">+{item.analysis.length - 3} more</span>
                   )}
                </div>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-300 group-hover:text-medical-600 transition-colors pr-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
              </div>

            </div>
          </button>
        ))}
      </div>
    </div>
  );
};