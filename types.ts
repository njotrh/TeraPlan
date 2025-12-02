

import { LucideIcon } from 'lucide-react';

export interface User {
  username: string;
  isAuthenticated: boolean;
  avatar?: string;
  password?: string; // In a real app, never store plain text passwords
  fullName?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string; // Format: 5XXXXXXXXX
  email?: string;
  notes: string;
  createdAt: number;
  defaultFee?: number; // Varsayılan seans ücreti
  balance: number; // Güncel bakiye (Pozitif: Borçlu, Negatif: Alacaklı/Fazla ödeme)
  isActive: boolean; // Aktif/Pasif durumu
}

export interface Anamnesis {
  clientId: string;
  presentingProblem: string; // Başvuru Sebebi
  familyHistory: string;     // Aile Öyküsü
  medicalHistory: string;    // Tıbbi/Psikiyatrik Öykü
  educationHistory: string;  // Eğitim/İş Öyküsü
  socialHistory: string;     // Sosyal İlişkiler
  traumaHistory: string;     // Travma Öyküsü
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  clientIds: string[];
  notes?: string;
  createdAt: number;
  defaultFee?: number; // Kişi başı varsayılan ücret
  isActive: boolean; // Aktif/Pasif durumu
}

export interface Document {
  id: string;
  clientId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface NoteTemplate {
  id: string;
  label: string;
  content: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type SessionType = 'individual' | 'group' | 'other';

export interface Session {
  id: string;
  type: SessionType;
  clientId?: string; // Required if type is individual
  groupId?: string;  // Required if type is group
  title?: string;    // Required if type is other
  date: number; // timestamp
  durationMinutes: number;
  status: SessionStatus;
  notes?: string; // Görüşme kaydı
  fee?: number; // O seansın ücreti
}

export type TransactionType = 'charge' | 'payment'; // charge: borçlandırma (seans), payment: ödeme

export interface Transaction {
  id: string;
  clientId: string;
  amount: number;
  type: TransactionType;
  date: number;
  description: string;
  relatedSessionId?: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: number;
  description: string;
  category?: string; // e.g., 'Ofis', 'Vergi', 'Materyal'
}

export interface ThemeConfig {
  name: string;
  primaryClass: string;
  secondaryClass: string;
  accentClass: string;
  label: string;
}

export const THEMES: ThemeConfig[] = [
  { 
    name: 'ocean', 
    label: 'Okyanus',
    primaryClass: 'bg-cyan-600 dark:bg-cyan-500', 
    secondaryClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    accentClass: 'text-cyan-600 dark:text-cyan-400'
  },
  { 
    name: 'violet', 
    label: 'Menekşe',
    primaryClass: 'bg-violet-600 dark:bg-violet-500', 
    secondaryClass: 'bg-violet-100 dark:bg-violet-900/30',
    accentClass: 'text-violet-600 dark:text-violet-400'
  },
  { 
    name: 'emerald', 
    label: 'Zümrüt',
    primaryClass: 'bg-emerald-600 dark:bg-emerald-500', 
    secondaryClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    accentClass: 'text-emerald-600 dark:text-emerald-400'
  },
  { 
    name: 'rose', 
    label: 'Gül',
    primaryClass: 'bg-rose-600 dark:bg-rose-500', 
    secondaryClass: 'bg-rose-100 dark:bg-rose-900/30',
    accentClass: 'text-rose-600 dark:text-rose-400'
  },
  { 
    name: 'amber', 
    label: 'Kehribar',
    primaryClass: 'bg-amber-600 dark:bg-amber-500', 
    secondaryClass: 'bg-amber-100 dark:bg-amber-900/30',
    accentClass: 'text-amber-700 dark:text-amber-400'
  },
  { 
    name: 'indigo', 
    label: 'İndigo',
    primaryClass: 'bg-indigo-600 dark:bg-indigo-500', 
    secondaryClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    accentClass: 'text-indigo-600 dark:text-indigo-400'
  },
  { 
    name: 'fuchsia', 
    label: 'Orkide',
    primaryClass: 'bg-fuchsia-600 dark:bg-fuchsia-500', 
    secondaryClass: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    accentClass: 'text-fuchsia-700 dark:text-fuchsia-400'
  },
  { 
    name: 'orange', 
    label: 'Turuncu',
    primaryClass: 'bg-orange-600 dark:bg-orange-500', 
    secondaryClass: 'bg-orange-100 dark:bg-orange-900/30',
    accentClass: 'text-orange-700 dark:text-orange-400'
  },
  { 
    name: 'slate', 
    label: 'Kaya',
    primaryClass: 'bg-slate-600 dark:bg-slate-500', 
    secondaryClass: 'bg-slate-200 dark:bg-slate-800',
    accentClass: 'text-slate-700 dark:text-slate-300'
  },
  { 
    name: 'lime', 
    label: 'Limon',
    primaryClass: 'bg-lime-600 dark:bg-lime-500', 
    secondaryClass: 'bg-lime-100 dark:bg-lime-900/30',
    accentClass: 'text-lime-700 dark:text-lime-400'
  },
  { 
    name: 'sky', 
    label: 'Gökyüzü',
    primaryClass: 'bg-sky-600 dark:bg-sky-500', 
    secondaryClass: 'bg-sky-100 dark:bg-sky-900/30',
    accentClass: 'text-sky-700 dark:text-sky-400'
  }
];

export const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'soap',
    label: 'SOAP Formatı',
    content: "S (Subjective - Öznel): \n\nO (Objective - Nesnel): \n\nA (Assessment - Değerlendirme): \n\nP (Plan - Plan): \n"
  },
  {
    id: 'bdt',
    label: 'BDT Formatı',
    content: "Gündem: \n\nOtomatik Düşünceler: \n\nBilişsel Çarpıtmalar: \n\nYeniden Çerçeveleme: \n\nEv Ödevi: \n"
  },
  {
    id: 'mse',
    label: 'Ruhsal Durum (MSE)',
    content: "Görünüm ve Davranış: \n\nKonuşma ve İlişki Kurma: \n\nDuygudurum ve Duygulanım: \n\nAlgı ve Düşünce İçeriği: \n\nBilişsel Yetiler: \n"
  },
  {
    id: 'child_obs',
    label: 'Çocuk Gözlem',
    content: "Oyun Temaları: \n\nEbeveyn Etkileşimi: \n\nDuygu Düzenleme: \n\nDikkat ve Dürtüsellik: \n"
  }
];

