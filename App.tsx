import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Settings, LogOut, Plus, Search, 
  MessageCircle, Trash2, CheckCircle2, XCircle, Clock, 
  Phone, Mail, FileText, Moon, Sun, ChevronRight, History,
  ArrowLeft, Home, TrendingUp, UserCheck, CalendarDays,
  Flag, Heart, Star, Camera, Lock, User as UserIcon,
  Users as UsersIcon, LayoutGrid, Maximize2, ExternalLink,
  Wallet, Banknote, ArrowDownLeft, ArrowUpRight, TrendingDown,
  ChevronLeft, ToggleRight, ToggleLeft, List, Download, Upload,
  Save, FileJson, Database, Link as LinkIcon, Loader2,
  MoreVertical, X, Edit, Archive, CheckSquare, LayoutList,
  Laptop, Paperclip, BarChart, File, Repeat, Printer, StickyNote,
  Eye, EyeOff
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  User, Client, Session, Group, THEMES, ThemeConfig, Transaction, Expense, Document, NoteTemplate, Anamnesis,
  generateId, formatDate, getMonthDays, isSameDay, getWhatsAppLink, getPaymentReminderLink,
  getImportantEvent, formatCurrency, DEFAULT_NOTE_TEMPLATES
} from './types';
import { Button, Card, Input, Modal, SearchableSelect } from './components/UI';

// --- Internal Router Implementation ---
const RouterContext = React.createContext<{path: string, push: (p: string) => void} | null>(null);

const MemoryRouter: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [path, setPath] = useState('/');
  const push = (newPath: string) => {
    window.scrollTo(0,0);
    setPath(newPath);
  };
  return <RouterContext.Provider value={{ path, push }}>{children}</RouterContext.Provider>;
};

const useNavigate = () => {
  const ctx = React.useContext(RouterContext);
  if (!ctx) return (to: string) => console.warn("Navigation attempted outside context", to);
  return ctx.push;
};

const useLocation = () => {
  const ctx = React.useContext(RouterContext);
  return { pathname: ctx?.path || '/' };
};

const Link: React.FC<{to: string; children: React.ReactNode; className?: string}> = ({ to, children, className }) => {
  const navigate = useNavigate();
  return (
    <a 
      href={to} 
      onClick={(e) => { e.preventDefault(); navigate(to); }} 
      className={className}
    >
      {children}
    </a>
  );
};

const Routes: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { pathname } = useLocation();
  const routes = React.Children.toArray(children) as React.ReactElement[];
  
  for (const route of routes) {
    const { path, element } = route.props as { path: string; element: React.ReactNode };
    if (path === pathname) return <>{element}</>;
    if (path === '*' || path === '/*') return <>{element}</>;
    
    if (path.includes(':')) {
       const routeParts = path.split('/');
       const currentParts = pathname.split('/');
       if (routeParts.length === currentParts.length) {
         let match = true;
         for (let i = 0; i < routeParts.length; i++) {
           if (routeParts[i].startsWith(':')) continue;
           if (routeParts[i] !== currentParts[i]) {
             match = false;
             break;
           }
         }
         if (match) return <>{element}</>;
       }
    }
  }
  return null;
};

const Route: React.FC<{path: string; element: React.ReactNode}> = () => null;

const useParams = <T extends Record<string, string | undefined>>() => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/clients/')) {
    const id = pathname.split('/')[2];
    if (id) return { id } as unknown as T;
  }
  return {} as T;
};

// --- Branding Component ---
const TeraPlanLogo: React.FC<{className?: string}> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 400 200" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0 V60 H10 V100 H50 V150 C50 180 70 200 110 200 V160 C90 160 90 150 90 140 V100 H130 V60 H90 V0 H50 Z" />
    <rect x="140" y="140" width="60" height="60" />
    <text x="220" y="90" fontSize="50" fontWeight="bold" fontFamily="sans-serif">tera.</text>
    <text x="220" y="140" fontSize="36" fontWeight="normal" fontFamily="sans-serif" letterSpacing="2">PLANNER</text>
  </svg>
);

// --- Auth Component ---
const Auth: React.FC<{ supabase: SupabaseClient }> = ({ supabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (isSignUp) {
            const { error } = await (supabase.auth as any).signUp({ email, password });
            if (error) throw error;
            setError('Kayıt başarılı! Lütfen e-postanızı onaylayın veya giriş yapın.');
            setIsSignUp(false);
        } else {
            const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (err: any) {
        let msg = 'Bir hata oluştu.';
        if (typeof err === 'string') msg = err;
        else if (err.message) msg = err.message;
        else if (err.error_description) msg = err.error_description;
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
        <div className="text-center mb-10 flex flex-col items-center">
          <TeraPlanLogo className="w-48 h-24 text-gray-900 dark:text-white mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Danışan Yönetim Sistemi</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <Input type="email" label="E-posta" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" className="text-gray-900" />
          <Input type="password" label="Şifre" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="text-gray-900" />
          {error && <p className={`text-sm ml-2 font-medium ${error.includes('başarılı') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}
          
          <Button type="submit" className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Layout Component ---
const Layout: React.FC<{ 
  children: React.ReactNode; 
  user: User; 
  onLogout: () => void;
  themeConfig: ThemeConfig;
  isAccountingEnabled: boolean;
}> = ({ children, user, onLogout, themeConfig, isAccountingEnabled }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Giriş' },
    { path: '/calendar', icon: Calendar, label: 'Takvim' },
    { path: '/clients', icon: UserIcon, label: 'Danışanlar' },
    { path: '/groups', icon: UsersIcon, label: 'Gruplar' },
    ...(isAccountingEnabled ? [{ path: '/accounting', icon: Wallet, label: 'Muhasebe' }] : []),
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 px-2 mb-8 pb-8 border-b border-gray-100 dark:border-slate-800">
           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden ${themeConfig.primaryClass}`}>
              {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} />}
           </div>
           <div className="overflow-hidden">
             <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.fullName || user.username}</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">Psikolojik Danışman</p>
           </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-medium ${location.pathname === item.path ? `${themeConfig.secondaryClass} ${themeConfig.accentClass}` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
              <item.icon size={22} />
              {item.label === 'Giriş' ? 'Ana Sayfa' : item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 w-full rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm">
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-2 px-4 flex justify-around z-50 pb-safe">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${location.pathname === item.path ? themeConfig.secondaryClass + ' ' + themeConfig.accentClass : 'text-gray-500'}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      <main className="flex-1 md:ml-72 p-4 md:p-8 bg-gray-50 dark:bg-slate-950 min-h-screen pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
};

// --- Helper Components for Charts ---
const BarChartComponent: React.FC<{data: number[], labels: string[], colorClass: string, height?: string, textColor?: string}> = ({ data, labels, colorClass, height = "h-32", textColor = "text-gray-400" }) => {
    const max = Math.max(...data, 1);
    return (
        <div className={`w-full ${height} flex items-end gap-2`}>
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                    <span className={`text-[10px] font-bold ${textColor} opacity-100 mb-0.5`}>{val}</span>
                    <div 
                        className={`w-full rounded-t-sm transition-all ${colorClass} opacity-80 group-hover:opacity-100`}
                        style={{height: `${Math.max((val / max) * 100, 2)}%`}}
                    ></div>
                    <span className={`text-[10px] font-medium ${textColor} opacity-90`}>{labels[i]}</span>
                </div>
            ))}
        </div>
    )
}

// --- PDF Generators ---
const normalizeForPDF = (str: string) => {
  const map: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
    'â': 'a', 'Â': 'A', 'î': 'i', 'Î': 'I'
  };
  return str.replace(/[ğĞüÜşŞıİöÖçÇâÂîÎ]/g, (match) => map[match]);
};

const runAutoTable = (doc: any, options: any) => {
    const fn = (autoTable as any).default || autoTable;
    if (typeof fn === 'function') {
        fn(doc, options);
    } else {
        console.error("autoTable function not found", fn);
        throw new Error("PDF tablosu oluşturulamadı: Kütüphane yüklenemedi.");
    }
};

const pdfStyles = {
    font: "helvetica",
    fontSize: 9,
    cellPadding: 3,
    overflow: 'linebreak',
    textColor: 40
};

const pdfHeadStyles = {
    fillColor: [37, 99, 235], // Blue 600
    textColor: 255,
    fontStyle: 'bold'
};

