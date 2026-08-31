export enum ViewState {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  SCAN = 'SCAN',
  HISTORY = 'HISTORY',
  CHAT = 'CHAT'
}

export interface UserProfile {
  name: string;
  age: string;
  dob: string;
  email: string;
}

export enum ScanType {
  TABLET = 'Tablet/Medicine',
  REPORT = 'Medical Report'
}

export interface AnalysisPoint {
  point: string;
  severity: 'high' | 'moderate' | 'safe' | 'info';
}

export interface ReportValue {
  testName: string;
  value: string;
  unit: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
}

export interface ScanResult {
  id: string;
  date: string;
  type: ScanType;
  imageUrl: string;
  title: string;
  isDanger: boolean;
  dangerReason?: string;
  riskLevel: 'Safe' | 'Moderate' | 'High/Danger';
  primaryUses: string;
  analysis: AnalysisPoint[];
  reportValues?: ReportValue[]; // New field for structured lab values
  recommendation: string;
  motivationalMessage: string;
  // New specific fields
  doctorName?: string;
  patientName?: string; // New field for Patient Name
  patientAgeInReport?: string;
  hospitalName?: string;
  reportDate?: string; // New field for Report Date/Time
  dietaryAdvice?: string;
  avoidAdvice?: string; // New field for things to avoid (Tablet only)
  recommendedSpecialist?: string; // New field for the type of doctor needed
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}