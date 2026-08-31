
import { UserProfile, ScanResult, ChatMessage } from '../types';

// Simulating a Database with LocalStorage
// In a real app, these functions would call your API endpoints (e.g., fetch('/api/login'))

const USERS_KEY = 'dd_users';
const getHistoryKey = (email: string) => `digital_doctor_history_${email}`;
const getChatKey = (email: string) => `digital_doctor_chat_${email}`;

export const db = {
  /**
   * Register a new user
   */
  createUser: async (user: UserProfile & {password: string}): Promise<UserProfile> => {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    // Normalize email to lowercase to ensure uniqueness (User@test.com == user@test.com)
    const normalizedEmail = user.email.toLowerCase().trim();
    
    if (users[normalizedEmail]) {
      throw new Error("This email is already registered. Please use 'Sign In'.");
    }
    
    // Save user with normalized email
    const userToSave = { ...user, email: normalizedEmail };
    users[normalizedEmail] = userToSave;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Return user without password
    const { password, ...safeUser } = userToSave;
    return safeUser;
  },

  /**
   * Authenticate a user
   */
  loginUser: async (email: string, password: string): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = users[normalizedEmail];
    
    if (!user) {
        throw new Error("Account not found. Please register.");
    }
    
    if (user.password !== password) {
        throw new Error("Incorrect password.");
    }
    
    const { password: _, ...safeUser } = user;
    return safeUser as UserProfile;
  },

  /**
   * Reset User Password (Backend Simulation)
   */
  resetPassword: async (email: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!users[normalizedEmail]) {
        throw new Error("No account found with this email.");
    }
    
    // Update password
    users[normalizedEmail].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  /**
   * Fetch user history
   */
  getHistory: async (email: string): Promise<ScanResult[]> => {
     const normalizedEmail = email.toLowerCase().trim();
     const key = getHistoryKey(normalizedEmail);
     const saved = localStorage.getItem(key);
     return saved ? JSON.parse(saved) as ScanResult[] : [];
  },

  /**
   * Save a new scan result
   */
  saveScan: async (email: string, scan: ScanResult): Promise<ScanResult[]> => {
      const normalizedEmail = email.toLowerCase().trim();
      const key = getHistoryKey(normalizedEmail);
      const saved = localStorage.getItem(key);
      const history = saved ? JSON.parse(saved) as ScanResult[] : [];
      
      const newHistory = [scan, ...history];
      localStorage.setItem(key, JSON.stringify(newHistory));
      return newHistory;
  },

  /**
   * Fetch user chat history
   */
  getChatHistory: async (email: string): Promise<ChatMessage[]> => {
    const normalizedEmail = email.toLowerCase().trim();
    const key = getChatKey(normalizedEmail);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as ChatMessage[] : [];
  },

  /**
   * Save entire chat session
   */
  saveChatHistory: async (email: string, messages: ChatMessage[]): Promise<void> => {
    const normalizedEmail = email.toLowerCase().trim();
    const key = getChatKey(normalizedEmail);
    localStorage.setItem(key, JSON.stringify(messages));
  },

  /**
   * Clear chat history
   */
  clearChatHistory: async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase().trim();
    const key = getChatKey(normalizedEmail);
    localStorage.removeItem(key);
  },

  /**
   * DEBUG: Get full database dump for visualization
   */
  getDatabaseDump: () => {
    return {
      users: JSON.parse(localStorage.getItem(USERS_KEY) || '{}'),
      localStorageKeys: Object.keys(localStorage).reduce((acc, key) => {
        if (key.startsWith('digital_doctor_')) {
          acc[key] = JSON.parse(localStorage.getItem(key) || '[]');
        }
        return acc;
      }, {} as Record<string, any>)
    };
  }
};