const exportAccountingPDF = (transactions: Transaction[], expenses: Expense[], clients: Client[]) => {
    try {
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Muhasebe Raporu", 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        // Normalize date to fix 'Aral1k' issue
        doc.text(normalizeForPDF(`Tarih: ${formatDate(Date.now())}`), 14, 28);
        doc.text("TeraPlan Otomatik Rapor", 14, 34);

        const tableData = [
            ...transactions.map(t => [
                normalizeForPDF(formatDate(t.date)), // Fix date in table
                normalizeForPDF(t.type === 'payment' ? 'Ödeme' : 'Borç'),
                normalizeForPDF(clients.find(c => c.id === t.clientId)?.name || 'Bilinmeyen'),
                normalizeForPDF(t.description),
                t.type === 'payment' ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`
            ]),
            ...expenses.map(e => [
                normalizeForPDF(formatDate(e.date)), // Fix date in table
                'Gider',
                normalizeForPDF(e.category || 'Genel'),
                normalizeForPDF(e.description),
                `-${formatCurrency(e.amount)}`
            ])
        ].sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

        runAutoTable(doc, {
            startY: 40,
            head: [['Tarih', 'Tur', 'Ilgili Kisi/Kategori', 'Aciklama', 'Tutar']],
            body: tableData,
            theme: 'striped',
            styles: pdfStyles,
            headStyles: pdfHeadStyles,
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20 },
                2: { cellWidth: 40 },
                3: { cellWidth: 60 },
                4: { cellWidth: 25 }
            }
        });

        doc.save(`muhasebe_raporu_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e: any) {
        console.error("PDF Export Error:", e);
        alert("PDF oluşturulurken bir hata meydana geldi: " + e.message);
    }
};

const exportClientHistoryPDF = (client: Client, sessions: Session[]) => {
    try {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(normalizeForPDF(`Danisan Gecmisi: ${client.name}`), 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Telefon: ${client.phone}`, 14, 28);
        // Normalize date
        doc.text(normalizeForPDF(`Olusturulma: ${formatDate(Date.now())}`), 14, 34);

        const tableData = sessions.map(s => [
            normalizeForPDF(formatDate(s.date)), // Fix date
            s.type === 'individual' ? 'Bireysel' : 'Grup',
            s.status === 'completed' ? 'Tamamlandi' : 'Iptal/Planli',
            s.durationMinutes + ' dk',
            normalizeForPDF(s.notes || '')
        ]);

        runAutoTable(doc, {
            startY: 40,
            head: [['Tarih', 'Tur', 'Durum', 'Sure', 'Notlar']],
            body: tableData,
            theme: 'striped',
            styles: pdfStyles,
            headStyles: pdfHeadStyles,
            columnStyles: { 
                0: { cellWidth: 35 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 20 },
                4: { cellWidth: 75 } 
            }
        });

        doc.save(`${normalizeForPDF(client.name).replace(/\s+/g, '_')}_gecmis.pdf`);
    } catch (e: any) {
        console.error("PDF Export Error:", e);
        alert("PDF oluşturulurken bir hata meydana geldi: " + e.message);
    }
};

const exportGroupHistoryPDF = (group: Group, sessions: Session[]) => {
    try {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(normalizeForPDF(`Grup Gecmisi: ${group.name}`), 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(normalizeForPDF(`Olusturulma: ${formatDate(Date.now())}`), 14, 28);

        const tableData = sessions.map(s => [
            normalizeForPDF(formatDate(s.date)),
            s.status === 'completed' ? 'Tamamlandi' : 'Iptal/Planli',
            s.durationMinutes + ' dk',
            normalizeForPDF(s.notes || '')
        ]);

        runAutoTable(doc, {
            startY: 35,
            head: [['Tarih', 'Durum', 'Sure', 'Notlar']],
            body: tableData,
            theme: 'striped',
            styles: pdfStyles,
            headStyles: pdfHeadStyles,
            columnStyles: { 
                0: { cellWidth: 40 },
                1: { cellWidth: 30 },
                2: { cellWidth: 20 },
                3: { cellWidth: 90 } 
            }
        });

        doc.save(`${normalizeForPDF(group.name).replace(/\s+/g, '_')}_gecmis.pdf`);
    } catch (e: any) {
        console.error("PDF Export Error:", e);
        alert("PDF oluşturulurken bir hata meydana geldi: " + e.message);
    }
}

// --- Page Components ---

const HomePage: React.FC<{
  clients: Client[];
  sessions: Session[];
  groups: Group[];
  themeConfig: ThemeConfig;
  updateSession: (s: Session) => void;
  addSession: (s: Session) => void;
  handleSessionCompletion: (s: Session, note: string) => void;
  deleteSession: (id: string) => void;
  user: User;
  isAccountingEnabled: boolean;
  templates: NoteTemplate[];
}> = ({ clients, sessions, groups, themeConfig, handleSessionCompletion, deleteSession, user, templates, addSession, updateSession }) => {
  // ... HomePage logic (same as previous)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  
  // Quick Add State
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSessionTime, setNewSessionTime] = useState('14:00');
  const [newSessionClientId, setNewSessionClientId] = useState('');

  const today = new Date();
  const todaysSessions = sessions.filter(s => isSameDay(new Date(s.date), today)).sort((a,b) => a.date - b.date);

  const weeklyData = [];
  const weeklyLabels = [];
  for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const count = sessions.filter(s => isSameDay(new Date(s.date), d)).length;
      weeklyData.push(count);
      weeklyLabels.push(d.toLocaleDateString('tr-TR', {weekday: 'short'}));
  }

  const handleQuickAdd = () => {
     if(!newSessionClientId) return;
     const [h, m] = newSessionTime.split(':').map(Number);
     const date = new Date(newSessionDate);
     date.setHours(h, m);
     addSession({
         id: generateId(), type: 'individual', clientId: newSessionClientId,
         date: date.getTime(), durationMinutes: 60, status: 'scheduled'
     });
     setIsAddModalOpen(false); setNewSessionClientId('');
  };

  const confirmCompletion = () => {
     if(selectedSession) {
         handleSessionCompletion(selectedSession, completionNote);
         setIsCompleteModalOpen(false);
         setCompletionNote('');
         setSelectedSession(null);
     }
  };

  const confirmDeletion = () => {
      if(selectedSession) {
          deleteSession(selectedSession.id);
          setIsDeleteModalOpen(false);
          setSelectedSession(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Hoş Geldiniz, {user.fullName?.split(' ')[0] || 'Danışman'}</h2>
           <p className="text-gray-500 dark:text-gray-400">{formatDate(Date.now())}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsAddModalOpen(true)} activeTheme={themeConfig} icon={<Plus size={20}/>}>Hızlı Randevu</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`${themeConfig.primaryClass} text-white border-none md:col-span-2`}>
           <div className="flex justify-between items-start">
             <div>
               <p className="text-white/80 text-sm font-medium">Aktif Danışan</p>
               <p className="text-4xl font-bold mt-2 text-white">{clients.filter(c => c.isActive).length}</p>
             </div>
             <div className="p-3 bg-white/20 rounded-full"><UsersIcon size={24} /></div>
           </div>
           <div className="mt-6 bg-white/10 p-4 rounded-xl">
               <p className="text-xs text-white/70 mb-2 font-medium">SON 7 GÜN SEANS YOĞUNLUĞU</p>
               <BarChartComponent data={weeklyData} labels={weeklyLabels} colorClass="bg-white" height="h-16" textColor="text-white" />
           </div>
        </Card>
        <Card>
           <div className="flex justify-between items-center">
             <div>
               <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Bugün</p>
               <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{todaysSessions.length}</p>
             </div>
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400"><Calendar size={24} /></div>
           </div>
           <p className="text-xs text-gray-400 mt-4">Planlanmış seanslar</p>
        </Card>
        <Card>
           <div className="flex justify-between items-center">
             <div>
               <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Grup</p>
               <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{groups.length}</p>
             </div>
             <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400"><Users size={24} /></div>
           </div>
           <p className="text-xs text-gray-400 mt-4">Aktif gruplar</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bugünkü Program</h3>
        {todaysSessions.length > 0 ? (
          <div className="space-y-3">
            {todaysSessions.map(session => {
               const client = session.clientId ? clients.find(c => c.id === session.clientId) : null;
               const group = session.groupId ? groups.find(g => g.id === session.groupId) : null;
               const title = client ? client.name : (group ? group.name : session.title);
               return (
                 <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                       <div className="text-center min-w-[3rem]">
                          <p className="font-bold text-gray-900 dark:text-white">{new Date(session.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{session.durationMinutes} dk</p>
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{session.type === 'individual' ? 'Bireysel' : (session.type === 'group' ? 'Grup' : 'Diğer')}</span>
                            {session.status === 'completed' && <span className="text-xs text-green-600 font-medium">Tamamlandı</span>}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                        {session.status !== 'completed' && (
                           <>
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedSession(session); setIsCompleteModalOpen(true); }} title="Tamamla">
                                <CheckCircle2 size={20} className="text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedSession(session); setIsDeleteModalOpen(true); }} title="Sil">
                                <Trash2 size={20} className="text-red-500" />
                            </Button>
                           </>
                        )}
                    </div>
                 </div>
               );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Bugün için planlanmış görüşme bulunmuyor.</p>
        )}
      </Card>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Görüşmeyi Tamamla">
           <div className="space-y-4">
               <p className="text-gray-600 dark:text-gray-300">Bu görüşmeyi tamamlamak üzeresiniz. Dilerseniz görüşme notu ekleyebilirsiniz.</p>
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                   {templates.map(tpl => (
                       <button key={tpl.id} onClick={() => setCompletionNote(prev => prev + tpl.content)} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-xs rounded-lg whitespace-nowrap hover:bg-blue-50 hover:text-blue-600 border border-gray-200 dark:border-slate-700">
                           + {tpl.label}
                       </button>
                   ))}
                   {templates.length === 0 && <span className="text-xs text-gray-400 italic">Kayıtlı şablon yok. Ayarlardan ekleyebilirsiniz.</span>}
               </div>
               <textarea className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 min-h-[150px] text-gray-900 dark:text-white resize-none" value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Görüşme hakkında notlar..." />
               <Button onClick={confirmCompletion} className="w-full">Onayla ve Tamamla</Button>
           </div>
       </Modal>
       <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Randevuyu Sil">
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 size={32} /></div>
                <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Emin misiniz?</h3><p className="text-gray-500 dark:text-gray-400 mt-2">Bu randevu kalıcı olarak silinecektir.</p></div>
                <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">İptal</Button><Button variant="danger" onClick={confirmDeletion} className="flex-1">Evet, Sil</Button></div>
            </div>
       </Modal>
       <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Hızlı Randevu">
           <div className="space-y-4">
               <Input type="date" label="Tarih" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} className="text-gray-900" />
               <Input type="time" label="Saat" value={newSessionTime} onChange={e => setNewSessionTime(e.target.value)} className="text-gray-900" />
               <SearchableSelect label="Danışan" options={clients.filter(c => c.isActive).map(c => ({ value: c.id, label: c.name }))} value={newSessionClientId} onChange={setNewSessionClientId} />
               <Button onClick={handleQuickAdd} activeTheme={themeConfig} className="w-full mt-4">Oluştur</Button>
           </div>
       </Modal>
    </div>
  );
};

const CalendarPage: React.FC<{ 
  sessions: Session[]; clients: Client[]; groups: Group[]; 
  addSession: (s: Session) => void; updateSession: (s: Session) => void; 
  deleteSession: (id: string) => void; handleSessionCompletion: (s: Session, n: string) => void;
  themeConfig: ThemeConfig; templates: NoteTemplate[];
}> = ({ sessions, clients, groups, addSession, updateSession, deleteSession, handleSessionCompletion, themeConfig, templates }) => {
    // ... CalendarPage logic (same as previous)
    const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState<Partial<Session>>({ type: 'individual', durationMinutes: 60, status: 'scheduled' });
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [repeatCount, setRepeatCount] = useState(1);

  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = days[0].getDay() === 0 ? 6 : days[0].getDay() - 1; 
  const blanks = Array(startDay).fill(null);
  const allCells = [...blanks, ...days];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveSession = () => {
    if (!newSession.date || (!newSession.clientId && !newSession.groupId && !newSession.title)) return;
    
    // Repeat Logic
    for (let i = 0; i < repeatCount; i++) {
        const sessionDate = new Date(newSession.date);
        sessionDate.setDate(sessionDate.getDate() + (i * 7)); // Weekly repeat
        
        const sessionToSave: Session = {
            id: generateId(),
            type: newSession.type as any,
            clientId: newSession.clientId,
            groupId: newSession.groupId,
            title: newSession.title,
            date: sessionDate.getTime(),
            durationMinutes: newSession.durationMinutes || 60,
            status: 'scheduled'
        };
        addSession(sessionToSave);
    }
    
    setIsModalOpen(false); setRepeatCount(1);
    setNewSession({ type: 'individual', durationMinutes: 60, status: 'scheduled' });
  };

  const selectedDateSessions = sessions.filter(s => isSameDay(new Date(s.date), selectedDate)).sort((a,b) => a.date - b.date);

  const confirmCompletion = () => {
      if(selectedSession) {
          handleSessionCompletion(selectedSession, completionNote);
          setIsCompleteModalOpen(false); setCompletionNote(''); setSelectedSession(null);
      }
  };
  const confirmDeletion = () => {
      if(selectedSession) {
          deleteSession(selectedSession.id);
          setIsDeleteModalOpen(false); setSelectedSession(null);
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeft size={20}/></Button>
            <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>Bugün</Button>
            <Button variant="ghost" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRight size={20}/></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 p-4 bg-gray-50 dark:bg-slate-950/50 text-center font-bold text-gray-500 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar p-2 gap-2 bg-white dark:bg-slate-900">
          {allCells.map((date, i) => {
            if (!date) return <div key={i} className="bg-transparent" />;
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const daySessions = sessions.filter(s => isSameDay(new Date(s.date), date));
            const importantEvent = getImportantEvent(date);

            return (
              <div 
                key={i} 
                onClick={() => handleDayClick(date)}
                className={`min-h-[120px] p-2 rounded-2xl cursor-pointer transition-all border ${isSelected ? `border-2 ${themeConfig.accentClass.replace('text', 'border')} bg-blue-50 dark:bg-blue-900/10` : 'border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'} ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}
              >
                <div className={`text-right font-bold mb-1 ${isSelected ? themeConfig.accentClass : (isToday ? 'text-blue-600' : 'text-gray-900 dark:text-gray-400')}`}>
                    {date.getDate()}
                </div>
                {importantEvent && (
                    <div className={`mb-1 text-[10px] font-bold truncate px-1.5 py-0.5 rounded-md ${importantEvent.type === 'national' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : (importantEvent.type === 'religious' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400')}`}>
                        {importantEvent.label}
                    </div>
                )}
                <div className="space-y-1">
                  {daySessions.map(s => (
                    <div key={s.id} className={`text-[10px] px-2 py-1 rounded-lg truncate ${s.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                      {new Date(s.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} {s.type === 'group' ? (groups.find(g=>g.id===s.groupId)?.name || 'Grup') : (s.type === 'other' ? s.title : clients.find(c=>c.id===s.clientId)?.name)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 lg:rounded-[2rem] shadow-xl border-l border-gray-100 dark:border-slate-800 flex flex-col z-30 fixed lg:static bottom-0 left-0 right-0 max-h-[50vh] lg:max-h-full rounded-t-[2rem]">
         <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
             <div>
                 <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</h3>
                 <p className="text-sm text-gray-500">{selectedDateSessions.length} Randevu</p>
             </div>
             <Button size="sm" activeTheme={themeConfig} onClick={() => {
                 const now = new Date();
                 const initialTime = isSameDay(selectedDate, now) 
                    ? `${String(now.getHours() + 1).padStart(2, '0')}:00`
                    : '10:00';
                 // Fix local date string for input
                 const year = selectedDate.getFullYear();
                 const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                 const day = String(selectedDate.getDate()).padStart(2, '0');
                 setNewSession({ ...newSession, date: new Date(`${year}-${month}-${day}T${initialTime}`).getTime() });
                 setIsModalOpen(true);
             }} icon={<Plus size={16} />}>Ekle</Button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {selectedDateSessions.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">
                     <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                     <p>Bu güne ait plan bulunmuyor.</p>
                 </div>
             ) : (
                 selectedDateSessions.map(s => {
                     const client = s.clientId ? clients.find(c => c.id === s.clientId) : null;
                     const group = s.groupId ? groups.find(g => g.id === s.groupId) : null;
                     return (
                         <div key={s.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl group border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                             <div className="flex justify-between items-start mb-2">
                                 <span className="font-bold text-lg text-gray-900 dark:text-white">{new Date(s.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                     {s.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}
                                 </span>
                             </div>
                             <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{client?.name || group?.name || s.title}</h4>
                             <p className="text-xs text-gray-500 mb-3">{s.type === 'individual' ? 'Bireysel' : (s.type === 'group' ? 'Grup' : 'Özel')} • {s.durationMinutes} dk</p>
                             
                             {s.status !== 'completed' && (
                                 <div className="flex gap-2">
                                     <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs" onClick={() => { setSelectedSession(s); setIsCompleteModalOpen(true); }}>Tamamla</Button>
                                     <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => { setSelectedSession(s); setIsDeleteModalOpen(true); }}><Trash2 size={16} /></Button>
                                 </div>
                             )}
                         </div>
                     )
                 })
             )}
         </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Randevu">
        <div className="space-y-4">
            <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                {['individual', 'group', 'other'].map(t => (
                    <button key={t} onClick={() => setNewSession({...newSession, type: t as any})} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${newSession.type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t === 'individual' ? 'Bireysel' : (t === 'group' ? 'Grup' : 'Diğer')}
                    </button>
                ))}
            </div>
            
            {newSession.type === 'individual' && (
                 <SearchableSelect label="Danışan" options={clients.filter(c => c.isActive).map(c => ({value: c.id, label: c.name}))} value={newSession.clientId || ''} onChange={v => setNewSession({...newSession, clientId: v})} />
            )}
            {newSession.type === 'group' && (
                 <SearchableSelect label="Grup" options={groups.filter(g => g.isActive).map(g => ({value: g.id, label: g.name}))} value={newSession.groupId || ''} onChange={v => setNewSession({...newSession, groupId: v})} />
            )}
            {newSession.type === 'other' && (
                <Input label="Randevu Başlığı" value={newSession.title || ''} onChange={e => setNewSession({...newSession, title: e.target.value})} className="text-gray-900" />
            )}

            <div className="flex gap-4">
                <Input type="date" label="Tarih" value={newSession.date ? new Date(newSession.date).toISOString().slice(0,10) : ''} onChange={e => {
                    const d = new Date(e.target.value);
                    if (newSession.date) {
                        const old = new Date(newSession.date);
                        d.setHours(old.getHours(), old.getMinutes());
                    } else { d.setHours(10, 0); }
                    setNewSession({...newSession, date: d.getTime()});
                }} className="text-gray-900" />
                <Input type="time" label="Saat" value={newSession.date ? new Date(newSession.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : ''} onChange={e => {
                     const [h, m] = e.target.value.split(':').map(Number);
                     const d = new Date(newSession.date || Date.now());
                     d.setHours(h, m);
                     setNewSession({...newSession, date: d.getTime()});
                }} className="text-gray-900" />
            </div>
            <Input type="number" label="Süre (dk)" value={newSession.durationMinutes} onChange={e => setNewSession({...newSession, durationMinutes: parseInt(e.target.value)})} className="text-gray-900" />
            
            <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="repeat" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={repeatCount > 1} onChange={e => setRepeatCount(e.target.checked ? 4 : 1)} />
                <label htmlFor="repeat" className="text-sm text-gray-700 dark:text-gray-300">Bu randevuyu önümüzdeki 4 hafta tekrarla</label>
            </div>

            <Button onClick={handleSaveSession} activeTheme={themeConfig} className="w-full mt-4">Oluştur</Button>
        </div>
      </Modal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Görüşmeyi Tamamla">
           <div className="space-y-4">
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                   {templates.map(tpl => (
                       <button key={tpl.id} onClick={() => setCompletionNote(prev => prev + tpl.content)} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-xs rounded-lg whitespace-nowrap hover:bg-blue-50 hover:text-blue-600 border border-gray-200 dark:border-slate-700">
                           + {tpl.label}
                       </button>
                   ))}
               </div>
               <textarea className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 min-h-[150px] text-gray-900 dark:text-white resize-none" value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Görüşme hakkında notlar..." />
               <Button onClick={confirmCompletion} className="w-full">Onayla</Button>
           </div>
       </Modal>
       <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Sil">
            <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">Bu randevuyu silmek istediğinize emin misiniz?</p>
                <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">İptal</Button><Button variant="danger" onClick={confirmDeletion} className="flex-1">Sil</Button></div>
            </div>
       </Modal>
    </div>
  );
};

const ClientsPageImpl: React.FC<{ 
    clients: Client[]; addClient: (c: Client) => void; updateClient: (c: Client) => void; deleteClient: (id: string) => void; themeConfig: ThemeConfig; 
}> = ({ clients, addClient, updateClient, deleteClient, themeConfig }) => {
    // ... ClientsPageImpl content
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<Partial<Client>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filteredClients = clients
        .filter(c => (activeTab === 'active' ? c.isActive : !c.isActive))
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = () => {
        if (!formData.name || !formData.phone) return;
        const clientData = {
            id: editingClient ? editingClient.id : generateId(),
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes || '',
            createdAt: editingClient ? editingClient.createdAt : Date.now(),
            defaultFee: formData.defaultFee,
            balance: editingClient ? editingClient.balance : 0,
            isActive: editingClient ? editingClient.isActive : true
        } as Client;

        if (editingClient) updateClient(clientData);
        else addClient(clientData);
        
        setIsModalOpen(false); setEditingClient(null); setFormData({});
    };

    const toggleArchive = (client: Client) => {
        updateClient({ ...client, isActive: !client.isActive });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Danışanlar</h2>
                <Button onClick={() => { setEditingClient(null); setFormData({}); setIsModalOpen(true); }} activeTheme={themeConfig} icon={<Plus size={20}/>}>Yeni Danışan</Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Aktif</button>
                    <button onClick={() => setActiveTab('archived')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'archived' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Arşiv</button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-gray-900 dark:text-white text-sm" placeholder="İsimle ara..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex bg-gray-50 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-400'}`}><List size={18} /></button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <Card key={client.id} className="relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${themeConfig.primaryClass}`}>
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingClient(client); setFormData(client); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit size={16} /></button>
                                    <button onClick={() => setDeleteId(client.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{client.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{client.phone}</p>
                            <div className="flex gap-2">
                                <Link to={`/clients/${client.id}`} className="flex-1 text-center py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white">Profil</Link>
                                <button onClick={() => toggleArchive(client)} className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 hover:text-orange-600" title={client.isActive ? 'Arşivle' : 'Aktifleştir'}>
                                    <Archive size={18} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredClients.map(client => (
                        <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 transition-colors gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${themeConfig.primaryClass}`}>
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{client.name}</h4>
                                    <p className="text-sm text-gray-500">{client.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${client.balance > 0 ? 'bg-orange-100 text-orange-700' : (client.balance < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}`}>
                                    {formatCurrency(client.balance)}
                                </span>
                                <Link to={`/clients/${client.id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"><ExternalLink size={18} /></Link>
                                <button onClick={() => { setEditingClient(client); setFormData(client); setIsModalOpen(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"><Edit size={18} /></button>
                                <button onClick={() => toggleArchive(client)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"><Archive size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Danışan Düzenle" : "Yeni Danışan"}>
                <div className="space-y-4">
                    <Input label="Ad Soyad" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="text-gray-900" />
                    <Input label="Telefon (5XX...)" value={formData.phone || ''} onChange={e => {
                         let v = e.target.value.replace(/\D/g, '');
                         if(v.length > 10) v = v.slice(0,10);
                         setFormData({...formData, phone: v});
                    }} className="text-gray-900" />
                    <Input label="E-posta (Opsiyonel)" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="text-gray-900" />
                    <Input type="number" label="Varsayılan Seans Ücreti" value={formData.defaultFee ?? ''} onChange={e => setFormData({...formData, defaultFee: e.target.value ? parseFloat(e.target.value) : undefined})} className="text-gray-900" />
                    <Button onClick={handleSubmit} activeTheme={themeConfig} className="w-full mt-4">Kaydet</Button>
                </div>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Danışanı Sil">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Bu işlem danışanı ve tüm geçmiş kayıtlarını silecektir. Emin misiniz?</p>
                    <div className="flex gap-3"><Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1">İptal</Button><Button variant="danger" onClick={() => { if(deleteId) deleteClient(deleteId); setDeleteId(null); }} className="flex-1">Sil</Button></div>
                </div>
            </Modal>
        </div>
    );
};

const GroupsPageImpl: React.FC<{
    groups: Group[]; clients: Client[]; addGroup: (g: Group) => void; updateGroup: (g: Group) => void; deleteGroup: (id: string) => void; themeConfig: ThemeConfig; sessions: Session[];
}> = ({ groups, clients, addGroup, updateGroup, deleteGroup, themeConfig, sessions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [search, setSearch] = useState('');
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [formData, setFormData] = useState<Partial<Group>>({ clientIds: [] });
    const [historyGroup, setHistoryGroup] = useState<Group | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filteredGroups = groups
        .filter(g => (activeTab === 'active' ? g.isActive : !g.isActive))
        .filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = () => {
        if (!formData.name) return;
        const groupData = {
            id: editingGroup ? editingGroup.id : generateId(),
            name: formData.name,
            clientIds: formData.clientIds || [],
            notes: formData.notes || '',
            createdAt: editingGroup ? editingGroup.createdAt : Date.now(),
            defaultFee: formData.defaultFee,
            isActive: editingGroup ? editingGroup.isActive : true
        } as Group;

        if (editingGroup) updateGroup(groupData);
        else addGroup(groupData);
        setIsModalOpen(false); setEditingGroup(null); setFormData({ clientIds: [] });
    };

    const toggleMember = (clientId: string) => {
        const current = formData.clientIds || [];
        if (current.includes(clientId)) setFormData({ ...formData, clientIds: current.filter(id => id !== clientId) });
        else setFormData({ ...formData, clientIds: [...current, clientId] });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gruplar</h2>
                <Button onClick={() => { setEditingGroup(null); setFormData({ clientIds: [] }); setIsModalOpen(true); }} activeTheme={themeConfig} icon={<Plus size={20}/>}>Yeni Grup</Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Aktif</button>
                    <button onClick={() => setActiveTab('archived')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'archived' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Arşiv</button>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-gray-900 dark:text-white text-sm" placeholder="Grup ara..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex bg-gray-50 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-400'}`}><List size={18} /></button>
                    </div>
                </div>
            </div>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-2"}>
                {filteredGroups.map(group => (
                    viewMode === 'grid' ? (
                        <Card key={group.id} className="relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${themeConfig.primaryClass}`}>
                                    {group.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setHistoryGroup(group)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"><History size={16} /></button>
                                    <button onClick={() => { setEditingGroup(group); setFormData(group); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit size={16} /></button>
                                    <button onClick={() => setDeleteId(group.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{group.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{group.clientIds.length} Üye • {formatCurrency(group.defaultFee || 0)} / kişi</p>
                            <div className="flex -space-x-2 mb-4">
                                {group.clientIds.slice(0, 4).map(cid => (
                                    <div key={cid} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-gray-600" title={clients.find(c => c.id === cid)?.name}>
                                        {clients.find(c => c.id === cid)?.name.substring(0,1)}
                                    </div>
                                ))}
                                {group.clientIds.length > 4 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-500">+{group.clientIds.length - 4}</div>}
                            </div>
                            <Button onClick={() => updateGroup({ ...group, isActive: !group.isActive })} variant="ghost" className="w-full text-sm h-10">{group.isActive ? 'Arşivle' : 'Aktifleştir'}</Button>
                        </Card>
                    ) : (
                        <div key={group.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 gap-4">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${themeConfig.primaryClass}`}>{group.name.substring(0, 2).toUpperCase()}</div>
                                <div><h4 className="font-bold text-gray-900 dark:text-white">{group.name}</h4><p className="text-sm text-gray-500">{group.clientIds.length} Üye</p></div>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setHistoryGroup(group)}><History size={16} /></Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingGroup(group); setFormData(group); setIsModalOpen(true); }}><Edit size={16} /></Button>
                                <Button size="sm" variant="ghost" onClick={() => updateGroup({ ...group, isActive: !group.isActive })}><Archive size={16} /></Button>
                             </div>
                        </div>
                    )
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Grup Düzenle" : "Yeni Grup"}>
                <div className="space-y-4">
                    <Input label="Grup Adı" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="text-gray-900" />
                    <Input type="number" label="Kişi Başı Ücret" value={formData.defaultFee ?? ''} onChange={e => setFormData({...formData, defaultFee: e.target.value ? parseFloat(e.target.value) : undefined})} className="text-gray-900" />
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Üyeler ({formData.clientIds?.length || 0})</label>
                        <div className="flex flex-col gap-1.5 p-1">
                             <input className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm mb-2 text-gray-900 dark:text-white" placeholder="Danışan ara..." onChange={e => setSearch(e.target.value)} />
                             <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                {clients.filter(c => c.isActive && c.name.toLowerCase().includes(search.toLowerCase())).map(client => (
                                    <div key={client.id} onClick={() => toggleMember(client.id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${formData.clientIds?.includes(client.id) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'}`}>
                                        <span className="text-sm font-medium">{client.name}</span>
                                        {formData.clientIds?.includes(client.id) && <CheckCircle2 size={16} />}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} activeTheme={themeConfig} className="w-full mt-4">Kaydet</Button>
                </div>
            </Modal>

            <Modal isOpen={!!historyGroup} onClose={() => setHistoryGroup(null)} title="Grup Geçmişi" headerAction={<Button size="sm" variant="ghost" onClick={() => historyGroup && exportGroupHistoryPDF(historyGroup, sessions.filter(s => s.groupId === historyGroup.id))}>PDF</Button>}>
                 <div className="space-y-4">
                    {historyGroup && sessions.filter(s => s.groupId === historyGroup.id).length > 0 ? (
                        sessions.filter(s => s.groupId === historyGroup.id).sort((a,b) => b.date - a.date).map(s => (
                            <div key={s.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white">{formatDate(s.date)}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{s.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}</span>
                                </div>
                                {s.notes && <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900 p-3 rounded-lg">{s.notes}</p>}
                            </div>
                        ))
                    ) : <p className="text-center text-gray-500 py-8">Kayıt bulunamadı.</p>}
                 </div>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Grubu Sil">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Bu grubu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3"><Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1">İptal</Button><Button variant="danger" onClick={() => { if(deleteId) deleteGroup(deleteId); setDeleteId(null); }} className="flex-1">Sil</Button></div>
                </div>
            </Modal>
        </div>
    );
};

const ClientProfilePageImpl: React.FC<{
    clients: Client[]; sessions: Session[]; groups: Group[]; transactions: Transaction[]; 
    updateClient: (c: Client) => void; themeConfig: ThemeConfig;
    isAccountingEnabled: boolean; addSession: (s: Session) => void;
    user: User;
    anamnesisList: Anamnesis[];
    saveAnamnesis: (a: Anamnesis) => void;
}> = ({ clients, sessions, groups, transactions, updateClient, themeConfig, isAccountingEnabled, addSession, user, anamnesisList, saveAnamnesis }) => {
    const { id } = useParams<{id: string}>();
    const client = clients.find(c => c.id === id);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'anamnesis' | 'files'>('overview');
    const [localAnamnesis, setLocalAnamnesis] = useState<Anamnesis>({
        clientId: id || '',
        presentingProblem: '', familyHistory: '', medicalHistory: '', 
        educationHistory: '', socialHistory: '', traumaHistory: '',
        updatedAt: Date.now()
    });

    useEffect(() => {
        if (id) {
            const found = anamnesisList.find(a => a.clientId === id);
            if (found) setLocalAnamnesis(found);
            else setLocalAnamnesis(prev => ({...prev, clientId: id}));
        }
    }, [id, anamnesisList]);

    if (!client) return <div className="text-center py-20">Danışan bulunamadı.</div>;

    const clientSessions = sessions.filter(s => s.clientId === client.id || (s.groupId && groups.find(g => g.id === s.groupId)?.clientIds.includes(client.id))).sort((a,b) => b.date - a.date);
    const stats = {
        total: clientSessions.length,
        completed: clientSessions.filter(s => s.status === 'completed').length,
        cancelled: clientSessions.filter(s => s.status === 'cancelled').length
    };

    const handleSaveAnamnesis = () => {
        saveAnamnesis({...localAnamnesis, updatedAt: Date.now()});
        alert('Anamnez kaydedildi.');
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-4 mb-2">
                <Link to="/clients" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" /></Link>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Danışan Profili</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="md:col-span-1 h-fit text-center">
                      <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 overflow-hidden ${themeConfig.primaryClass}`}>
                          {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h3>
                      <p className="text-gray-500 mb-6">{client.phone}</p>
                      
                      <div className="flex justify-center gap-3 mb-6">
                          <a href={`tel:${client.phone}`} className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"><Phone size={20} /></a>
                          <a href={getWhatsAppLink(client.phone, client.name, Date.now())} target="_blank" rel="noreferrer" className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"><MessageCircle size={20} /></a>
                          {client.email && <a href={`mailto:${client.email}`} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"><Mail size={20} /></a>}
                      </div>

                      {isAccountingEnabled && (
                          <div className={`p-4 rounded-2xl mb-6 ${client.balance > 0 ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'}`}>
                              <p className="text-xs font-medium opacity-80">GÜNCEL BAKİYE</p>
                              <p className="text-2xl font-bold mt-1">{formatCurrency(client.balance)}</p>
                              {client.balance > 0 && (
                                  <a href={getPaymentReminderLink(client.phone, client.name, client.balance)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs font-bold hover:underline">
                                      <MessageCircle size={12} /> Ödeme Hatırlat
                                  </a>
                              )}
                          </div>
                      )}

                      <div className="text-left space-y-3">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Üyesi Olduğu Gruplar</h4>
                          <div className="flex flex-wrap gap-2">
                              {groups.filter(g => g.clientIds.includes(client.id)).map(g => (
                                  <span key={g.id} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">{g.name}</span>
                              ))}
                              {groups.filter(g => g.clientIds.includes(client.id)).length === 0 && <span className="text-xs text-gray-400">Grup üyeliği yok</span>}
                          </div>
                      </div>
                 </Card>

                 <div className="md:col-span-2 space-y-6">
                     <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 pb-1 overflow-x-auto">
                         {[{id: 'overview', label: 'Genel Bakış'}, {id: 'history', label: 'Geçmiş'}, {id: 'anamnesis', label: 'Anamnez'}, {id: 'files', label: 'Dosyalar'}].map(tab => (
                             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? `border-${themeConfig.name}-600 ${themeConfig.accentClass}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                 {tab.label}
                             </button>
                         ))}
                     </div>

                     {activeTab === 'overview' && (
                         <div className="grid grid-cols-3 gap-4">
                             <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl text-center"><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-xs text-blue-600/80">Toplam Seans</p></div>
                             <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl text-center"><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-xs text-green-600/80">Tamamlanan</p></div>
                             <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl text-center"><p className="text-2xl font-bold text-red-600">{stats.cancelled}</p><p className="text-xs text-red-600/80">İptal/Gelmedi</p></div>
                             
                             <div className="col-span-3 mt-4">
                                 <h4 className="font-bold text-gray-900 dark:text-white mb-2">Genel Notlar</h4>
                                 <textarea className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl text-sm text-gray-700 dark:text-gray-300 min-h-[100px] resize-none focus:outline-none" value={client.notes} onChange={e => updateClient({...client, notes: e.target.value})} placeholder="Danışan hakkında genel notlar..." />
                             </div>
                         </div>
                     )}

                     {activeTab === 'history' && (
                         <div className="space-y-4">
                             <div className="flex justify-end"><Button size="sm" variant="ghost" onClick={() => exportClientHistoryPDF(client, clientSessions)} icon={<Printer size={16}/>}>PDF İndir</Button></div>
                             <div className="relative border-l-2 border-gray-200 dark:border-slate-800 ml-3 space-y-8 py-2">
                                 {clientSessions.map(s => (
                                     <div key={s.id} className="relative pl-6">
                                         <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${s.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                         <div className="flex justify-between items-start mb-1">
                                             <span className="font-bold text-gray-900 dark:text-white text-sm">{formatDate(s.date)}</span>
                                             <span className="text-xs text-gray-500">{s.type === 'group' ? 'Grup' : 'Bireysel'}</span>
                                         </div>
                                         {s.notes && <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-line">{s.notes}</div>}
                                     </div>
                                 ))}
                                 {clientSessions.length === 0 && <p className="text-sm text-gray-400 pl-6">Henüz görüşme kaydı yok.</p>}
                             </div>
                         </div>
                     )}

                     {activeTab === 'anamnesis' && (
                         <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="col-span-2">
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Başvuru Sebebi</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[80px]" value={localAnamnesis.presentingProblem || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, presentingProblem: e.target.value})} placeholder="Danışanın geliş sebebi..." />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Aile Öyküsü</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[120px]" value={localAnamnesis.familyHistory || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, familyHistory: e.target.value})} placeholder="Aile yapısı, ilişkiler..." />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tıbbi / Psikiyatrik Öykü</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[120px]" value={localAnamnesis.medicalHistory || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, medicalHistory: e.target.value})} placeholder="Hastalıklar, ilaçlar, eski tedaviler..." />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Eğitim / İş Öyküsü</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[120px]" value={localAnamnesis.educationHistory || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, educationHistory: e.target.value})} placeholder="Okul, iş hayatı..." />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sosyal İlişkiler</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[120px]" value={localAnamnesis.socialHistory || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, socialHistory: e.target.value})} placeholder="Arkadaşlıklar, sosyal yaşam..." />
                                 </div>
                                 <div className="col-span-2">
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Travma Öyküsü</label>
                                     <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white text-sm min-h-[80px]" value={localAnamnesis.traumaHistory || ''} onChange={e => setLocalAnamnesis({...localAnamnesis, traumaHistory: e.target.value})} placeholder="Önemli travmatik yaşantılar..." />
                                 </div>
                             </div>
                             <Button onClick={handleSaveAnamnesis} activeTheme={themeConfig} className="w-full">Kaydet</Button>
                         </div>
                     )}
                     
                     {activeTab === 'files' && (
                         <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                             <Paperclip className="mx-auto text-gray-400 mb-2" size={32} />
                             <p className="text-gray-500 text-sm">Dosya yükleme alanı (Yakında)</p>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};

const SettingsPageImpl: React.FC<{
    user: User; themeConfig: ThemeConfig; setThemeConfig: (t: ThemeConfig) => void;
    colorMode: 'light' | 'dark' | 'system'; setColorMode: (m: 'light' | 'dark' | 'system') => void;
    isAccountingEnabled: boolean; setIsAccountingEnabled: (v: boolean) => void;
    exportData: () => void; importData: () => void;
    updateProfile: (name: string) => void;
    uploadAvatar: (file: File) => void;
    updatePassword: (pass: string) => void;
}> = ({ user, themeConfig, setThemeConfig, colorMode, setColorMode, isAccountingEnabled, setIsAccountingEnabled, exportData, importData, updateProfile, uploadAvatar, updatePassword }) => {
    const [fullName, setFullName] = useState(user.fullName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        await uploadAvatar(e.target.files[0]);
        setUploading(false);
    };

    const handlePasswordSubmit = () => {
        if (newPassword.length < 6) return alert("Şifre en az 6 karakter olmalıdır.");
        if (newPassword !== confirmPassword) return alert("Şifreler eşleşmiyor.");
        updatePassword(newPassword);
        setNewPassword(''); setConfirmPassword('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ayarlar</h2>

            <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profil</h3>
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden ${themeConfig.primaryClass}`}>
                             {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={32} />}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                        {uploading && <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">Profil Fotoğrafı</p>
                        <p className="text-xs text-gray-500">Değiştirmek için tıklayın</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input label="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} className="text-gray-900" />
                    <Button onClick={() => updateProfile(fullName)} activeTheme={themeConfig}>Güncelle</Button>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Lock size={20} /> Güvenlik</h3>
                <div className="space-y-4">
                    <Input type="password" label="Yeni Şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••" className="text-gray-900" />
                    <Input type="password" label="Şifre Tekrar" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••" className="text-gray-900" />
                    <Button onClick={handlePasswordSubmit} variant="secondary" activeTheme={themeConfig}>Şifreyi Değiştir</Button>
                </div>
            </Card>
            
            <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Görünüm</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-3">Renk Teması</label>
                        <div className="flex flex-wrap gap-3">
                            {THEMES.map(theme => (
                                <button 
                                    key={theme.name}
                                    onClick={() => setThemeConfig(theme)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${theme.primaryClass} ${themeConfig.name === theme.name ? 'ring-4 ring-offset-2 ring-gray-200 dark:ring-slate-700' : ''}`}
                                    title={theme.label}
                                >
                                    {themeConfig.name === theme.name && <CheckCircle2 className="text-white" size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-3">Mod</label>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                             <button onClick={() => setColorMode('light')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${colorMode === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Sun size={16}/> Aydınlık</button>
                             <button onClick={() => setColorMode('dark')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${colorMode === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-gray-500'}`}><Moon size={16}/> Karanlık</button>
                             <button onClick={() => setColorMode('system')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${colorMode === 'system' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}><Laptop size={16}/> Sistem</button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sistem</h3>
                 <div className="space-y-6">
                     <div className="flex items-center justify-between">
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Muhasebe Modülü</h4>
                             <p className="text-sm text-gray-500">Finansal takip özelliklerini aç/kapat</p>
                         </div>
                         <button onClick={() => setIsAccountingEnabled(!isAccountingEnabled)} className={`text-4xl transition-colors ${isAccountingEnabled ? 'text-green-500' : 'text-gray-300'}`}>
                             {isAccountingEnabled ? <ToggleRight /> : <ToggleLeft />}
                         </button>
                     </div>
                     <hr className="border-gray-100 dark:border-slate-800" />
                     <div className="flex gap-4">
                         <Button variant="secondary" onClick={exportData} icon={<Download size={18}/>}>Yedeği İndir</Button>
                         <Button variant="ghost" onClick={importData} icon={<Upload size={18}/>}>Yedek Yükle</Button>
                     </div>
                 </div>
            </Card>
            <div className="text-center text-xs text-gray-400 pb-8">TeraPlan v0.2</div>
        </div>
    );
};

const AccountingPage: React.FC<{
  clients: Client[];
  transactions: Transaction[];
  expenses: Expense[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string, clientId: string, amount: number, type: 'charge' | 'payment') => void;
  addExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  themeConfig: ThemeConfig;
}> = ({ clients, transactions, expenses, addTransaction, deleteTransaction, addExpense, deleteExpense, themeConfig }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<{clientId: string, amount: string, description: string}>({ clientId: '', amount: '', description: 'Ödeme' });
  const [newExpense, setNewExpense] = useState<{amount: string, description: string, category: string}>({ amount: '', description: '', category: 'Ofis' });
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('month');

  const filterDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      if (timeFilter === 'all') return true;
      if (timeFilter === 'day') return isSameDay(date, now);
      if (timeFilter === 'week') {
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
          startOfWeek.setHours(0,0,0,0);
          return date >= startOfWeek;
      }
      if (timeFilter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
  };

  const filteredTransactions = transactions.filter(t => filterDate(t.date));
  const filteredExpenses = expenses.filter(e => filterDate(e.date));

  const totalRevenue = filteredTransactions.filter(t => t.type === 'charge').reduce((sum, t) => sum + t.amount, 0);
  const totalCollected = filteredTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + c.balance, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netCash = totalCollected - totalExpenses;
  const historyItems = [...filteredTransactions.map(t => ({ ...t, kind: 'transaction' as const })), ...filteredExpenses.map(e => ({ ...e, kind: 'expense' as const }))].sort((a, b) => b.date - a.date);

  const incomeData = [];
  const incomeLabels = [];
  for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthIncome = transactions
          .filter(t => t.type === 'payment' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear())
          .reduce((sum, t) => sum + t.amount, 0);
      incomeData.push(monthIncome);
      incomeLabels.push(d.toLocaleDateString('tr-TR', {month: 'short'}));
  }

  const handleSavePayment = () => {
    if (!newPayment.clientId || !newPayment.amount) return;
    addTransaction({ id: generateId(), clientId: newPayment.clientId, amount: parseFloat(newPayment.amount), type: 'payment', date: Date.now(), description: newPayment.description });
    setIsPaymentModalOpen(false); setNewPayment({ clientId: '', amount: '', description: 'Ödeme' });
  };
  const handleSaveExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    addExpense({ id: generateId(), amount: parseFloat(newExpense.amount), date: Date.now(), description: newExpense.description, category: newExpense.category });
    setIsExpenseModalOpen(false); setNewExpense({ amount: '', description: '', category: 'Ofis' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h2 className="text-3xl font-bold text-gray-900 dark:text-white">Muhasebe</h2><p className="text-gray-500 dark:text-gray-400">Finansal durum, ödeme ve gider takibi</p></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => setIsExpenseModalOpen(true)} activeTheme={themeConfig} icon={<TrendingDown size={20} />}>Gider Ekle</Button><Button onClick={() => setIsPaymentModalOpen(true)} activeTheme={themeConfig} icon={<Plus size={20} />}>Ödeme Al</Button></div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap p-1 bg-white dark:bg-slate-900 rounded-xl w-full sm:w-fit border border-gray-100 dark:border-slate-800">
            {[ {id: 'day', label: 'Günlük'}, {id: 'week', label: 'Haftalık'}, {id: 'month', label: 'Aylık'}, {id: 'all', label: 'Tümü'} ].map(t => (
                <button 
                    key={t.id} 
                    onClick={() => setTimeFilter(t.id as any)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === t.id ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t.label}
                </button>
            ))}
        </div>
        <Button variant="ghost" onClick={() => exportAccountingPDF(filteredTransactions, filteredExpenses, clients)} icon={<Printer size={18}/>}>Rapor İndir (PDF)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center justify-between bg-emerald-600 text-white border-none"><div><p className="text-emerald-100 text-sm font-medium">Toplam Ciro</p><p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p></div><div className="p-3 bg-white/20 rounded-full"><TrendingUp size={24} className="text-white" /></div></Card>
        <Card className="flex items-center justify-between"><div><p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tahsil Edilen</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalCollected)}</p></div><div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full"><Wallet size={24} className="text-blue-600 dark:text-blue-400" /></div></Card>
        <Card className="flex items-center justify-between"><div><p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Toplam Gider</p><p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalExpenses)}</p></div><div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full"><TrendingDown size={24} className="text-red-600 dark:text-red-400" /></div></Card>
        <Card className={`flex items-center justify-between ${netCash >= 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}><div><p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Kasa</p><p className={`text-2xl font-bold mt-1 ${netCash >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(netCash)}</p></div><div className={`p-3 rounded-full ${netCash >= 0 ? 'bg-green-200 dark:bg-green-800/40' : 'bg-red-200 dark:bg-red-800/40'}`}><Banknote size={24} className={netCash >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'} /></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                  <BarChart className="text-blue-600" size={24} />
                  <h3 className="font-bold text-gray-900 dark:text-white">Aylık Gelir Grafiği (Son 6 Ay)</h3>
              </div>
              <BarChartComponent data={incomeData} labels={incomeLabels} colorClass="bg-blue-500" height="h-48" textColor="text-gray-500 dark:text-gray-400" />
          </Card>
          <Card className="flex items-center justify-between"><div><p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Danışanlardan Bekleyen Toplam Bakiye</p><p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{formatCurrency(totalOutstanding)}</p></div></Card>
      </div>

      <Card>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><History size={20} className={themeConfig.accentClass} /> Son İşlemler & Giderler</h3>
        <div className="space-y-4 overflow-x-auto">
          {historyItems.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-8">Henüz işlem veya gider kaydı bulunmuyor.</p> : historyItems.map((item) => {
              if (item.kind === 'transaction') {
                 const t = item as Transaction;
                 const client = clients.find(c => c.id === t.clientId);
                 return (
                    <div key={t.id} className="min-w-[500px] flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl group hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-4"><div className={`p-3 rounded-full ${t.type === 'payment' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'}`}>{t.type === 'payment' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div><div><h4 className="font-bold text-gray-900 dark:text-white">{client?.name || 'Bilinmeyen Danışan'}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p></div></div>
                      <div className="flex items-center gap-4"><div className="text-right"><p className={`font-bold ${t.type === 'payment' ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'}`}>{t.type === 'payment' ? '+' : ''}{formatCurrency(t.amount)}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)}</p></div><button onClick={() => deleteTransaction(t.id, t.clientId, t.amount, t.type)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all" title="İşlemi Sil"><Trash2 size={16} /></button></div>
                    </div>
                 );
              } else {
                 const e = item as Expense;
                 return (
                    <div key={e.id} className="min-w-[500px] flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 group hover:border-red-200 dark:hover:border-red-800 transition-colors">
                      <div className="flex items-center gap-4"><div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600"><TrendingDown size={20} /></div><div><h4 className="font-bold text-gray-900 dark:text-white">{e.description}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{e.category}</p></div></div>
                      <div className="flex items-center gap-4"><div className="text-right"><p className="font-bold text-red-600">-{formatCurrency(e.amount)}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(e.date)}</p></div><button onClick={() => deleteExpense(e.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all" title="Gideri Sil"><Trash2 size={16} /></button></div>
                    </div>
                 );
              }
            })}
        </div>
      </Card>
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Ödeme Al">
        <div className="space-y-4">
          <SearchableSelect label="Danışan" placeholder="Danışan Seçiniz" options={clients.map(c => ({ value: c.id, label: `${c.name} (Bakiye: ${formatCurrency(c.balance)})` }))} value={newPayment.clientId} onChange={val => setNewPayment({...newPayment, clientId: val})} />
          <Input type="number" label="Tutar (TL)" placeholder="0.00" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="text-gray-900" />
          <Input label="Açıklama" placeholder="Örn: Nakit Ödeme, Havale" value={newPayment.description} onChange={e => setNewPayment({...newPayment, description: e.target.value})} className="text-gray-900" />
          <Button onClick={handleSavePayment} activeTheme={themeConfig} className="w-full mt-4">Ödemeyi Kaydet</Button>
        </div>
      </Modal>
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Yeni Gider Ekle">
         <div className="space-y-4">
            <Input label="Açıklama" placeholder="Örn: Ofis Kirası, Elektrik Faturası" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="text-gray-900" />
            <Input type="number" label="Tutar (TL)" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="text-gray-900" />
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Kategori</label><select className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 text-gray-900 dark:text-white w-full" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}><option value="Ofis">Ofis Giderleri</option><option value="Vergi">Vergi / Muhasebe</option><option value="Materyal">Terapi Materyalleri</option><option value="Eğitim">Eğitim / Süpervizyon</option><option value="Diğer">Diğer</option></select></div>
            <Button onClick={handleSaveExpense} variant="danger" className="w-full mt-4">Gideri Kaydet</Button>
         </div>
      </Modal>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [templates, setTemplates] = useState<NoteTemplate[]>(DEFAULT_NOTE_TEMPLATES);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(THEMES[0]);
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isAccountingEnabled, setIsAccountingEnabled] = useState(true);
  const [anamnesisList, setAnamnesisList] = useState<Anamnesis[]>([]);

  const [supabase] = useState(() => createClient(
      process.env.REACT_APP_SUPABASE_URL || 'https://wesyhmkxxgybqndavjcy.supabase.co', 
      process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_KX0Jp67HyB07nLMOyrIpNg_0YTxPZaQ'
  ));

  const fetchData = async () => {
      if (!user) return;
      try {
          const [clientsRes, groupsRes, sessionsRes, transactionsRes, expensesRes, settingsRes, anamnesisRes] = await Promise.all([
              supabase.from('clients').select('*'),
              supabase.from('groups').select('*'),
              supabase.from('sessions').select('*'),
              supabase.from('transactions').select('*'),
              supabase.from('expenses').select('*'),
              supabase.from('user_settings').select('*').single(),
              supabase.from('anamnesis').select('*')
          ]);

          if (clientsRes.data) {
              setClients(clientsRes.data.map((c: any) => ({
                  id: c.id, name: c.name, phone: c.phone, email: c.email, notes: c.notes,
                  createdAt: c.created_at, defaultFee: c.default_fee, balance: c.balance, isActive: c.is_active
              })));
          }
          if (groupsRes.data) {
              setGroups(groupsRes.data.map((g: any) => ({
                  id: g.id, name: g.name, clientIds: g.client_ids, notes: g.notes,
                  createdAt: g.created_at, defaultFee: g.default_fee, isActive: g.is_active
              })));
          }
          if (sessionsRes.data) {
              setSessions(sessionsRes.data.map((s: any) => ({
                  id: s.id, type: s.type, clientId: s.client_id, groupId: s.group_id, title: s.title,
                  date: s.date, durationMinutes: s.duration_minutes, status: s.status, notes: s.notes, fee: s.fee
              })));
          }
          if (transactionsRes.data) {
              setTransactions(transactionsRes.data.map((t: any) => ({
                  id: t.id, clientId: t.client_id, amount: t.amount, type: t.type, date: t.date, description: t.description, relatedSessionId: t.related_session_id
              })));
          }
          if (expensesRes.data) {
              setExpenses(expensesRes.data.map((e: any) => ({
                  id: e.id, amount: e.amount, date: e.date, description: e.description, category: e.category
              })));
          }
          if (anamnesisRes.data) {
              setAnamnesisList(anamnesisRes.data.map((a: any) => ({
                  clientId: a.client_id,
                  presentingProblem: a.presenting_problem,
                  familyHistory: a.family_history,
                  medicalHistory: a.medical_history,
                  educationHistory: a.education_history,
                  socialHistory: a.social_history,
                  traumaHistory: a.trauma_history,
                  updatedAt: a.updated_at
              })));
          }
          if (settingsRes.data) {
              if (settingsRes.data.theme) {
                  const savedTheme = THEMES.find(t => t.name === settingsRes.data.theme);
                  if (savedTheme) setThemeConfig(savedTheme);
              }
              if (settingsRes.data.dark_mode !== null) setColorMode(settingsRes.data.theme_mode || (settingsRes.data.dark_mode ? 'dark' : 'light'));
              if (settingsRes.data.accounting_enabled !== null) setIsAccountingEnabled(settingsRes.data.accounting_enabled);
              if (settingsRes.data.full_name) setUser(prev => prev ? {...prev, fullName: settingsRes.data.full_name} : null);
              if (settingsRes.data.avatar) setUser(prev => prev ? {...prev, avatar: settingsRes.data.avatar} : null);
          }
      } catch (error) { console.error("Data fetch error:", error); }
  };

  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
             setUser({ 
                 username: session.user.email || '', 
                 isAuthenticated: true, 
                 fullName: session.user.user_metadata?.full_name || 'Kullanıcı',
                 avatar: session.user.user_metadata?.avatar_url,
                 id: session.user.id
             });
          } else {
              setUser(null);
          }
      });
      return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
      if (user) fetchData();
  }, [user]);

  // ... CRUD operations (addSession, updateSession, etc.) - ensure to include saveAnamnesis, uploadAvatar, updatePassword

  const addSession = async (s: Session) => {
      setSessions(prev => [...prev, s]);
      await supabase.from('sessions').insert({
          id: s.id, user_id: (await supabase.auth.getUser()).data.user?.id,
          type: s.type, client_id: s.clientId, group_id: s.groupId, title: s.title,
          date: s.date, duration_minutes: s.durationMinutes, status: s.status, notes: s.notes, fee: s.fee
      });
  };
  const updateSession = async (s: Session) => {
      setSessions(prev => prev.map(item => item.id === s.id ? s : item));
      await supabase.from('sessions').update({
          status: s.status, notes: s.notes, fee: s.fee, date: s.date
      }).eq('id', s.id);
  };
  const deleteSession = async (id: string) => {
      setSessions(prev => prev.filter(item => item.id !== id));
      await supabase.from('sessions').delete().eq('id', id);
  };
  
  const handleSessionCompletion = async (s: Session, note: string) => {
    const updated = { ...s, status: 'completed' as const, notes: note };
    updateSession(updated);
    if (isAccountingEnabled) {
        if (s.type === 'individual' && s.clientId) {
            const client = clients.find(c => c.id === s.clientId);
            if (client && client.defaultFee) {
                const transaction: Transaction = {
                    id: generateId(), clientId: client.id, amount: client.defaultFee, type: 'charge', date: Date.now(), description: `Görüşme Ücreti - ${formatDate(s.date)}`, relatedSessionId: s.id
                };
                addTransaction(transaction);
            }
        } else if (s.type === 'group' && s.groupId) {
             const group = groups.find(g => g.id === s.groupId);
             if (group && group.defaultFee) {
                 group.clientIds.forEach(cid => {
                     addTransaction({
                         id: generateId(), clientId: cid, amount: group.defaultFee!, type: 'charge', date: Date.now(), description: `Grup Seansı - ${group.name}`, relatedSessionId: s.id
                     });
                 });
             }
        }
    }
  };

  const addTransaction = async (t: Transaction) => {
      setTransactions(prev => [...prev, t]);
      const client = clients.find(c => c.id === t.clientId);
      if (client) {
          const change = t.type === 'payment' ? -t.amount : t.amount;
          const newBalance = client.balance + change;
          setClients(prev => prev.map(c => c.id === t.clientId ? { ...c, balance: newBalance } : c));
          await supabase.from('transactions').insert({
              id: t.id, user_id: (await supabase.auth.getUser()).data.user?.id,
              client_id: t.clientId, amount: t.amount, type: t.type, date: t.date, description: t.description, related_session_id: t.relatedSessionId
          });
          await supabase.from('clients').update({ balance: newBalance }).eq('id', client.id);
      }
  };

  const deleteTransaction = async (id: string, clientId: string, amount: number, type: 'charge' | 'payment') => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      const client = clients.find(c => c.id === clientId);
      if (client) {
          const change = type === 'payment' ? amount : -amount;
          const newBalance = client.balance + change;
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, balance: newBalance } : c));
          await supabase.from('transactions').delete().eq('id', id);
          await supabase.from('clients').update({ balance: newBalance }).eq('id', clientId);
      }
  };

  const addExpense = async (e: Expense) => {
      setExpenses(prev => [...prev, e]);
      await supabase.from('expenses').insert({
          id: e.id, user_id: (await supabase.auth.getUser()).data.user?.id,
          amount: e.amount, date: e.date, description: e.description, category: e.category
      });
  };
  const deleteExpense = async (id: string) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      await supabase.from('expenses').delete().eq('id', id);
  };

  const addClient = async (c: Client) => {
      setClients(prev => [...prev, c]);
      await supabase.from('clients').insert({
          id: c.id, user_id: (await supabase.auth.getUser()).data.user?.id,
          name: c.name, phone: c.phone, email: c.email, notes: c.notes,
          created_at: c.createdAt, default_fee: c.defaultFee, balance: c.balance, is_active: c.isActive
      });
  };
  const updateClient = async (c: Client) => {
      setClients(prev => prev.map(item => item.id === c.id ? c : item));
      await supabase.from('clients').update({
          name: c.name, phone: c.phone, email: c.email, notes: c.notes, default_fee: c.defaultFee, is_active: c.isActive
      }).eq('id', c.id);
  };
  const deleteClient = async (id: string) => {
      setClients(prev => prev.filter(item => item.id !== id));
      await supabase.from('clients').delete().eq('id', id);
  };

  const addGroup = async (g: Group) => {
      setGroups(prev => [...prev, g]);
      await supabase.from('groups').insert({
          id: g.id, user_id: (await supabase.auth.getUser()).data.user?.id,
          name: g.name, client_ids: g.clientIds, notes: g.notes, created_at: g.createdAt, default_fee: g.defaultFee, is_active: g.isActive
      });
  };
  const updateGroup = async (g: Group) => {
      setGroups(prev => prev.map(item => item.id === g.id ? g : item));
      await supabase.from('groups').update({
          name: g.name, client_ids: g.clientIds, default_fee: g.defaultFee, is_active: g.isActive
      }).eq('id', g.id);
  };
  const deleteGroup = async (id: string) => {
      setGroups(prev => prev.filter(item => item.id !== id));
      await supabase.from('groups').delete().eq('id', id);
  };

  const updateProfile = async (name: string) => {
      setUser(prev => prev ? {...prev, fullName: name} : null);
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) {
          await supabase.from('user_settings').upsert({ user_id: uid, full_name: name });
      }
  };
  
  const handleThemeChange = async (t: ThemeConfig) => {
      setThemeConfig(t);
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) await supabase.from('user_settings').upsert({ user_id: uid, theme: t.name });
  };
  
  const handleColorModeChange = async (m: 'light' | 'dark' | 'system') => {
      setColorMode(m);
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) await supabase.from('user_settings').upsert({ user_id: uid, theme_mode: m });
  };

  const saveAnamnesis = async (a: Anamnesis) => {
      setAnamnesisList(prev => {
          const idx = prev.findIndex(item => item.clientId === a.clientId);
          if (idx >= 0) { const newArr = [...prev]; newArr[idx] = a; return newArr; }
          return [...prev, a];
      });
      await supabase.from('anamnesis').upsert({
          client_id: a.clientId, user_id: (await supabase.auth.getUser()).data.user?.id,
          presenting_problem: a.presentingProblem, family_history: a.familyHistory, medical_history: a.medicalHistory,
          education_history: a.educationHistory, social_history: a.socialHistory, trauma_history: a.traumaHistory,
          updated_at: a.updatedAt
      });
  };

  const uploadAvatar = async (file: File) => {
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
          setUser(prev => prev ? {...prev, avatar: data.publicUrl} : null);
          await supabase.from('user_settings').upsert({ user_id: user!.id, avatar: data.publicUrl });
          alert("Profil fotoğrafı güncellendi.");
      } catch (e: any) { alert("Yükleme hatası: " + e.message); }
  };

  const updatePassword = async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) alert("Hata: " + error.message);
      else alert("Şifre başarıyla güncellendi.");
  };

  const exportData = () => {
      const data = { clients, sessions, groups, transactions, expenses, settings: { theme: themeConfig.name, isAccountingEnabled } };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `teraplan_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
  };

  const importData = () => alert("İçe aktarma özelliği şu an sadece manuel SQL ile mümkündür.");

  if (!user) {
      return <Auth supabase={supabase} />;
  }

  return (
    <MemoryRouter>
      <Layout user={user} onLogout={() => supabase.auth.signOut()} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled}>
        <Routes>
          <Route path="/" element={
            <HomePage 
                clients={clients} sessions={sessions} groups={groups} themeConfig={themeConfig} user={user}
                isAccountingEnabled={isAccountingEnabled} templates={templates}
                addSession={addSession} updateSession={updateSession} deleteSession={deleteSession}
                handleSessionCompletion={handleSessionCompletion}
            />
          } />
          <Route path="/accounting" element={
            <AccountingPage 
                clients={clients} transactions={transactions} expenses={expenses} themeConfig={themeConfig}
                addTransaction={addTransaction} deleteTransaction={deleteTransaction}
                addExpense={addExpense} deleteExpense={deleteExpense}
            />
          } />
          <Route path="/calendar" element={
            <CalendarPage 
                sessions={sessions} clients={clients} groups={groups} themeConfig={themeConfig} templates={templates}
                addSession={addSession} updateSession={updateSession} deleteSession={deleteSession}
                handleSessionCompletion={handleSessionCompletion}
            />
          } />
          <Route path="/clients" element={
              <ClientsPageImpl clients={clients} addClient={addClient} updateClient={updateClient} deleteClient={deleteClient} themeConfig={themeConfig} />
          } />
          <Route path="/clients/:id" element={
              <ClientProfilePageImpl 
                  clients={clients} sessions={sessions} groups={groups} transactions={transactions} 
                  updateClient={updateClient} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled} 
                  addSession={addSession} user={user} anamnesisList={anamnesisList} saveAnamnesis={saveAnamnesis}
              />
          } />
          <Route path="/groups" element={
              <GroupsPageImpl groups={groups} clients={clients} addGroup={addGroup} updateGroup={updateGroup} deleteGroup={deleteGroup} themeConfig={themeConfig} sessions={sessions} />
          } />
          <Route path="/settings" element={
              <SettingsPageImpl 
                  user={user} themeConfig={themeConfig} setThemeConfig={handleThemeChange} 
                  colorMode={colorMode} setColorMode={handleColorModeChange} 
                  isAccountingEnabled={isAccountingEnabled} setIsAccountingEnabled={setIsAccountingEnabled} 
                  exportData={exportData} importData={importData} updateProfile={updateProfile}
                  uploadAvatar={uploadAvatar} updatePassword={updatePassword}
              />
          } />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
};

export default App;