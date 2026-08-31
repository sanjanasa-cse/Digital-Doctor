
import React, { useState, useRef, useEffect } from 'react';
import { ScanType, ScanResult, AnalysisPoint } from '../types';
import { analyzeMedicalImage, generateSpeech, translateText } from '../services/geminiService';

interface ScannerProps {
  type: ScanType;
  initialResult?: ScanResult | null;
  onSaveResult: (result: ScanResult) => void;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ type, initialResult, onSaveResult, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialResult?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Omit<ScanResult, 'id' | 'date' | 'imageUrl' | 'type'> | null>(initialResult || null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [scanError, setScanError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize Audio for history items or language change
  useEffect(() => {
    if (result) {
       prepareAudio(result, language);
       
       // TRIGGER VIBRATION IF DANGER
       if (result.isDanger && typeof navigator.vibrate === 'function') {
           // Short Pulse for danger alert
           setTimeout(() => {
                navigator.vibrate(300);
           }, 300); // small delay to ensure UI is ready
           playDangerAlert();
       }
    }
  }, [result, language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAudio(); // Ensure audio stops when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playDangerAlert = () => {
     // 1. Vibration
     if (typeof navigator.vibrate === 'function') {
         navigator.vibrate(300);
     }
     
     // 2. Audio Beep (Siren fallback)
     try {
         const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
         const ctx = new AudioContextClass();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         
         osc.type = 'sawtooth';
         osc.frequency.setValueAtTime(440, ctx.currentTime);
         osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
         osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
         
         gain.gain.setValueAtTime(0.2, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
         
         osc.connect(gain);
         gain.connect(ctx.destination);
         
         osc.start();
         osc.stop(ctx.currentTime + 0.4);
     } catch (e) {
         // Ignore audio errors
     }
  };

  const prepareAudio = async (scanResult: Omit<ScanResult, 'id' | 'date' | 'imageUrl' | 'type'>, lang: 'en' | 'kn') => {
      stopAudio(); // Stop any current playback
      setIsAudioLoading(true);
      setAudioBuffer(null);
      
      let textToSpeak = "";

      if (type === ScanType.TABLET) {
          // TABLET MODE: Title, Usage, Avoid, Motivation
          let avoidText = "";
          if (scanResult.avoidAdvice) {
              avoidText = `Important Precautions: ${scanResult.avoidAdvice}.`;
          }
          textToSpeak = `The medicine is ${scanResult.title}. Here are the uses: ${scanResult.primaryUses}. ${avoidText} ${scanResult.motivationalMessage}`;
      } else {
          // REPORT MODE: Analysis + Findings + Food
          const analysisText = scanResult.analysis.map((a, i) => `Finding ${i+1}: ${a.point}`).join('. ');
          
          let dangerText = "";
          if (scanResult.isDanger && scanResult.dangerReason) {
              dangerText = `WARNING: High Risk Detected. ${scanResult.dangerReason}. Please consult a doctor immediately.`;
          } else {
              dangerText = `Risk Level is ${scanResult.riskLevel}.`;
          }

          let dietText = "";
          if (scanResult.dietaryAdvice) {
              dietText = `Dietary Recommendations: ${scanResult.dietaryAdvice}`;
          }

          textToSpeak = `Report Analysis for ${scanResult.title}. ${dangerText}. What is included in this report: ${scanResult.primaryUses}. Key Findings and Abnormalities: ${analysisText}. ${dietText}. ${scanResult.motivationalMessage}`;
      }
      
      try {
        // If translation is needed
        if (lang !== 'en') {
            const targetLangName = lang === 'kn' ? 'Kannada' : 'English';
            textToSpeak = await translateText(textToSpeak, targetLangName);
        }

        const buffer = await generateSpeech(textToSpeak);
        if (buffer) {
            setAudioBuffer(buffer);
        }
      } catch (e) {
        console.error("Audio generation failed", e);
      } finally {
        setIsAudioLoading(false);
      }
  };

  // Camera Initialization Effect
  useEffect(() => {
    if (!isCameraOpen) {
      stopCamera();
      return;
    }

    let mounted = true;

    const startCameraStream = async () => {
        setCameraError(null);
        
        // Basic check
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (mounted) setCameraError("Camera not supported on this device.");
            return;
        }

        try {
            // Attempt 1: Environment facing camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, 
                    audio: false 
                });
                if (mounted) handleStreamSuccess(stream);
            } catch (err) {
                console.warn("Environment camera failed, trying fallback...", err);
                // Attempt 2: Any camera
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
                if (mounted) handleStreamSuccess(stream);
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            if (mounted) {
                setCameraError("Camera access denied or unavailable. Please check permissions.");
            }
        }
    };

    const handleStreamSuccess = async (stream: MediaStream) => {
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
            
            try {
                await videoRef.current.play();
            } catch (e) {
                console.error("Autoplay blocked:", e);
            }
        }
    };

    startCameraStream();

    return () => {
        mounted = false;
    };
  }, [isCameraOpen]);

