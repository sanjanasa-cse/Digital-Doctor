
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { chatWithDoctor, generateSpeech, translateText } from '../services/geminiService';
import { db } from '../services/db';

interface ChatProps {
  user: UserProfile;
}

export const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // TTS State
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load chat history from DB on mount
  useEffect(() => {
    const loadChat = async () => {
      if (user.email) {
        const savedMessages = await db.getChatHistory(user.email);
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Default welcome message
          setMessages([{ role: 'model', text: `Hello ${user.name}! I am Digital Doctor. How can I help you with your health today?`, timestamp: Date.now() }]);
        }
      }
    };
    loadChat();
  }, [user]);

  // Save chat to DB whenever messages change
  useEffect(() => {
    if (user.email && messages.length > 0) {
      db.saveChatHistory(user.email, messages);
    }
  }, [messages, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleClearChat = async () => {
    if (confirm("Are you sure you want to clear your chat history?")) {
      setMessages([{ role: 'model', text: `Chat cleared. How can I help you now, ${user.name}?`, timestamp: Date.now() }]);
      await db.clearChatHistory(user.email);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithDoctor(userMsg.text, history);
    
    setMessages(prev => [...prev, {
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    }]);
    setLoading(false);
  };

  const handlePlayMessage = async (msg: ChatMessage, index: number) => {
      if (currentSourceRef.current) {
          currentSourceRef.current.stop();
          currentSourceRef.current = null;
      }

      if (playingId === index) {
          setPlayingId(null);
          return;
      }

      setAudioLoadingId(index);

      try {
          let textToSpeak = msg.text;
          if (language !== 'en') {
             const targetLangName = language === 'kn' ? 'Kannada' : 'English';
             textToSpeak = await translateText(textToSpeak, targetLangName);
          }

          const buffer = await generateSpeech(textToSpeak);
          
          if (buffer) {
             if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
             }
             if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
             }

             const source = audioContextRef.current.createBufferSource();
             source.buffer = buffer;
             source.connect(audioContextRef.current.destination);
             source.onended = () => {
                 setPlayingId(null);
                 currentSourceRef.current = null;
             };
             source.start(0);
             currentSourceRef.current = source;
             setPlayingId(index);
          }
      } catch (error) {
          console.error("TTS Error", error);
      } finally {
          setAudioLoadingId(null);
      }
  };

  return (
    <div className="pt-4 md:pt-20 pb-4 h-[calc(100vh-80px)] md:h-screen flex flex-col max-w-5xl mx-auto">
      
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/40 animate-fade-in-up">
        
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-md p-5 flex items-center justify-between border-b border-gray-100 z-10 shadow-sm">
          <div className="flex items-center gap-4">
              <div className="relative">
                 <div className="w-12 h-12 bg-gradient-to-tr from-medical-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl">
                    🤖
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Digital Doctor AI</h2>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                   <p className="text-xs text-gray-500 font-medium">Online & Ready</p>
                </div>
              </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
             <button 
               onClick={handleClearChat}
               className="text-xs font-bold text-red-400 hover:text-red-600 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
               title="Clear Conversation"
             >
               Clear
             </button>
             <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase px-2">Voice:</span>
                <select 
                   value={language}
                   onChange={(e) => setLanguage(e.target.value as 'en' | 'kn')}
                   className="bg-white text-gray-700 text-sm font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-medical-200 shadow-sm border border-gray-200 cursor-pointer"
                >
                   <option value="en">English</option>
                   <option value="kn">Kannada</option>
                </select>
             </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`relative max-w-[85%] md:max-w-[70%] p-5 rounded-3xl shadow-sm transition-all hover:shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-medical-600 to-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <p className={`text-base leading-7 ${msg.role === 'model' ? 'pb-8' : ''}`}>{msg.text}</p>
                
                {msg.role === 'user' && (
                    <div className="text-[10px] text-blue-200 mt-2 text-right opacity-80 font-medium">
                        You • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                )}

                {/* Model Message Footer */}
                {msg.role === 'model' && (
                    <div className="absolute bottom-3 left-4 right-3 flex justify-between items-center border-t border-gray-100/50 pt-2 mt-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI Assistant</span>
                        <button 
                          onClick={() => handlePlayMessage(msg, idx)}
                          disabled={audioLoadingId === idx}
                          className={`p-1.5 rounded-full transition-all flex items-center gap-2 ${
                              playingId === idx 
                                  ? 'bg-red-50 text-red-500 ring-2 ring-red-100' 
                                  : 'bg-gray-50 text-gray-400 hover:bg-medical-50 hover:text-medical-600'
                          }`}
                        >
                           {audioLoadingId === idx ? (
                               <div className="w-4 h-4 border-2 border-medical-500 border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                               <span className="text-sm">{playingId === idx ? '⏹' : '🔊'}</span>
                           )}
                           {playingId === idx && <span className="text-[10px] font-bold">Stop</span>}
                        </button>
                    </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white/80 border border-gray-100 p-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2">
                 <span className="text-xs font-bold text-gray-400 uppercase mr-2">Thinking</span>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-[1.5rem] border border-gray-200 shadow-inner focus-within:ring-2 focus-within:ring-medical-200 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your health question..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-700 placeholder-gray-400 font-medium"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-medical-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-medical-700 transition-all disabled:opacity-50 disabled:scale-95 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important medical info.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