// Utility to generate IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Date Helpers
export const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  }).format(new Date(timestamp));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
};

export const getMonthDays = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getWhatsAppLink = (phone: string, clientName: string, date: number) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedDate = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(date));
  // Prefix with 90 if missing
  const fullPhone = cleanPhone.length === 10 ? `90${cleanPhone}` : cleanPhone;
  const message = `Merhaba Sayın ${clientName}, ${formattedDate} tarihindeki randevunuzu hatırlatmak isteriz.`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

export const getPaymentReminderLink = (phone: string, clientName: string, balance: number) => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Prefix with 90 if missing
  const fullPhone = cleanPhone.length === 10 ? `90${cleanPhone}` : cleanPhone;
  const message = `Merhaba Sayın ${clientName}, toplam ${formatCurrency(balance)} tutarındaki ödemenizi hatırlatmak isteriz. İyi günler dileriz.`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

// --- Important Events Logic ---
export interface ImportantEvent {
  label: string;
  type: 'national' | 'religious' | 'professional';
}

export const getImportantEvent = (date: Date): ImportantEvent | null => {
  const d = date.getDate();
  const m = date.getMonth() + 1; // 1-12
  const y = date.getFullYear();

  // Sabit Günler
  if (d === 1 && m === 1) return { label: 'Yılbaşı', type: 'national' };
  if (d === 23 && m === 4) return { label: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'national' };
  if (d === 1 && m === 5) return { label: 'Emek ve Dayanışma Günü', type: 'national' };
  if (d === 10 && m === 5) return { label: 'Dünya Psikologlar Günü', type: 'professional' };
  if (d === 19 && m === 5) return { label: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', type: 'national' };
  if (d === 15 && m === 7) return { label: 'Demokrasi ve Milli Birlik Günü', type: 'national' };
  if (d === 30 && m === 8) return { label: 'Zafer Bayramı', type: 'national' };
  if (d === 10 && m === 10) return { label: 'Dünya Ruh Sağlığı Günü', type: 'professional' };
  if (d === 29 && m === 10) return { label: 'Cumhuriyet Bayramı', type: 'national' };

  // Değişken Günler (2024 ve 2025 için basit hardcode)
  const religiousHolidays: Record<string, string> = {
    // 2024
    '2024-4-10': 'Ramazan Bayramı 1. Gün',
    '2024-4-11': 'Ramazan Bayramı 2. Gün',
    '2024-4-12': 'Ramazan Bayramı 3. Gün',
    '2024-6-16': 'Kurban Bayramı 1. Gün',
    '2024-6-17': 'Kurban Bayramı 2. Gün',
    '2024-6-18': 'Kurban Bayramı 3. Gün',
    '2024-6-19': 'Kurban Bayramı 4. Gün',
    // 2025
    '2025-3-30': 'Ramazan Bayramı 1. Gün',
    '2025-3-31': 'Ramazan Bayramı 2. Gün',
    '2025-4-1': 'Ramazan Bayramı 3. Gün',
    '2025-6-6': 'Kurban Bayramı 1. Gün',
    '2025-6-7': 'Kurban Bayramı 2. Gün',
    '2025-6-8': 'Kurban Bayramı 3. Gün',
    '2025-6-9': 'Kurban Bayramı 4. Gün',
  };

  const key = `${y}-${m}-${d}`;
  if (religiousHolidays[key]) {
    return { label: religiousHolidays[key], type: 'religious' };
  }

  return null;
};