  const startCamera = () => {
    setIsCameraOpen(true);
    setPreview(null);
    setResult(null);
    setCameraError(null);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setPreview(dataUrl);
            handleCloseCamera();
          }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!preview) return;

    setLoading(true);
    setScanError(null);
    setResult(null);
    setAudioBuffer(null);
    stopAudio();

    try {
      const base64Data = preview.split(',')[1];
      const analysisResult = await analyzeMedicalImage(base64Data, type);
      
      setResult(analysisResult);
      
      const fullResult: ScanResult = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        type,
        imageUrl: preview,
        ...analysisResult
      };
      onSaveResult(fullResult);
      
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      
      if (msg.includes('API_KEY_MISSING')) {
          setScanError("System configuration issue: API Key is missing. Please check your settings.");
      } else if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          setScanError("System traffic is high (Quota Limit). Please wait 30 seconds and try again.");
      } else if (msg.includes('JSON')) {
          setScanError("AI Response Formatting Error. Please try again.");
      } else if (msg.includes('503') || msg.includes('overloaded')) {
          setScanError("Medical database is momentarily unavailable. Please retry.");
      } else {
          setScanError("Failed to analyze image. Please ensure image is clear and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.stop();
        } catch(e) {
            // ignore
        }
        audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleAudio = async () => {
    if (isPlaying) {
        stopAudio();
        return;
    }

    if (!audioBuffer) return;

    try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start(0);
        audioSourceRef.current = source;
        setIsPlaying(true);
    } catch (e) {
        console.error("Playback failed", e);
        alert("Audio playback failed. Please check your audio settings.");
    }
  };

  const getSeverityStyles = (severity: string) => {
      switch (severity) {
          case 'high': 
              return 'bg-red-100 border-red-400 text-red-900 ring-1 ring-red-400';
          case 'moderate': 
              return 'bg-yellow-100 border-yellow-400 text-yellow-900 ring-1 ring-yellow-400';
          case 'safe': 
              return 'bg-green-100 border-green-400 text-green-900 ring-1 ring-green-400';
          default: 
              return 'bg-blue-50 border-blue-200 text-blue-900';
      }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
        case 'high': return 'bg-red-500 text-white';
        case 'moderate': return 'bg-yellow-500 text-white';
        case 'safe': return 'bg-green-500 text-white';
        default: return 'bg-blue-500 text-white';
    }
  };

  const parseNumberedList = (text: string) => {
      if (!text) return [];
      
      // Remove asterisks used for bolding if any
      const cleanText = text.replace(/\*\*/g, '');

      // Strategy 1: Split by newlines and clean
      let items = cleanText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && /^\d+[\.\)]/.test(line));

      // Strategy 2: If no newline separation found, try splitting by numbering pattern
      if (items.length === 0) {
          const regex = /(\d+[\.\)]\s+[\s\S]*?)(?=(?:\d+[\.\)]\s)|$)/g;
          const matches = cleanText.match(regex);
          if (matches && matches.length > 0) {
              items = Array.from(matches).map(m => m.trim());
          }
      }

      return items;
  };

  const renderNumberedList = (text: string) => {
      const items = parseNumberedList(text);
      const isList = items.length > 0;

      if (isList) {
          return (
              <div className="space-y-4">
                  {items.map((part, idx) => {
                      // Remove the number prefix (e.g. "1. ")
                      const cleanPart = part.replace(/^\d+[\.\)]\s*/, '').trim();
                      
                      // Try to detect a Title/Bold section
                      const titleMatch = cleanPart.match(/^([^:]+)([:\-])\s*(.*)/s);
                      
                      let name = "";
                      let explanation = cleanPart;

                      if (titleMatch) {
                          name = titleMatch[1]; 
                          explanation = titleMatch[3];
                      }

                      return (
                        <div key={idx} className="bg-white/10 p-4 rounded-xl border border-white/20 flex gap-4 items-start hover:bg-white/20 transition-colors animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="bg-white text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg text-lg">
                                {idx + 1}
                            </div>
                            <div className="text-white text-lg leading-relaxed pt-0.5 w-full">
                                {name && <div className="font-bold text-cyan-200 mb-1">{name}</div>}
                                <div className="whitespace-pre-line opacity-90">{explanation}</div>
                            </div>
                        </div>
                      );
                  })}
              </div>
          );
      }
      
      return (
        <div className="text-lg leading-relaxed whitespace-pre-line text-white">
            {text}
        </div>
      );
  };

  const renderAvoidAdvice = (text: string) => {
    let items = parseNumberedList(text);

    // Fallback: If parsing found nothing but there is text, treat it as a single bullet point to ensure it shows.
    if (items.length === 0 && text.trim().length > 0) {
        items = [`1. ${text.trim()}`];
    }

    if (items.length > 0) {
        return (
            <div className="space-y-3">
                {items.map((part, idx) => {
                     const cleanText = part.replace(/^\d+[\.\)]\s*/, '').replace(/\*\*/g, '').trim();
                     return (
                        <div key={idx} className="flex gap-3 items-start bg-white/60 p-3 rounded-xl border border-red-100 shadow-sm animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                             <div className="bg-red-100 text-red-600 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
                                {idx + 1}
                             </div>
                             <div className="text-red-900 font-medium leading-relaxed">
                                {cleanText}
                             </div>
                        </div>
                     );
                })}
            </div>
        );
    }
    
    return null;
  };

  const renderConsumptionAdvice = (text: string) => {
    let items = parseNumberedList(text);

    if (items.length === 0 && text && text.trim().length > 0) {
        items = [`1. ${text.trim()}`];
    }

    if (items.length > 0) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100 mt-6">
                <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                    <span>👨‍👩‍👧‍👦</span> USAGE & DOSAGE GUIDE
                </h3>
                <div className="space-y-3">
                    {items.map((part, idx) => {
                        const cleanText = part.replace(/^\d+[\.\)]\s*/, '').replace(/\*\*/g, '').trim();
                        // Try to find bold category (e.g. "Children:")
                        const match = cleanText.match(/^([^:]+):(.*)/);
                        const category = match ? match[1] : null;
                        const content = match ? match[2] : cleanText;

                        return (
                            <div key={idx} className="flex gap-3 items-start bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 shadow-sm animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="bg-indigo-100 text-indigo-600 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
                                    {idx + 1}
                                </div>
                                <div className="text-indigo-900 font-medium leading-relaxed">
                                    {category && <strong className="text-indigo-700 block mb-0.5">{category}:</strong>}
                                    {content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
  };

  const getValueOrPlaceholder = (val: string | undefined) => {
    if (val && val.trim().length > 0 && val.toLowerCase() !== "unknown") {
        return val;
    }
    return <span className="text-gray-400">-</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          {type === ScanType.TABLET ? '💊' : '📋'} 
          {type === ScanType.TABLET ? 'Tablet Analysis' : 'Report Analysis'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 font-medium">
          Close
        </button>
      </div>

      {/* Input Section */}
      {!result && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            
            {/* Camera View */}
            {isCameraOpen ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6 group shadow-inner border-2 border-medical-500">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover transform scale-100" 
                    />
                    
                    {/* Scanning Laser Animation */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="w-full h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] absolute top-0 animate-[float_3s_ease-in-out_infinite]"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent animate-pulse"></div>
                    </div>

                    <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full font-mono backdrop-blur-md border border-white/20">
                        SCANNING MODULE ACTIVE
                    </div>

                    {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-6 text-center z-50">
                            <div>
                                <p className="text-red-400 font-bold text-2xl mb-3">Camera Access Issue</p>
                                <p className="mb-6 text-gray-300">{cameraError}</p>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => { setIsCameraOpen(false); setTimeout(startCamera, 300); }} 
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                                    >
                                        Retry
                                    </button>
                                    <button 
                                        onClick={handleCloseCamera} 
                                        className="px-6 py-2 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                    {!cameraError && (
                        <button 
                            onClick={captureImage}
                            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-gray-200 shadow-2xl active:scale-90 transition-all z-20 hover:bg-gray-100 flex items-center justify-center"
                            title="Take Photo"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-50"></div>
                        </button>
                    )}
                </div>
            ) : preview ? (
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video mb-6 border-2 border-dashed border-gray-300">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                        onClick={() => { setPreview(null); setFile(null); setScanError(null); }}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-red-50 text-red-500 transition z-20"
                    >
                        ✕
                    </button>
                    
                    {/* Analysis Loading Overlay with Laser */}
                    {loading && (
                        <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-sm flex items-center justify-center">
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[float_1.5s_linear_infinite]"></div>
                            </div>
                            <div className="bg-white/90 px-8 py-4 rounded-2xl shadow-2xl animate-pulse">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <span className="font-bold text-blue-900">AI Analyzing...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {scanError && (
                        <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm flex items-center justify-center p-6">
                            <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-2xl animate-scale-up border-2 border-red-100">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h3>
                                <p className="text-gray-600 mb-6">{scanError}</p>
                                <button 
                                    onClick={handleScan}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 mb-6 hover:bg-gray-100 transition-colors">
                    <div className="text-6xl mb-4 grayscale opacity-50 animate-pulse">📷</div>
                    <p className="text-gray-500 text-lg">Select an image to analyze</p>
                 </div>
            )}

            {/* Controls */}
            {!loading && !isCameraOpen && !preview && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/30 group"
                    >
                        <span className="group-hover:scale-110 transition-transform">📸</span> Use Camera
                    </button>
                    <button 
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                    >
                        <span>📁</span> Upload from Gallery
                    </button>
                    <input 
                        ref={galleryInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                 </div>
            )}

            {/* Analyze Button */}
            {preview && !loading && !scanError && (
                <button
                    onClick={handleScan}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-medical-600 to-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    <span>✨</span> Run AI Diagnosis
                </button>
            )}
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Risk Banner - ONLY FOR REPORTS */}
            {type === ScanType.REPORT && (
                <div className={`p-6 rounded-3xl shadow-lg border-2 flex flex-col gap-4 animate-scale-up ${
                    result.isDanger 
                        ? 'bg-red-500 border-red-400 text-white' 
                        : result.riskLevel === 'Moderate'
                            ? 'bg-amber-400 border-amber-300 text-white'
                            : 'bg-emerald-500 border-emerald-400 text-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{result.isDanger ? '⚠️' : result.riskLevel === 'Moderate' ? '⚖️' : '✅'}</span>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight uppercase">
                                    {result.riskLevel} Risk Detected
                                </h3>
                                <p className="font-medium opacity-90 text-lg">{result.dangerReason || "All values appear within normal range."}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* CONSULT DOCTOR ALERT inside Banner */}
                    {result.isDanger && (
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 mt-2 animate-pulse">
                             <div className="flex items-center gap-4 justify-center py-2">
                                 <span className="text-3xl">👨‍⚕️</span>
                                 <div className="text-center">
                                     <h4 className="font-black text-xl uppercase tracking-widest">Consult Doctor Immediately</h4>
                                     <p className="text-sm font-medium opacity-90">High medical risk detected. Professional attention required.</p>
                                 </div>
                                 <span className="text-3xl">🏥</span>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Title & Audio Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                        {type === ScanType.TABLET ? '💊' : '🔬'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">{result.title}</h1>
                        <p className="text-gray-500 font-medium">{type} Analysis • {result.date}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-full border border-gray-200">
                    <div className="flex bg-white rounded-full p-1 border border-gray-200 shadow-sm relative">
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-900 rounded-full transition-transform duration-300 ${language === 'en' ? 'translate-x-1' : 'translate-x-full'}`}></div>
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('kn')}
                            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'kn' ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Kannada
                        </button>
                    </div>
                    <button
                        onClick={toggleAudio}
                        disabled={isAudioLoading}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'
                        }`}
                        title={isPlaying ? "Stop Reading" : "Read Results"}
                    >
                        {isAudioLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="text-lg">{isPlaying ? '⏹' : '🔊'}</span>
                        )}
                    </button>
                 </div>
            </div>

            {/* REPORT SPECIFIC: Metadata Table */}
            {type === ScanType.REPORT && (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Report Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
                        <div className="p-4 text-center">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Doctor</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base truncate block">{getValueOrPlaceholder(result.doctorName)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Patient</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base truncate block">{getValueOrPlaceholder(result.patientName)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Age/Gender</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base truncate block">{getValueOrPlaceholder(result.patientAgeInReport)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base truncate block">{getValueOrPlaceholder(result.reportDate)}</span>
                        </div>
                        <div className="p-4 text-center col-span-2 md:col-span-1">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Hospital</span>
                            <span className="font-bold text-gray-800 text-sm md:text-base truncate block">{getValueOrPlaceholder(result.hospitalName)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Primary Function / What is included (TABLET & REPORT) */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
                 <h3 className="text-xl font-bold mb-4 opacity-90 border-b border-white/20 pb-2">
                     {type === ScanType.TABLET ? 'WHY IS THIS USED?' : 'WHAT IS INCLUDED IN THIS REPORT?'}
                 </h3>
                 {renderNumberedList(result.primaryUses)}
            </div>

            {/* Consumption Guide (Tablet Only) */}
            {type === ScanType.TABLET && result.consumptionAdvice && renderConsumptionAdvice(result.consumptionAdvice)}

            {/* Tablet Specific: Avoid Section */}
            {type === ScanType.TABLET && (result.avoidAdvice || true) && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-red-100">
                     <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                        <span>⛔</span> WHAT TO AVOID
                     </h3>
                     {renderAvoidAdvice(result.avoidAdvice || "No specific contraindications found, but please consult your doctor before use.")}
                </div>
            )}

            {/* Report Specific: Lab Values Table */}
            {type === ScanType.REPORT && result.reportValues && result.reportValues.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                         <h3 className="font-bold text-blue-800 flex items-center gap-2">
                            <span>🧪</span> Lab Results
                         </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <th className="px-6 py-3">Test Name</th>
                                    <th className="px-6 py-3">Value</th>
                                    <th className="px-6 py-3">Unit</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-100">
                                {result.reportValues.map((row, idx) => (
                                    <tr key={idx} className={`hover:bg-gray-50 ${row.status === 'Critical' ? 'bg-red-50/50' : row.status === 'Abnormal' ? 'bg-yellow-50/50' : ''}`}>
                                        <td className="px-6 py-4">{row.testName}</td>
                                        <td className="px-6 py-4 font-bold">{row.value}</td>
                                        <td className="px-6 py-4 text-gray-500">{row.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                row.status === 'Critical' ? 'bg-red-100 text-red-700' :
                                                row.status === 'Abnormal' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Report Specific: Detailed Analysis Findings */}
            {type === ScanType.REPORT && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <span>🔍</span> Key Findings & Abnormalities
                    </h3>
                    <div className="space-y-3">
                        {result.analysis.map((item, index) => (
                            <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${getSeverityStyles(item.severity)}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${getSeverityIconColor(item.severity)}`}>
                                    {index + 1}
                                </div>
                                <p className="font-semibold">{item.point}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Report Specific: Dietary Advice (Paragraph Style) */}
            {type === ScanType.REPORT && result.dietaryAdvice && (
                 <div className="bg-emerald-50 rounded-3xl p-6 shadow-lg border border-emerald-100">
                     <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <span>🥗</span> Food & Diet Recommendations
                     </h3>
                     <div className="bg-white/60 p-5 rounded-2xl text-emerald-900 font-medium leading-relaxed whitespace-pre-line border border-emerald-100/50">
                        {result.dietaryAdvice}
                     </div>
                 </div>
            )}

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                <p className="text-2xl font-bold italic font-serif leading-relaxed opacity-90 relative z-10">
                    "{result.motivationalMessage}"
                </p>
                <div className="mt-4 flex justify-center">
                    <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full opacity-50"></div>
                </div>
            </div>
            
        </div>
      )}
    </div>
  );
};
