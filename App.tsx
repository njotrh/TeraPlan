
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
  Laptop, Paperclip, BarChart, File, Repeat, Printer, StickyNote
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

const Navigate: React.FC<{to: string; replace?: boolean}> = ({ to }) => {
  const navigate = useNavigate();
  useEffect(() => navigate(to), [to]);
  return null;
};

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
    {/* The 't' shape */}
    <path d="M50 0 V60 H10 V100 H50 V150 C50 180 70 200 110 200 V160 C90 160 90 150 90 140 V100 H130 V60 H90 V0 H50 Z" />
    {/* The square dot */}
    <rect x="140" y="140" width="60" height="60" />
    
    {/* Text: tera. */}
    <text x="220" y="90" fontSize="50" fontWeight="bold" fontFamily="sans-serif">tera.</text>
    {/* Text: PLANNER */}
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
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);
        doc.text("TeraPlan Otomatik Rapor", 14, 34);

        const tableData = [
            ...transactions.map(t => [
                formatDate(t.date),
                normalizeForPDF(t.type === 'payment' ? 'Ödeme' : 'Borç'),
                normalizeForPDF(clients.find(c => c.id === t.clientId)?.name || 'Bilinmeyen'),
                normalizeForPDF(t.description),
                t.type === 'payment' ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`
            ]),
            ...expenses.map(e => [
                formatDate(e.date),
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
        doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 34);

        const tableData = sessions.map(s => [
            formatDate(s.date),
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
        doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);

        const tableData = sessions.map(s => [
            formatDate(s.date),
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
}> = ({ clients, sessions, groups, themeConfig, handleSessionCompletion, deleteSession, user, templates }) => {
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [completionNote, setCompletionNote] = useState('');

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

               <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Görüşme Notları</label>
                   <textarea className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 min-h-[150px] text-gray-900 dark:text-white resize-none" value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Görüşme hakkında notlar..." />
               </div>
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
    </div>
  );
};

// Placeholder implementations for missing components to ensure the file is complete and compilable
const CalendarPage: React.FC = () => <div className="p-8 text-center text-gray-500">Takvim Sayfası (Yapım Aşamasında)</div>;
const ClientsPage: React.FC = () => <div className="p-8 text-center text-gray-500">Danışanlar Sayfası (Yapım Aşamasında)</div>;
const GroupsPage: React.FC = () => <div className="p-8 text-center text-gray-500">Gruplar Sayfası (Yapım Aşamasında)</div>;
const ClientProfilePage: React.FC = () => <div className="p-8 text-center text-gray-500">Danışan Profili (Yapım Aşamasında)</div>;
const SettingsPage: React.FC = () => <div className="p-8 text-center text-gray-500">Ayarlar Sayfası (Yapım Aşamasında)</div>;


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
  const [isAccountingEnabled, setIsAccountingEnabled] = useState(true);

  const [supabase] = useState(() => createClient(
      process.env.REACT_APP_SUPABASE_URL || 'https://wesyhmkxxgybqndavjcy.supabase.co', 
      process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_KX0Jp67HyB07nLMOyrIpNg_0YTxPZaQ'
  ));

  const addSession = (s: Session) => setSessions(prev => [...prev, s]);
  const updateSession = (s: Session) => setSessions(prev => prev.map(item => item.id === s.id ? s : item));
  const deleteSession = (id: string) => setSessions(prev => prev.filter(item => item.id !== id));
  
  const handleSessionCompletion = (s: Session, note: string) => {
    const updated = { ...s, status: 'completed' as const, notes: note };
    updateSession(updated);
  };

  const addTransaction = (t: Transaction) => {
      setTransactions(prev => [...prev, t]);
      const client = clients.find(c => c.id === t.clientId);
      if (client) {
          const change = t.type === 'payment' ? -t.amount : t.amount;
          setClients(prev => prev.map(c => c.id === t.clientId ? { ...c, balance: c.balance + change } : c));
      }
  };

  const deleteTransaction = (id: string, clientId: string, amount: number, type: 'charge' | 'payment') => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      const client = clients.find(c => c.id === clientId);
      if (client) {
          const change = type === 'payment' ? amount : -amount;
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, balance: c.balance + change } : c));
      }
  };

  const addExpense = (e: Expense) => setExpenses(prev => [...prev, e]);
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
             setUser({ 
                 username: session.user.email || '', 
                 isAuthenticated: true, 
                 fullName: session.user.user_metadata?.full_name || 'Kullanıcı',
                 avatar: session.user.user_metadata?.avatar_url
             });
          } else {
              setUser(null);
          }
      });
      return () => subscription.unsubscribe();
  }, [supabase]);

  if (!user) {
      return <Auth supabase={supabase} />;
  }

  return (
    <MemoryRouter>
      <Layout user={user} onLogout={() => supabase.auth.signOut()} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled}>
        <Routes>
          <Route path="/" element={
            <HomePage 
                clients={clients} 
                sessions={sessions} 
                groups={groups} 
                themeConfig={themeConfig}
                user={user}
                isAccountingEnabled={isAccountingEnabled}
                templates={templates}
                addSession={addSession}
                updateSession={updateSession}
                deleteSession={deleteSession}
                handleSessionCompletion={handleSessionCompletion}
            />
          } />
          <Route path="/accounting" element={
            <AccountingPage 
                clients={clients} 
                transactions={transactions} 
                expenses={expenses} 
                themeConfig={themeConfig}
                addTransaction={addTransaction}
                deleteTransaction={deleteTransaction}
                addExpense={addExpense}
                deleteExpense={deleteExpense}
            />
          } />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientProfilePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
};

export default App;
