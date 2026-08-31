
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: UserProfile, isNewUser: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTechStack, setShowTechStack] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'stack' | 'db'>('stack');
  
  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Strict validation for Date of Birth
    if (name === 'dob') {
        const year = value.split('-')[0];
        if (year && year.length > 4) return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email Validation
    if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address (e.g. name@example.com)");
        return;
    }

    setLoading(true);

    try {
        if (!isLoginMode) {
            // --- CREATE ACCOUNT MODE ---
            if (!formData.name || !formData.age || !formData.dob || !formData.password) {
                throw new Error("All fields are required.");
            }

            const newUser = await db.createUser({
                name: formData.name,
                age: formData.age,
                dob: formData.dob,
                email: formData.email,
                password: formData.password
            });

            onLogin(newUser, true);
        } else {
            // --- SIGN IN MODE ---
            const user = await db.loginUser(formData.email, formData.password);
            onLogin(user, false);
        }
    } catch (err: any) {
        setError(err.message || "An error occurred.");
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMsg(null);
      setLoading(true);

      try {
          if (!validateEmail(resetEmail)) throw new Error("Invalid email format.");
          if (newResetPassword.length < 4) throw new Error("Password must be at least 4 chars.");

          await db.resetPassword(resetEmail, newResetPassword);
          setSuccessMsg("Password reset successfully! Please sign in.");
          setTimeout(() => {
              setShowForgotPassword(false);
              setSuccessMsg(null);
              setResetEmail('');
              setNewResetPassword('');
          }, 2000);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const today = new Date().toISOString().split('T')[0];
  const dbDump = db.getDatabaseDump();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19] relative overflow-hidden font-sans selection:bg-medical-500 selection:text-white">
      
      {/* Cinematic Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-60"></div>
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      {/* Floating Ambient Lights */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-soft"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse-soft delay-1000"></div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-[1100px] m-4 flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden glass-premium shadow-2xl min-h-[700px] animate-scale-up">
        
        {/* Left Side: Cinematic Brand Panel */}
        <div className="md:w-5/12 relative overflow-hidden text-white p-10 flex flex-col justify-between group">
            {/* Animated Aurora Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 bg-[length:200%_200%] animate-aurora"></div>
            <div className="absolute inset-0 bg-noise opacity-10"></div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="relative z-10 animate-fade-in-up">
               <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8 shadow-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold tracking-widest uppercase">System Online</span>
               </div>
               
               <h1 className="text-6xl font-black leading-tight mb-4 tracking-tight drop-shadow-xl">
                 Digital<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">Doctor.</span>
               </h1>
               <p className="text-lg text-indigo-100 font-medium leading-relaxed max-w-sm border-l-2 border-cyan-400 pl-4 opacity-90">
                 The future of personal diagnostics. Accurate, instant, and secure AI analysis at your fingertips.
               </p>
            </div>

            {/* 3D Floating Elements */}
            <div className="relative z-10 h-60 flex items-center justify-center perspective-[1000px]">
               <div className="absolute left-4 top-10 text-8xl animate-float drop-shadow-2xl opacity-90">🧬</div>
               <div className="absolute right-0 bottom-10 text-7xl animate-float-delayed drop-shadow-2xl opacity-90">💊</div>
               <div className="absolute text-9xl animate-float-slow opacity-10 blur-sm scale-150">🩺</div>
            </div>

            {/* Tech Stack Trigger */}
            <div className="relative z-10 mt-auto pt-6 animate-fade-in-up delay-200">
               <button 
                  onClick={() => setShowTechStack(true)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200 hover:text-white transition-colors opacity-70 hover:opacity-100"
               >
                  <span>ℹ️</span> View Tech Stack & DB
               </button>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:w-7/12 bg-white/95 backdrop-blur-xl relative flex flex-col justify-center p-8 md:p-12">
            
            {/* Sliding Toggle Switch */}
            <div className="w-full max-w-xs mx-auto bg-gray-100/80 p-1.5 rounded-full flex relative shadow-inner mb-10 border border-gray-200">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-md transition-transform duration-300 ease-spring ${isLoginMode ? 'translate-x-0' : 'translate-x-full'}`}></div>
                <button 
                  onClick={() => { setIsLoginMode(true); setError(null); }}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-full text-sm font-bold relative z-10 transition-colors duration-300 ${isLoginMode ? 'text-indigo-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsLoginMode(false); setError(null); }}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-full text-sm font-bold relative z-10 transition-colors duration-300 ${!isLoginMode ? 'text-indigo-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Register
                </button>
            </div>

            <div className="text-center mb-8 animate-fade-in-up">
               <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                 {isLoginMode ? 'Welcome Back' : 'Create Account'}
               </h2>
               <p className="text-gray-500 font-medium">
                 {isLoginMode ? 'Enter your credentials to access records.' : 'Fill in your details to start your journey.'}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-sm mx-auto animate-fade-in-up delay-100">
               {!isLoginMode && (
                  <>
                    <div className="group relative">
                       <input
                         name="name"
                         type="text"
                         required
                         value={formData.name}
                         className="peer w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all duration-300 font-semibold text-gray-800 placeholder-transparent"
                         onChange={handleChange}
                         placeholder="Name"
                       />
                       <label className="absolute left-5 top-4 text-gray-400 text-xs font-bold uppercase transition-all duration-300 transform -translate-y-7 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:text-indigo-500 pointer-events-none">Full Name</label>
                    </div>
                    
                    <div className="flex gap-4">
                       <div className="group relative w-1/3">
                           <input
                             name="age"
                             type="number"
                             required
                             value={formData.age}
                             max="120"
                             className="peer w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all duration-300 font-semibold text-gray-800 placeholder-transparent"
                             onChange={handleChange}
                             placeholder="Age"
                           />
                           <label className="absolute left-5 top-4 text-gray-400 text-xs font-bold uppercase transition-all duration-300 transform -translate-y-7 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:text-indigo-500 pointer-events-none">Age</label>
                       </div>
                       <div className="group relative w-2/3">
                           <input
                            name="dob"
                            type="date"
                            required
                            value={formData.dob}
                            max={today}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all duration-300 font-semibold text-gray-800"
                            onChange={handleChange}
                            onClick={(e) => {
                                try {
                                    if (typeof e.currentTarget.showPicker === 'function') {
                                        e.currentTarget.showPicker();
                                    }
                                } catch (error) {}
                            }}
                           />
                           <label className="absolute left-5 -top-3 text-indigo-500 text-xs font-bold uppercase bg-white px-1">Date of Birth</label>
                       </div>
                    </div>
                  </>
               )}

               <div className="group relative">
                   <input
                     name="email"
                     type="email"
                     required
                     value={formData.email}
                     className="peer w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all duration-300 font-semibold text-gray-800 placeholder-transparent"
                     onChange={handleChange}
                     placeholder="Email"
                   />
                   <label className="absolute left-5 top-4 text-gray-400 text-xs font-bold uppercase transition-all duration-300 transform -translate-y-7 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:text-indigo-500 pointer-events-none">Email Address</label>
               </div>

               <div className="group relative">
                   <input
                     name="password"
                     type={showPassword ? "text" : "password"}
                     required
                     value={formData.password}
                     className="peer w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all duration-300 font-semibold text-gray-800 placeholder-transparent pr-12"
                     onChange={handleChange}
                     placeholder="Password"
                   />
                   <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
                   >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                   </button>
                   <label className="absolute left-5 top-4 text-gray-400 text-xs font-bold uppercase transition-all duration-300 transform -translate-y-7 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:text-indigo-500 pointer-events-none">Password</label>
               </div>

               {isLoginMode && (
                   <div className="flex justify-end">
                       <button
                         type="button"
                         onClick={() => setShowForgotPassword(true)}
                         className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                       >
                         Forgot Password?
                       </button>
                   </div>
               )}

               {error && (
                   <div className="bg-red-50 text-red-500 text-sm font-bold p-4 rounded-xl text-center border border-red-100 animate-pulse shadow-sm">
                       ⚠️ {error}
                   </div>
               )}

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-gray-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-wait"
               >
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                 {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                 ) : (
                    <>
                      {isLoginMode ? 'Sign In' : 'Create Account'}
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </>
                 )}
               </button>
            </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-gray-100">
                <button 
                  onClick={() => { setShowForgotPassword(false); setError(null); setSuccessMsg(null); }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                >
                    ✕
                </button>
                <div className="text-center mb-6">
                    <span className="text-4xl mb-2 block">🔐</span>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Reset Password</h3>
                    <p className="text-gray-500 text-sm">Enter your email to verify identity and set a new password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <input
                         type="email"
                         required
                         value={resetEmail}
                         onChange={(e) => setResetEmail(e.target.value)}
                         placeholder="Registered Email"
                         className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
                    />
                    <input
                         type="password"
                         required
                         value={newResetPassword}
                         onChange={(e) => setNewResetPassword(e.target.value)}
                         placeholder="New Password"
                         className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
                    />
                    
                    {error && (
                        <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg text-center border border-red-100">
                           {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-50 text-green-600 text-xs font-bold p-3 rounded-lg text-center border border-green-100">
                           {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Updating...' : 'Reset Password'}
                    </button>
                </form>
            </div>
         </div>
      )}

      {/* Expanded Tech Stack Modal with DB Console */}
      {showTechStack && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button 
                  onClick={() => setShowTechStack(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center z-10"
                >
                    ✕
                </button>
                
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-gray-900 mb-2">System Internals</h3>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full"></div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 justify-center mb-6">
                   <button 
                      onClick={() => setActiveTab('stack')}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'stack' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                   >
                      Tech Stack
                   </button>
                   <button 
                      onClick={() => setActiveTab('db')}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'db' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                   >
                      Database Console
                   </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                    {activeTab === 'stack' ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                            {/* Frontend */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
                                    <span className="text-3xl">🎨</span>
                                    <h4 className="font-bold text-gray-900 text-lg">Frontend (UI/UX)</h4>
                                </div>
                                <ul className="space-y-3">
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">React.js (v19)</span>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">Core Framework</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Tailwind CSS</span>
                                        <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md font-bold text-xs">Styling System</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">TypeScript</span>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">Type Safety</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Backend Services */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
                                    <span className="text-3xl">🧠</span>
                                    <h4 className="font-bold text-gray-900 text-lg">Backend (Logic)</h4>
                                </div>
                                <ul className="space-y-3">
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Google Gemini</span>
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold text-xs">AI API</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Local Storage DB</span>
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold text-xs">Simulated DB</span>
                                    </li>
                                     <li className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Web APIs</span>
                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold text-xs">Camera/Audio</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 text-center">
                                <strong>Serverless Architecture:</strong> This app runs entirely in your browser using cloud APIs for AI and local storage for data persistence.
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-inner h-full font-mono text-sm text-green-400 overflow-auto">
                           <div className="mb-4 flex items-center justify-between border-b border-gray-700 pb-2">
                              <span className="font-bold text-white">db_console &gt dump_all()</span>
                              <span className="text-xs text-gray-500">Live View</span>
                           </div>
                           <pre className="whitespace-pre-wrap">
                              {JSON.stringify(dbDump, null, 2)}
                           </pre>
                           <div className="mt-4 pt-4 border-t border-gray-700">
                              <p className="text-gray-500 text-xs">
                                 // This JSON represents the actual data stored in your browser's simulated database.
                                 // It contains Users, Scan History, and Chat Logs.
                              </p>
                           </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <button 
                      onClick={() => setShowTechStack(false)}
                      className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all hover:scale-105 shadow-lg"
                    >
                        Close Console
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
