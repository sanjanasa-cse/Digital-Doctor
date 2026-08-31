
import React, { useState, useEffect } from 'react';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Scanner } from './views/Scanner';
import { History } from './views/History';
import { Chat } from './views/Chat';
import { Layout } from './components/Layout';
import { UserProfile, ViewState, ScanType, ScanResult } from './types';
import { db } from './services/db';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [scanType, setScanType] = useState<ScanType>(ScanType.TABLET);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanResult | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Load user-specific history using DB Service
  useEffect(() => {
    const loadData = async () => {
      if (user?.email) {
        const data = await db.getHistory(user.email);
        setHistory(data);
      } else {
        setHistory([]);
      }
    };
    loadData();
  }, [user]);

  const handleLogin = (userData: UserProfile, isNewUserLogin: boolean) => {
    setUser(userData);
    setIsNewUser(isNewUserLogin);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    setIsNewUser(false);
    setCurrentView(ViewState.LOGIN);
    setHistory([]); // Clear history from view on logout
  };

  const handleSaveResult = async (result: ScanResult) => {
    if (!user?.email) return;
    
    // Optimistic UI update
    setHistory([result, ...history]);
    
    // Save via DB Service
    await db.saveScan(user.email, result);
  };

  const setScanTypeAndRedirect = (type: ScanType) => {
    setScanType(type);
    setSelectedHistoryItem(null); // Ensure we start fresh
  };

  const handleSelectHistoryItem = (item: ScanResult) => {
    setSelectedHistoryItem(item);
    setScanType(item.type);
    setCurrentView(ViewState.SCAN);
  };

  const handleChangeView = (view: ViewState) => {
    // Clear selected history item when manually navigating away or to scan
    if (view !== ViewState.SCAN) {
        setSelectedHistoryItem(null);
    } else {
        // If clicking 'Scan' in nav, we want a fresh scan, not the history item
        setSelectedHistoryItem(null);
    }
    setCurrentView(view);
  };

  if (!user || currentView === ViewState.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} changeView={handleChangeView} logout={handleLogout}>
      {currentView === ViewState.HOME && (
        <Home user={user} isNewUser={isNewUser} changeView={handleChangeView} setScanType={setScanTypeAndRedirect} />
      )}
      {currentView === ViewState.SCAN && (
        <Scanner 
          type={scanType} 
          initialResult={selectedHistoryItem}
          onSaveResult={handleSaveResult} 
          onCancel={() => {
             // If we were viewing history, go back to history list. Otherwise go home.
             if (selectedHistoryItem) {
                setCurrentView(ViewState.HISTORY);
                setSelectedHistoryItem(null);
             } else {
                setCurrentView(ViewState.HOME);
             }
          }} 
        />
      )}
      {currentView === ViewState.HISTORY && (
        <History history={history} onSelectResult={handleSelectHistoryItem} />
      )}
      {currentView === ViewState.CHAT && (
        <Chat user={user} />
      )}
    </Layout>
  );
}

export default App;
