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

// --- Connection Config (Hardcoded, skipped) ---
const ConnectionConfig: React.FC<{ onConnect: (url: string, key: string) => void }> = ({ onConnect }) => null;

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
          {/* Custom Logo Replacement */}
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
const BarChartComponent: React.FC<{data: number[], labels: string[], colorClass: string, height?: string, labelColor?: string}> = ({ data, labels, colorClass, height = "h-32", labelColor = "text-gray-400" }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="w-full">
            <div className={`flex items-end gap-2 ${height}`}>
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div 
                            className={`w-full rounded-t-lg transition-all ${colorClass} opacity-80 group-hover:opacity-100`}
                            style={{height: `${(val / max) * 100}%`}}
                        ></div>
                        <span className={`text-[10px] ${labelColor} dark:text-gray-500 absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity`}>{val}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
                {labels.map((l, i) => <span key={i} className={`text-[10px] ${labelColor}`}>{l}</span>)}
            </div>
        </div>
    )
}

// --- PDF Generators ---
// Safe execution helper for autoTable which might vary in import style
const runAutoTable = (doc: any, options: any) => {
    const fn = (autoTable as any).default || autoTable;
    if (typeof fn === 'function') {
        fn(doc, options);
    } else {
        console.error("autoTable function not found", fn);
        throw new Error("PDF tablosu oluşturulamadı: Kütüphane yüklenemedi.");
    }
};

// Styles for PDF
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
                t.type === 'payment' ? 'Odeme' : 'Borc', // Avoid non-ascii
                clients.find(c => c.id === t.clientId)?.name || 'Bilinmeyen',
                t.description,
                t.type === 'payment' ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`
            ]),
            ...expenses.map(e => [
                formatDate(e.date),
                'Gider',
                e.category || 'Genel',
                e.description,
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
                3: { cellWidth: 60 } // Description column width
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
        doc.text(`Danisan Gecmisi: ${client.name}`, 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Telefon: ${client.phone}`, 14, 28);
        doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 34);

        const tableData = sessions.map(s => [
            formatDate(s.date),
            s.type === 'individual' ? 'Bireysel' : 'Grup',
            s.status === 'completed' ? 'Tamamlandi' : 'Iptal/Planli',
            s.durationMinutes + ' dk',
            s.notes || ''
        ]);

        runAutoTable(doc, {
            startY: 40,
            head: [['Tarih', 'Tur', 'Durum', 'Sure', 'Notlar']],
            body: tableData,
            theme: 'striped',
            styles: pdfStyles,
            headStyles: pdfHeadStyles,
            columnStyles: { 
                4: { cellWidth: 70 } // Wrap text in notes column
            }
        });

        doc.save(`${client.name.replace(/\s+/g, '_')}_gecmis.pdf`);
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
        doc.text(`Grup Gecmisi: ${group.name}`, 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);

        const tableData = sessions.map(s => [
            formatDate(s.date),
            s.status === 'completed' ? 'Tamamlandi' : 'Iptal/Planli',
            s.durationMinutes + ' dk',
            s.notes || ''
        ]);

        runAutoTable(doc, {
            startY: 35,
            head: [['Tarih', 'Durum', 'Sure', 'Notlar']],
            body: tableData,
            theme: 'striped',
            styles: pdfStyles,
            headStyles: pdfHeadStyles,
            columnStyles: { 3: { cellWidth: 90 } }
        });

        doc.save(`${group.name.replace(/\s+/g, '_')}_gecmis.pdf`);
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

  // Generate Weekly Data for Chart
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
               <BarChartComponent data={weeklyData} labels={weeklyLabels} colorClass="bg-white" height="h-16" labelColor="text-white/80" />
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

const CalendarPage: React.FC<{
  sessions: Session[];
  clients: Client[];
  groups: Group[];
  addSession: (s: Session) => void;
  updateSession: (s: Session) => void;
  deleteSession: (id: string) => void;
  handleSessionCompletion: (s: Session, note: string) => void;
  themeConfig: ThemeConfig;
  isAccountingEnabled: boolean;
  templates: NoteTemplate[];
}> = ({ sessions, clients, groups, addSession, deleteSession, handleSessionCompletion, themeConfig, templates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [newSession, setNewSession] = useState<Partial<Session>>({ durationMinutes: 50, type: 'individual' });
  
  // Recurring Session State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCount, setRecurringCount] = useState(4);
  const [recurringFreq, setRecurringFreq] = useState(7); // Days

  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
  const selectedDaySessions = sessions.filter(s => isSameDay(new Date(s.date), selectedDate)).sort((a, b) => a.date - b.date);
  
  // Filter only active clients/groups for new sessions
  const activeClients = clients.filter(c => c.isActive);
  const activeGroups = groups.filter(g => g.isActive);

  const openCreateForSelectedDay = () => {
    const d = new Date(selectedDate);
    d.setHours(9, 0, 0, 0);
    setNewSession({ date: d.getTime(), durationMinutes: 50, type: 'individual' });
    setIsRecurring(false);
    setIsCreateModalOpen(true);
  };

  const handleSave = () => {
      if(!newSession.date || !newSession.type) return;
      
      const sessionsToCreate = [];
      const baseDate = new Date(newSession.date);

      if (isRecurring) {
          for(let i=0; i<recurringCount; i++) {
              const nextDate = new Date(baseDate);
              nextDate.setDate(baseDate.getDate() + (i * recurringFreq));
              sessionsToCreate.push({ ...newSession, date: nextDate.getTime(), id: generateId(), status: 'scheduled' });
          }
      } else {
          sessionsToCreate.push({ ...newSession, id: generateId(), status: 'scheduled' });
      }

      sessionsToCreate.forEach(s => addSession(s as Session));
      setIsCreateModalOpen(false);
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

  const toInputString = (timestamp: number) => {
    const d = new Date(timestamp);
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
       <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4">
           <div className="flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-slate-950 z-10 py-2">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                   <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{monthName}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                   <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
           </div>

           <div className="grid grid-cols-7 gap-3 auto-rows-fr">
             {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                <div key={d} className="text-center font-medium text-gray-500 dark:text-gray-400 py-2 sticky top-12 bg-gray-50 dark:bg-slate-950">{d}</div>
             ))}
             {days.map(day => {
                const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const event = getImportantEvent(day);

                return (
                   <div 
                     key={day.toISOString()} 
                     onClick={() => setSelectedDate(day)}
                     className={`min-h-[100px] rounded-2xl p-2 border transition-all cursor-pointer relative group ${isSelected ? `border-2 ${themeConfig.secondaryClass.replace('bg-', 'border-')} shadow-md scale-[1.02] z-10` : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'}`}
                   >
                      <div className="flex justify-between items-start">
                        {event && <div className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 px-1.5 py-0.5 rounded-md truncate max-w-[70%]">{event.label}</div>}
                        <p className={`font-medium ml-auto w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? `${themeConfig.primaryClass} text-white` : 'text-gray-700 dark:text-gray-300'}`}>{day.getDate()}</p>
                      </div>
                      <div className="mt-2 space-y-1">
                         {daySessions.slice(0, 3).map(s => (
                            <div key={s.id} className="text-xs p-1 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 truncate">
                               <span className="font-bold mr-1">{new Date(s.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                               {clients.find(c => c.id === s.clientId)?.name || groups.find(g => g.id === s.groupId)?.name || s.title}
                            </div>
                         ))}
                         {daySessions.length > 3 && <div className="text-[10px] text-center text-gray-400">+{daySessions.length - 3} daha</div>}
                      </div>
                   </div>
                );
             })}
           </div>
       </div>

       <Card className="w-full lg:w-96 shrink-0 flex flex-col gap-0 p-0 overflow-hidden h-fit lg:max-h-full">
           <div className={`p-6 ${themeConfig.secondaryClass} bg-opacity-30`}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{formatDate(selectedDate.getTime()).split(' ').slice(0, -1).join(' ')}</h3>
                <p className="text-gray-500 dark:text-gray-400">{formatDate(selectedDate.getTime()).split(' ').slice(-1)}</p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px] lg:max-h-[calc(100vh-20rem)] custom-scrollbar">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 dark:text-white">Randevular</h4>
                    <span className="text-sm text-gray-500">{selectedDaySessions.length} Adet</span>
                </div>

                {selectedDaySessions.length > 0 ? (
                    <div className="space-y-3">
                        {selectedDaySessions.map(session => {
                            const client = session.clientId ? clients.find(c => c.id === session.clientId) : null;
                            const group = session.groupId ? groups.find(g => g.id === session.groupId) : null;
                            const title = client ? client.name : (group ? group.name : session.title);

                            return (
                                <div key={session.id} className={`p-3 rounded-xl border-l-4 ${session.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-blue-500 bg-gray-50 dark:bg-slate-800'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
                                            <p className="text-xs text-gray-500">{session.type === 'individual' ? 'Bireysel' : session.type === 'group' ? 'Grup' : 'Diğer'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{new Date(session.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</p>
                                            <p className="text-[10px] text-gray-500">{session.durationMinutes} dk</p>
                                        </div>
                                    </div>
                                    {session.status !== 'completed' && (
                                        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                            <button onClick={() => { setSelectedSession(session); setIsCompleteModalOpen(true); }} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600 transition-colors" title="Tamamla"><CheckCircle2 size={16} /></button>
                                            <button onClick={() => { setSelectedSession(session); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors" title="Sil"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Bu güne planlanmış randevu yok.</p>
                    </div>
                )}
           </div>

           <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <Button onClick={openCreateForSelectedDay} activeTheme={themeConfig} className="w-full"><Plus size={18} /> Bu Güne Randevu Ekle</Button>
           </div>
       </Card>

       <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Yeni Randevu">
           <div className="space-y-4">
              <Input type="datetime-local" value={newSession.date ? toInputString(newSession.date) : ''} onChange={e => setNewSession({...newSession, date: new Date(e.target.value).getTime()})} label="Tarih ve Saat" />
              <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Görüşme Türü</label>
                  <select className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white" value={newSession.type} onChange={e => setNewSession({...newSession, type: e.target.value as any})}>
                      <option value="individual">Bireysel</option>
                      <option value="group">Grup</option>
                      <option value="other">Diğer</option>
                  </select>
              </div>
              {newSession.type === 'individual' && <SearchableSelect label="Danışan" options={activeClients.map(c => ({value: c.id, label: c.name}))} value={newSession.clientId || ''} onChange={val => setNewSession({...newSession, clientId: val})} placeholder="Danışan Seç" />}
              {newSession.type === 'group' && (
                  <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Grup</label>
                      <select className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newSession.groupId || ''} onChange={e => setNewSession({...newSession, groupId: e.target.value})}>
                         <option value="">Grup Seçiniz</option>
                         {activeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                  </div>
              )}
              {newSession.type === 'other' && <Input label="Randevu Başlığı" placeholder="Örn: Diş Hekimi, Özel İş" value={newSession.title || ''} onChange={e => setNewSession({...newSession, title: e.target.value})} />}
              
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2"><Repeat size={16} /> Düzenli Tekrarla</span>
                  </label>
                  {isRecurring && (
                      <div className="flex gap-4 mt-2 pl-7">
                          <div className="flex-1">
                              <span className="text-xs text-gray-500 block mb-1">Sıklık</span>
                              <select value={recurringFreq} onChange={e => setRecurringFreq(parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 text-sm">
                                  <option value={7}>Her Hafta</option>
                                  <option value={14}>2 Haftada Bir</option>
                                  <option value={28}>4 Haftada Bir</option>
                              </select>
                          </div>
                          <div className="flex-1">
                               <span className="text-xs text-gray-500 block mb-1">Tekrar Sayısı</span>
                               <input type="number" min="2" max="52" value={recurringCount} onChange={e => setRecurringCount(parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 text-sm" />
                          </div>
                      </div>
                  )}
              </div>

              <Button onClick={handleSave} className="w-full mt-2">Kaydet {isRecurring && `(${recurringCount} Adet)`}</Button>
           </div>
       </Modal>
       
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
                   <textarea className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 min-h-[100px] text-gray-900 dark:text-white resize-none" value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Görüşme hakkında notlar..." />
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

const ClientsPage: React.FC<{
  clients: Client[];
  sessions: Session[];
  groups: Group[];
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  toggleClientStatus: (client: Client) => void;
  themeConfig: ThemeConfig;
  isAccountingEnabled: boolean;
}> = ({ clients, addClient, updateClient, deleteClient, toggleClientStatus, themeConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const filteredClients = clients
    .filter(c => c.isActive === (activeTab === 'active'))
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
      setSelectedClient(client);
      setFormData(client);
      setIsModalOpen(true);
  };

  const handleSave = () => {
     if(!formData.name || !formData.phone) return;
     
     if (selectedClient) {
         // Update
         updateClient({ ...selectedClient, ...formData as Client });
     } else {
         // Create
         addClient({ 
             ...formData as Client, 
             id: generateId(), 
             createdAt: Date.now(), 
             balance: 0, 
             notes: formData.notes || '', 
             defaultFee: formData.defaultFee || 0,
             isActive: true
         });
     }
     setIsModalOpen(false); 
     setFormData({});
  };

  const confirmDeletion = () => {
    if(selectedClient) {
        deleteClient(selectedClient.id);
        setIsDeleteModalOpen(false);
        setSelectedClient(null);
    }
  };

  return (
     <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Danışanlar</h2>
             <div className="flex gap-4 mt-2 border-b border-gray-200 dark:border-slate-800">
                <button onClick={() => setActiveTab('active')} className={`pb-2 text-sm font-medium ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Aktif ({clients.filter(c => c.isActive).length})</button>
                <button onClick={() => setActiveTab('archived')} className={`pb-2 text-sm font-medium ${activeTab === 'archived' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Arşiv ({clients.filter(c => !c.isActive).length})</button>
             </div>
           </div>
           <Button onClick={handleOpenCreate} activeTheme={themeConfig} icon={<Plus size={20} />}>Yeni Danışan</Button>
        </div>

        <div className="flex items-center gap-2">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white" placeholder="Danışan ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl">
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-slate-800 text-blue-600' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
               <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-slate-800 text-blue-600' : 'text-gray-400'}`}><LayoutList size={20} /></button>
           </div>
        </div>

        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <div key={client.id} className="relative group">
                    <Link to={`/clients/${client.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${themeConfig.primaryClass}`}>{client.name.substring(0, 2).toUpperCase()}</div>
                                <div className="text-right"><p className={`font-bold ${client.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(client.balance)}</p><p className="text-xs text-gray-400">Bakiye</p></div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{client.phone}</p>
                        </Card>
                    </Link>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.preventDefault(); handleOpenEdit(client); }} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-400 hover:text-blue-600 transition-colors" title="Düzenle"><Edit size={16} /></button>
                        <button onClick={(e) => { e.preventDefault(); toggleClientStatus(client); }} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-400 hover:text-orange-500 transition-colors" title={client.isActive ? "Arşivle" : "Aktifleştir"}>{client.isActive ? <Archive size={16} /> : <CheckSquare size={16} />}</button>
                        <button onClick={(e) => { e.preventDefault(); setSelectedClient(client); setIsDeleteModalOpen(true); }} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors" title="Sil"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                {filteredClients.map((client, i) => (
                     <div key={client.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${i !== filteredClients.length -1 ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}>
                         <Link to={`/clients/${client.id}`} className="flex items-center gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${themeConfig.primaryClass}`}>{client.name.substring(0, 2).toUpperCase()}</div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{client.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{client.phone}</p>
                            </div>
                         </Link>
                         <div className="flex items-center gap-6 mr-4">
                            <div className="text-right">
                                <p className={`font-bold text-sm ${client.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(client.balance)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenEdit(client)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                                <button onClick={() => toggleClientStatus(client)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-orange-600">{client.isActive ? <Archive size={16} /> : <CheckSquare size={16} />}</button>
                                <button onClick={() => { setSelectedClient(client); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                         </div>
                     </div>
                ))}
            </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedClient ? "Danışanı Düzenle" : "Yeni Danışan"}>
            <div className="space-y-4">
               <Input label="Ad Soyad" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="text-gray-900" />
               <Input label="Telefon" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="text-gray-900" />
               <Input label="E-posta" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="text-gray-900" />
               <Input label="Varsayılan Ücret" type="number" value={formData.defaultFee || ''} onChange={e => setFormData({...formData, defaultFee: parseFloat(e.target.value)})} className="text-gray-900" />
               <Button onClick={handleSave} className="w-full">Kaydet</Button>
            </div>
        </Modal>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Danışanı Sil">
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 size={32} /></div>
                <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">"{selectedClient?.name}" Silinecek</h3><p className="text-gray-500 dark:text-gray-400 mt-2">Bu işlem geri alınamaz.</p></div>
                <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">İptal</Button><Button variant="danger" onClick={confirmDeletion} className="flex-1">Evet, Sil</Button></div>
            </div>
       </Modal>
     </div>
  );
};

const GroupsPage: React.FC<{
  groups: Group[];
  clients: Client[];
  sessions: Session[];
  addGroup: (g: Group) => void;
  updateGroup: (g: Group) => void;
  deleteGroup: (id: string) => void;
  toggleGroupStatus: (group: Group) => void;
  themeConfig: ThemeConfig;
  isAccountingEnabled: boolean;
}> = ({ groups, clients, sessions, addGroup, updateGroup, deleteGroup, toggleGroupStatus, themeConfig }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
   const [formData, setFormData] = useState<Partial<Group>>({ clientIds: [] });
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
   const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
   const [historyGroup, setHistoryGroup] = useState<Group | null>(null);

   const filteredGroups = groups
     .filter(g => g.isActive === (activeTab === 'active'))
     .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

   const handleOpenCreate = () => {
       setSelectedGroup(null);
       setFormData({ clientIds: [] });
       setIsModalOpen(true);
   };

   const handleOpenEdit = (group: Group) => {
       setSelectedGroup(group);
       setFormData(group);
       setIsModalOpen(true);
   };

   const handleSave = () => {
      if(!formData.name) return;
      if (selectedGroup) {
          updateGroup({ ...selectedGroup, ...formData as Group });
      } else {
          addGroup({ 
              ...formData as Group, 
              id: generateId(), 
              createdAt: Date.now(), 
              clientIds: formData.clientIds || [],
              isActive: true,
              defaultFee: formData.defaultFee || 0
          });
      }
      setIsModalOpen(false); 
      setFormData({ clientIds: [] });
   };

   const confirmDeletion = () => {
        if(selectedGroup) {
            deleteGroup(selectedGroup.id);
            setIsDeleteModalOpen(false);
            setSelectedGroup(null);
        }
   };

   const openHistory = (group: Group) => {
       setHistoryGroup(group);
       setIsHistoryModalOpen(true);
   };

   const getGroupSessions = (groupId: string) => {
       return sessions.filter(s => s.groupId === groupId).sort((a,b) => b.date - a.date);
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gruplar</h2>
               <div className="flex gap-4 mt-2 border-b border-gray-200 dark:border-slate-800">
                    <button onClick={() => setActiveTab('active')} className={`pb-2 text-sm font-medium ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Aktif ({groups.filter(g => g.isActive).length})</button>
                    <button onClick={() => setActiveTab('archived')} className={`pb-2 text-sm font-medium ${activeTab === 'archived' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Arşiv ({groups.filter(g => !g.isActive).length})</button>
               </div>
            </div>
            <Button onClick={handleOpenCreate} activeTheme={themeConfig} icon={<Plus size={20} />}>Yeni Grup</Button>
         </div>

         <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white" placeholder="Grup ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-slate-800 text-blue-600' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-slate-800 text-blue-600' : 'text-gray-400'}`}><LayoutList size={20} /></button>
            </div>
         </div>

         {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map(group => (
                <Card key={group.id} className="relative group hover:border-blue-100 dark:hover:border-blue-900/30 border border-transparent transition-all">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{group.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{group.clientIds.length} Katılımcı</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {group.clientIds.map(cid => {
                            const c = clients.find(cl => cl.id === cid);
                            return c ? <span key={cid} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">{c.name}</span> : null;
                        })}
                    </div>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openHistory(group)} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 hover:text-blue-500 transition-colors" title="Geçmiş"><History size={16} /></button>
                        <button onClick={() => handleOpenEdit(group)} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 hover:text-blue-500 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => toggleGroupStatus(group)} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 hover:text-orange-500 transition-colors">{group.isActive ? <Archive size={16} /> : <CheckSquare size={16} />}</button>
                        <button onClick={() => { setSelectedGroup(group); setIsDeleteModalOpen(true); }} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                </Card>
                ))}
            </div>
         ) : (
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                 {filteredGroups.map((group, i) => (
                     <div key={group.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${i !== filteredGroups.length -1 ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}>
                         <div className="flex-1">
                             <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{group.clientIds.length} Katılımcı</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => openHistory(group)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-blue-600"><History size={16} /></button>
                            <button onClick={() => handleOpenEdit(group)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                            <button onClick={() => toggleGroupStatus(group)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-orange-600">{group.isActive ? <Archive size={16} /> : <CheckSquare size={16} />}</button>
                            <button onClick={() => { setSelectedGroup(group); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                         </div>
                     </div>
                 ))}
             </div>
         )}

         <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedGroup ? "Grubu Düzenle" : "Yeni Grup"}>
            <div className="space-y-4">
               <Input label="Grup Adı" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="text-gray-900" />
               <Input label="Kişi Başı Varsayılan Ücret" type="number" value={formData.defaultFee || ''} onChange={e => setFormData({...formData, defaultFee: parseFloat(e.target.value)})} className="text-gray-900" />
               <div className="space-y-2"><label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Katılımcılar</label><div className="max-h-40 overflow-y-auto border border-gray-100 dark:border-slate-800 rounded-xl p-2 bg-gray-50 dark:bg-slate-800 custom-scrollbar">{clients.filter(c => c.isActive).map(c => (<label key={c.id} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"><input type="checkbox" checked={formData.clientIds?.includes(c.id)} onChange={e => { const ids = formData.clientIds || []; setFormData({...formData, clientIds: e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id)}); }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" /><span className="text-gray-700 dark:text-gray-300">{c.name}</span></label>))}</div></div>
               <Button onClick={handleSave} className="w-full">Kaydet</Button>
            </div>
         </Modal>
         <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Grubu Sil">
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 size={32} /></div>
                <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">"{selectedGroup?.name}" Silinecek</h3><p className="text-gray-500 dark:text-gray-400 mt-2">Bu işlem geri alınamaz.</p></div>
                <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">İptal</Button><Button variant="danger" onClick={confirmDeletion} className="flex-1">Evet, Sil</Button></div>
            </div>
       </Modal>
       <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Oturum Geçmişi: ${historyGroup?.name}`}>
            {historyGroup && (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-center"><p className="text-xs text-gray-500">Toplam</p><p className="font-bold text-gray-900 dark:text-white">{getGroupSessions(historyGroup.id).length}</p></div>
                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl text-center"><p className="text-xs text-green-600">Tamamlanan</p><p className="font-bold text-green-700">{getGroupSessions(historyGroup.id).filter(s => s.status === 'completed').length}</p></div>
                        <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-center"><p className="text-xs text-red-600">İptal</p><p className="font-bold text-red-700">{getGroupSessions(historyGroup.id).filter(s => s.status === 'cancelled').length}</p></div>
                    </div>
                    <div className="flex justify-end">
                         <Button size="sm" variant="secondary" onClick={() => exportGroupHistoryPDF(historyGroup, getGroupSessions(historyGroup.id))} icon={<Printer size={16} />}>PDF Olarak İndir</Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {getGroupSessions(historyGroup.id).length > 0 ? getGroupSessions(historyGroup.id).map(s => (
                            <div key={s.id} className="p-3 border border-gray-100 dark:border-slate-800 rounded-xl flex justify-between items-center">
                                <div><p className="font-medium text-gray-900 dark:text-white text-sm">{formatDate(s.date)}</p><p className="text-xs text-gray-500">{s.notes ? 'Not Var' : 'Not Yok'}</p></div>
                                <span className={`text-xs px-2 py-1 rounded-md font-medium ${s.status === 'completed' ? 'bg-green-100 text-green-700' : (s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}>{s.status === 'completed' ? 'Tamamlandı' : (s.status === 'cancelled' ? 'İptal' : 'Planlı')}</span>
                            </div>
                        )) : <p className="text-center text-gray-400 text-sm py-4">Kayıt bulunamadı.</p>}
                    </div>
                </div>
            )}
       </Modal>
      </div>
   );
};

const ClientProfilePage: React.FC<{
  clients: Client[];
  sessions: Session[];
  groups: Group[];
  transactions: Transaction[];
  themeConfig: ThemeConfig;
  isAccountingEnabled: boolean;
  documents: Document[];
  uploadDocument: (file: File, clientId: string) => void;
  deleteDocument: (id: string, url: string) => void;
  saveAnamnesis: (a: Anamnesis) => void;
  getAnamnesis: (clientId: string) => Anamnesis | undefined;
}> = ({ clients, sessions, groups, transactions, themeConfig, documents, uploadDocument, deleteDocument, saveAnamnesis, getAnamnesis }) => {
   const { id } = useParams<{id: string}>();
   const client = clients.find(c => c.id === id);
   const [viewNoteSession, setViewNoteSession] = useState<Session | null>(null);
   const [activeTab, setActiveTab] = useState<'info' | 'history' | 'files' | 'anamnesis'>('info');
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [uploading, setUploading] = useState(false);
   
   // Anamnesis State
   const [anamnesisForm, setAnamnesisForm] = useState<Anamnesis>({
       clientId: id || '',
       presentingProblem: '', familyHistory: '', medicalHistory: '', educationHistory: '', socialHistory: '', traumaHistory: '', updatedAt: Date.now()
   });

   useEffect(() => {
       if (id) {
           const existing = getAnamnesis(id);
           if (existing) setAnamnesisForm(existing);
           else setAnamnesisForm(prev => ({...prev, clientId: id}));
       }
   }, [id, getAnamnesis]);

   if (!client) return <div>Danışan bulunamadı.</div>;

   const clientSessions = sessions.filter(s => s.clientId === id || (s.type === 'group' && s.groupId && groups.find(g => g.id === s.groupId)?.clientIds.includes(id || ''))).sort((a,b) => b.date - a.date);
   const clientTransactions = transactions.filter(t => t.clientId === id).sort((a,b) => b.date - a.date);
   const clientDocuments = documents.filter(d => d.clientId === id).sort((a,b) => b.createdAt - a.createdAt);
   const nextSession = clientSessions.find(s => s.status === 'scheduled' && s.date > Date.now());

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
       if(e.target.files && e.target.files[0]) {
           setUploading(true);
           try {
               await uploadDocument(e.target.files[0], id || '');
           } finally {
               setUploading(false);
           }
       }
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center gap-4">
             <Link to="/clients" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" /></Link>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name} {client.isActive ? '' : '(Pasif)'}</h2>
         </div>

         <div className="flex gap-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
             <button onClick={() => setActiveTab('info')} className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Bilgiler</button>
             <button onClick={() => setActiveTab('anamnesis')} className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'anamnesis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Anamnez</button>
             <button onClick={() => setActiveTab('history')} className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Geçmiş</button>
             <button onClick={() => setActiveTab('files')} className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Dosyalar</button>
         </div>

         {activeTab === 'info' && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">İletişim</h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{client.phone}</p>
                {client.email && <p className="text-gray-600 dark:text-gray-400 text-sm">{client.email}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                    <a href={`tel:${client.phone}`} className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full"><Phone size={20} /></a>
                    {client.email && <a href={`mailto:${client.email}`} className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full"><Mail size={20} /></a>}
                    {nextSession && <a href={getWhatsAppLink(client.phone, client.name, nextSession.date)} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center gap-2 px-4 hover:bg-emerald-200 transition-colors" title="Sonraki Randevuyu Hatırlat"><MessageCircle size={20} /> <span className="text-xs font-medium">Randevu Hatırlat</span></a>}
                </div>
                </Card>
                <Card>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Finansal Durum</h3>
                <p className={`text-2xl font-bold ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(client.balance)}</p>
                <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-400">{client.balance > 0 ? 'Borçlu' : 'Bakiyesi Var'}</p>
                        {client.balance > 0 && <a href={getPaymentReminderLink(client.phone, client.name, client.balance)} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"><MessageCircle size={14} /> Ödeme Hatırlat</a>}
                </div>
                </Card>
                <Card><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Toplam Seans</h3><p className="text-2xl font-bold text-gray-900 dark:text-white">{clientSessions.length}</p></Card>
            </div>
            <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Danışan Notları</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{client.notes || 'Genel not girilmemiş.'}</p>
            </Card>
            </>
         )}

         {activeTab === 'anamnesis' && (
             <Card className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Anamnez Formu</h3>
                    <Button onClick={() => saveAnamnesis(anamnesisForm)}>Kaydet</Button>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Başvuru Sebebi (Presenting Problem)</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.presentingProblem} onChange={e => setAnamnesisForm({...anamnesisForm, presentingProblem: e.target.value})} placeholder="Danışanın geliş sebebi..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aile Öyküsü</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.familyHistory} onChange={e => setAnamnesisForm({...anamnesisForm, familyHistory: e.target.value})} placeholder="Ebeveynler, kardeşler, aile içi ilişkiler..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tıbbi / Psikiyatrik Öykü</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.medicalHistory} onChange={e => setAnamnesisForm({...anamnesisForm, medicalHistory: e.target.value})} placeholder="Geçmiş hastalıklar, kullanılan ilaçlar, önceki tedaviler..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Eğitim / İş Öyküsü</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.educationHistory} onChange={e => setAnamnesisForm({...anamnesisForm, educationHistory: e.target.value})} placeholder="Okul hayatı, akademik başarı, iş geçmişi..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sosyal İlişkiler</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.socialHistory} onChange={e => setAnamnesisForm({...anamnesisForm, socialHistory: e.target.value})} placeholder="Arkadaşlıklar, romantik ilişkiler, sosyal destek..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Travma Öyküsü</label>
                         <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none text-gray-900 dark:text-white resize-none min-h-[100px]" value={anamnesisForm.traumaHistory} onChange={e => setAnamnesisForm({...anamnesisForm, traumaHistory: e.target.value})} placeholder="Kaza, kayıp, şiddet, istismar vb..." />
                     </div>
                 </div>
             </Card>
         )}

         {activeTab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><History size={20} /> Seans Geçmişi</h3>
                    <Button size="sm" variant="secondary" onClick={() => exportClientHistoryPDF(client, clientSessions)} icon={<Printer size={16} />}>PDF</Button>
                </div>
                <div className="space-y-3">
                    {clientSessions.length > 0 ? clientSessions.map(s => (<div key={s.id} onClick={() => s.notes ? setViewNoteSession(s) : null} className={`flex justify-between items-center p-3 rounded-xl border border-transparent transition-all ${s.notes ? 'bg-blue-50 dark:bg-slate-800 hover:border-blue-200 cursor-pointer' : 'bg-gray-50 dark:bg-slate-800'}`}><div><p className="font-medium text-gray-900 dark:text-white">{formatDate(s.date)}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}</p></div>{s.notes && <div className="flex items-center gap-1 text-blue-500"><FileText size={16} /><span className="text-xs">Notu Gör</span></div>}</div>)) : <p className="text-sm text-gray-400">Henüz kayıt yok.</p>}
                </div>
                </Card>
                <Card>
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Wallet size={20} /> Finansal Hareketler</h3>
                <div className="space-y-3">
                    {clientTransactions.length > 0 ? clientTransactions.map(t => (<div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">{t.description}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)}</p></div><span className={`font-bold ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'payment' ? '+' : '-'}{formatCurrency(t.amount)}</span></div>)) : <p className="text-sm text-gray-400">Henüz işlem yok.</p>}
                </div>
                </Card>
            </div>
         )}

         {activeTab === 'files' && (
             <Card>
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Paperclip size={20} /> Dosyalar</h3>
                     <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} icon={uploading ? <Loader2 className="animate-spin"/> : <Upload size={16} />}>
                         {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
                     </Button>
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                 </div>
                 
                 {clientDocuments.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {clientDocuments.map(doc => (
                             <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl group border border-transparent hover:border-blue-200 dark:hover:border-blue-900">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="p-3 bg-white dark:bg-slate-700 rounded-lg text-blue-600"><File size={20} /></div>
                                     <div className="overflow-hidden">
                                         <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white truncate hover:underline block">{doc.name}</a>
                                         <p className="text-xs text-gray-500">{formatDate(doc.createdAt)} • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                     </div>
                                 </div>
                                 <button onClick={() => deleteDocument(doc.id, doc.name)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Trash2 size={18} />
                                 </button>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                         <File className="mx-auto text-gray-300 dark:text-slate-700 mb-2" size={48} />
                         <p className="text-gray-500 dark:text-gray-400">Henüz dosya yüklenmemiş.</p>
                     </div>
                 )}
             </Card>
         )}

         <Modal isOpen={!!viewNoteSession} onClose={() => setViewNoteSession(null)} title="Görüşme Detayı">
             <div className="space-y-4">
                 <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800 pb-2"><span>{viewNoteSession && formatDate(viewNoteSession.date)}</span><span>{viewNoteSession?.durationMinutes} dk</span></div>
                 <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl min-h-[150px] whitespace-pre-wrap text-gray-800 dark:text-gray-200">{viewNoteSession?.notes || 'Not bulunmuyor.'}</div>
                 <div className="text-right text-xs text-gray-400">{viewNoteSession?.fee ? `Seans Ücreti: ${formatCurrency(viewNoteSession.fee)}` : ''}</div>
                 <div className="flex gap-2">
                     <Button variant="secondary" onClick={() => {
                        try {
                            const doc = new jsPDF();
                            doc.text(`Tarih: ${formatDate(viewNoteSession!.date)}`, 14, 20);
                            doc.text(`Danışan: ${client.name}`, 14, 30);
                            const splitText = doc.splitTextToSize(viewNoteSession!.notes || '', 180);
                            doc.text(splitText, 14, 40);
                            doc.save('gorusme_notu.pdf');
                        } catch (e:any) {
                            alert("PDF oluşturulamadı: " + e.message);
                        }
                     }} icon={<Printer size={16} />}>PDF İndir</Button>
                     <Button onClick={() => setViewNoteSession(null)} className="flex-1">Kapat</Button>
                 </div>
             </div>
         </Modal>
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

  // Generate Monthly Income Data for Chart (Last 6 months)
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

      {/* Time Filter Tabs */}
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
              <BarChartComponent data={incomeData} labels={incomeLabels} colorClass="bg-blue-500" height="h-48" />
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

const SettingsPage: React.FC<{
  user: User;
  setUser: (u: User) => void;
  themeConfig: ThemeConfig;
  setThemeName: (name: string) => void;
  colorMode: 'light' | 'dark' | 'system';
  setColorMode: (mode: 'light' | 'dark' | 'system') => void;
  isAccountingEnabled: boolean;
  toggleAccounting: () => void;
  supabase: SupabaseClient;
  templates: NoteTemplate[];
  addTemplate: (t: NoteTemplate) => void;
  updateTemplate: (t: NoteTemplate) => void;
  deleteTemplate: (id: string) => void;
}> = ({ user, setUser, themeConfig, setThemeName, colorMode, setColorMode, isAccountingEnabled, toggleAccounting, supabase, templates, addTemplate, updateTemplate, deleteTemplate }) => {
    const [tempUser, setTempUser] = useState(user);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [notification, setNotification] = useState('');
    
    // Password Change State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Template Modal State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState<{label: string, content: string}>({label:'', content:''});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setTempUser(prev => ({ ...prev, avatar: reader.result as string })); };
            reader.readAsDataURL(file);
        }
    };
    const handleSaveProfile = async () => {
        setUser(tempUser);
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) {
             setNotification('Hata: Oturum bilgisi bulunamadı.');
             return;
        }

        let dbDarkMode: boolean | null = null;
        if (colorMode === 'dark') dbDarkMode = true;
        else if (colorMode === 'light') dbDarkMode = false;

        const { error } = await supabase.from('user_settings').upsert({
            user_id: u.id,
            full_name: tempUser.fullName,
            avatar: tempUser.avatar,
            theme: localStorage.getItem('theme'),
            dark_mode: dbDarkMode,
            accounting_enabled: isAccountingEnabled
        }, { onConflict: 'user_id' });

        if (error) setNotification('Hata: Profil kaydedilemedi.'); else setNotification('Profil başarıyla güncellendi!');
        setTimeout(() => setNotification(''), 3000);
    };

    const handlePasswordChange = async () => {
        if (newPassword.length < 6) { setNotification('Hata: Şifre en az 6 karakter olmalıdır.'); return; }
        if (newPassword !== confirmPassword) { setNotification('Hata: Şifreler eşleşmiyor.'); return; }
        
        const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
        
        if (error) setNotification('Hata: ' + error.message);
        else { 
            setNotification('Şifre başarıyla değiştirildi.');
            setNewPassword('');
            setConfirmPassword('');
        }
        setTimeout(() => setNotification(''), 3000);
    }

    // Template Handlers
    const openTemplateModal = (tpl?: NoteTemplate) => {
        if (tpl) {
            setSelectedTemplate(tpl);
            setTemplateForm({label: tpl.label, content: tpl.content});
        } else {
            setSelectedTemplate(null);
            setTemplateForm({label: '', content: ''});
        }
        setIsTemplateModalOpen(true);
    }

    const saveTemplate = () => {
        if (!templateForm.label || !templateForm.content) return;
        
        if (selectedTemplate) {
            updateTemplate({...selectedTemplate, label: templateForm.label, content: templateForm.content});
        } else {
            addTemplate({id: generateId(), label: templateForm.label, content: templateForm.content});
        }
        setIsTemplateModalOpen(false);
    }

    const loadDefaultTemplates = () => {
        DEFAULT_NOTE_TEMPLATES.forEach(tpl => {
            addTemplate({id: generateId(), label: tpl.label, content: tpl.content});
        });
        setNotification('Varsayılan şablonlar eklendi.');
        setTimeout(() => setNotification(''), 3000);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-0 animate-[fadeIn_0.3s_ease-out]">
            <div><h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ayarlar</h2><p className="text-gray-500 dark:text-gray-400">Profil ve görünüm ayarlarını yönetin</p></div>
            {notification && <div className={`p-4 rounded-xl flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] ${notification.startsWith('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}><CheckCircle2 size={20} /> {notification}</div>}
            
            <Card className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4"><UserIcon size={20} className={themeConfig.accentClass} /> Profil Ayarları</h3>
                <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white overflow-hidden text-3xl ${themeConfig.primaryClass}`}>{tempUser.avatar ? <img src={tempUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : (tempUser.fullName || tempUser.username).substring(0,2).toUpperCase()}</div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} className="text-white" /></div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profil fotoğrafını değiştirmek için tıklayın</p>
                </div>
                <div className="space-y-4"><Input label="Ad Soyad" value={tempUser.fullName || ''} onChange={e => setTempUser({...tempUser, fullName: e.target.value})} className="text-gray-900" /><Button onClick={handleSaveProfile} activeTheme={themeConfig} className="w-full">Değişiklikleri Kaydet</Button></div>
            </Card>

            <Card className="space-y-6">
                 <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><StickyNote size={20} className={themeConfig.accentClass} /> Not Şablonları</h3>
                     <Button size="sm" onClick={() => openTemplateModal()} icon={<Plus size={16}/>}>Yeni Şablon</Button>
                 </div>
                 
                 <div className="space-y-3">
                     {templates.length > 0 ? templates.map(tpl => (
                         <div key={tpl.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl group">
                             <div className="font-medium text-gray-900 dark:text-white">{tpl.label}</div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => openTemplateModal(tpl)} className="p-2 text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                                 <button onClick={() => deleteTemplate(tpl.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                             </div>
                         </div>
                     )) : (
                         <div className="text-center py-4 text-gray-500 text-sm">
                             Henüz şablon yok. <button onClick={loadDefaultTemplates} className="text-blue-600 hover:underline">Varsayılanları Yükle</button>
                         </div>
                     )}
                 </div>
            </Card>

            <Card className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4"><Lock size={20} className={themeConfig.accentClass} /> Güvenlik</h3>
                <div className="space-y-4">
                    <Input type="password" label="Yeni Şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="text-gray-900" placeholder="••••••" />
                    <Input type="password" label="Yeni Şifre (Tekrar)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="text-gray-900" placeholder="••••••" />
                    <Button onClick={handlePasswordChange} variant="secondary" className="w-full">Şifreyi Güncelle</Button>
                </div>
            </Card>

            <Card className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4"><Settings size={20} className={themeConfig.accentClass} /> Sistem Ayarları</h3>
                <div className="flex items-center justify-between"><div><p className="font-medium text-gray-900 dark:text-white">Muhasebe Modülü</p><p className="text-sm text-gray-500 dark:text-gray-400">Finansal takip, bakiye ve ücret özelliklerini aç/kapat</p></div><button onClick={toggleAccounting} className={`text-gray-400 hover:text-blue-500 transition-colors ${isAccountingEnabled ? 'text-blue-600 dark:text-blue-400' : ''}`}>{isAccountingEnabled ? <ToggleRight size={48} strokeWidth={1.5} /> : <ToggleLeft size={48} strokeWidth={1.5} />}</button></div>
            </Card>
            <Card className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4"><Sun size={20} className={themeConfig.accentClass} /> Görünüm</h3>
                
                <div className="space-y-3">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Mod Seçimi</p>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setColorMode('light')} 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${colorMode === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            <Sun size={16} /> Aydınlık
                        </button>
                        <button 
                            onClick={() => setColorMode('dark')} 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${colorMode === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            <Moon size={16} /> Karanlık
                        </button>
                        <button 
                            onClick={() => setColorMode('system')} 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${colorMode === 'system' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            <Laptop size={16} /> Sistem
                        </button>
                    </div>
                </div>

                <div><p className="font-medium text-gray-700 dark:text-gray-300 mb-3">Tema Rengi</p><div className="flex flex-wrap gap-3 justify-center sm:justify-start">{THEMES.map(t => (<button key={t.name} onClick={() => setThemeName(t.name)} className={`w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${t.primaryClass} ${themeConfig.name === t.name ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-slate-700' : ''}`} title={t.label}>{themeConfig.name === t.name && <CheckCircle2 size={16} className="text-white" />}</button>))}</div></div>
            </Card>
            <div className="text-center pb-8 opacity-40 hover:opacity-100 transition-opacity">
               <p className="text-xs font-mono text-gray-400 dark:text-gray-600">TeraPlan v0.2</p>
            </div>

            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={selectedTemplate ? "Şablonu Düzenle" : "Yeni Şablon"}>
                <div className="space-y-4">
                    <Input label="Şablon Adı" value={templateForm.label} onChange={e => setTemplateForm({...templateForm, label: e.target.value})} className="text-gray-900" placeholder="Örn: İlk Görüşme" />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">İçerik</label>
                        <textarea 
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 min-h-[200px] text-gray-900 dark:text-white resize-none" 
                            value={templateForm.content} 
                            onChange={e => setTemplateForm({...templateForm, content: e.target.value})} 
                            placeholder="Şablon içeriğini buraya girin..." 
                        />
                    </div>
                    <Button onClick={saveTemplate} className="w-full">Kaydet</Button>
                </div>
            </Modal>
        </div>
    );
}

const App: React.FC = () => {
    // Hardcoded Supabase Credentials
    const SUPABASE_URL = 'https://wesyhmkxxgybqndavjcy.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_KX0Jp67HyB07nLMOyrIpNg_0YTxPZaQ';

    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [templates, setTemplates] = useState<NoteTemplate[]>([]);
    const [anamnesisCache, setAnamnesisCache] = useState<Record<string, Anamnesis>>({});
    const [themeName, setThemeName] = useState('ocean');
    
    // Color Mode State: 'light' | 'dark' | 'system'
    const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>(() => {
        const stored = localStorage.getItem('colorMode');
        return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    });

    const [isAccountingEnabled, setIsAccountingEnabled] = useState(true);

    const themeConfig = THEMES.find(t => t.name === themeName) || THEMES[0];

    useEffect(() => {
        try {
            const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
            setSupabase(sb);
        } catch (e) {
            console.error("Supabase init failed", e);
        }
    }, []);

    useEffect(() => {
        if (!supabase) return;

        const fetchData = async (userId: string) => {
            setIsLoading(true);
            const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
            if (settings) {
                if (settings.theme) setThemeName(settings.theme);
                if (settings.dark_mode === null) setColorMode('system');
                else if (settings.dark_mode === true) setColorMode('dark');
                else setColorMode('light');

                if (settings.accounting_enabled !== null) setIsAccountingEnabled(settings.accounting_enabled);
                setUser(prev => prev ? { ...prev, fullName: settings.full_name, avatar: settings.avatar } : null);
            }
            const { data: c } = await supabase.from('clients').select('*');
            if(c) setClients(c.map((x:any) => ({
                id: x.id, 
                name: x.name, 
                phone: x.phone, 
                email: x.email, 
                notes: x.notes, 
                createdAt: x.created_at, 
                defaultFee: parseFloat(x.default_fee), 
                balance: parseFloat(x.balance),
                isActive: x.is_active !== false
            })));
            const { data: g } = await supabase.from('groups').select('*');
            if(g) setGroups(g.map((x:any) => ({
                id: x.id, 
                name: x.name, 
                clientIds: x.client_ids || [], 
                createdAt: x.created_at, 
                defaultFee: parseFloat(x.default_fee),
                isActive: x.is_active !== false
            })));
            const { data: s } = await supabase.from('sessions').select('*');
            if(s) setSessions(s.map((x:any) => ({
                id: x.id,
                type: x.type,
                clientId: x.client_id,
                group_id: x.group_id,
                groupId: x.group_id,
                title: x.title,
                date: x.date,
                durationMinutes: x.duration_minutes,
                status: x.status,
                notes: x.notes,
                fee: parseFloat(x.fee)
            })));
            const { data: t } = await supabase.from('transactions').select('*');
            if(t) setTransactions(t.map((x:any) => ({
                id: x.id,
                clientId: x.client_id,
                amount: parseFloat(x.amount),
                type: x.type,
                date: x.date,
                description: x.description,
                relatedSessionId: x.related_session_id
            })));
            const { data: e } = await supabase.from('expenses').select('*');
            if(e) setExpenses(e.map((x:any) => ({
                id: x.id,
                amount: parseFloat(x.amount),
                date: x.date,
                description: x.description,
                category: x.category
            })));
            const { data: d } = await supabase.from('documents').select('*');
            if(d) setDocuments(d.map((x:any) => ({
                id: x.id,
                clientId: x.client_id,
                name: x.name,
                url: x.url,
                type: x.type,
                size: parseFloat(x.size),
                createdAt: x.created_at
            })));
            const { data: tpl } = await supabase.from('note_templates').select('*');
            if(tpl) setTemplates(tpl.map((x:any) => ({ id: x.id, label: x.label, content: x.content })));

            // Fetch Anamnesis
            const { data: ana } = await supabase.from('anamnesis').select('*');
            if (ana) {
                const cache: Record<string, Anamnesis> = {};
                ana.forEach((a: any) => {
                    cache[a.client_id] = {
                        clientId: a.client_id,
                        presentingProblem: a.presenting_problem || '',
                        familyHistory: a.family_history || '',
                        medicalHistory: a.medical_history || '',
                        educationHistory: a.education_history || '',
                        socialHistory: a.social_history || '',
                        traumaHistory: a.trauma_history || '',
                        updatedAt: a.updated_at
                    };
                });
                setAnamnesisCache(cache);
            }

            setIsLoading(false);
        };

        (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
            if (session?.user) {
                setUser({ username: session.user.email || '', isAuthenticated: true });
                fetchData(session.user.id);
            }
        });

        const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                setUser({ username: session.user.email || '', isAuthenticated: true });
                fetchData(session.user.id);
            } else {
                setUser(null); setClients([]); setGroups([]); setSessions([]); setTransactions([]); setExpenses([]); setDocuments([]); setTemplates([]); setAnamnesisCache({});
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => { document.documentElement.style.setProperty('--color-primary', themeConfig.primaryClass); }, [themeName, themeConfig]);
    
    // Apply Color Mode
    useEffect(() => {
        const root = document.documentElement;
        localStorage.setItem('colorMode', colorMode);

        if (colorMode === 'dark') {
            root.classList.add('dark');
        } else if (colorMode === 'light') {
            root.classList.remove('dark');
        } else {
            // System
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.matches) root.classList.add('dark');
            else root.classList.remove('dark');

            const handler = (e: MediaQueryListEvent) => {
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [colorMode]);

    // CRUD Ops
    const addClient = async (client: Client) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        
        const newClient = { 
            id: client.id, 
            user_id: u.id, 
            name: client.name, 
            phone: client.phone, 
            email: client.email, 
            notes: client.notes, 
            created_at: client.createdAt, 
            default_fee: client.defaultFee, 
            balance: client.balance,
            is_active: true
        };
        const { error } = await supabase.from('clients').insert(newClient);
        if (!error) setClients([...clients, client]); else console.error(error);
    };

    const updateClient = async (updated: Client) => {
        if (!supabase) return;
        const { error } = await supabase.from('clients').update({
            name: updated.name,
            phone: updated.phone,
            email: updated.email,
            default_fee: updated.defaultFee,
            notes: updated.notes,
            is_active: updated.isActive
        }).eq('id', updated.id);

        if(!error) setClients(clients.map(c => c.id === updated.id ? updated : c));
    };

    const toggleClientStatus = async (client: Client) => {
        await updateClient({...client, isActive: !client.isActive});
    }

    const deleteClient = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) { setClients(clients.filter(c => c.id !== id)); setGroups(groups.map(g => ({ ...g, clientIds: g.clientIds.filter(cid => cid !== id) }))); setSessions(sessions.filter(s => s.clientId !== id)); }
    };

    const addGroup = async (group: Group) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        const newGroup = { id: group.id, user_id: u.id, name: group.name, client_ids: group.clientIds, created_at: group.createdAt, default_fee: group.defaultFee, is_active: true };
        const { error } = await supabase.from('groups').insert(newGroup);
        if (!error) setGroups([...groups, group]); else console.error(error);
    };
    
    const updateGroup = async (updated: Group) => {
        if (!supabase) return;
        const { error } = await supabase.from('groups').update({
            name: updated.name,
            client_ids: updated.clientIds,
            is_active: updated.isActive
        }).eq('id', updated.id);
        if(!error) setGroups(groups.map(g => g.id === updated.id ? updated : g));
    };

    const toggleGroupStatus = async (group: Group) => {
        await updateGroup({...group, isActive: !group.isActive});
    };

    const deleteGroup = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('groups').delete().eq('id', id);
        if(!error) { setGroups(groups.filter(g => g.id !== id)); setSessions(sessions.filter(s => s.groupId !== id)); }
    };
    const addSession = async (session: Session) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        const newSession = { id: session.id, user_id: u.id, type: session.type, client_id: session.clientId, group_id: session.groupId, title: session.title, date: session.date, duration_minutes: session.durationMinutes, status: session.status, fee: session.fee };
        const { error } = await supabase.from('sessions').insert(newSession);
        if(!error) setSessions(prev => [...prev, session]); else console.error(error);
    };
    const updateSession = async (updated: Session) => {
        if (!supabase) return;
        const { error } = await supabase.from('sessions').update({ status: updated.status, notes: updated.notes, fee: updated.fee }).eq('id', updated.id);
        if(!error) setSessions(sessions.map(s => s.id === updated.id ? updated : s));
    };
    const deleteSession = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if(!error) setSessions(sessions.filter(s => s.id !== id));
    };
    const addTransaction = async (transaction: Transaction) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        const newTx = { id: transaction.id, user_id: u.id, client_id: transaction.clientId, amount: transaction.amount, type: transaction.type, date: transaction.date, description: transaction.description, related_session_id: transaction.relatedSessionId };
        const { error } = await supabase.from('transactions').insert(newTx);
        if(!error) {
            setTransactions([...transactions, transaction]);
            const client = clients.find(c => c.id === transaction.clientId);
            if(client) {
                const change = transaction.type === 'charge' ? transaction.amount : -transaction.amount;
                const newBalance = (client.balance || 0) + change;
                await supabase.from('clients').update({ balance: newBalance }).eq('id', client.id);
                setClients(clients.map(c => c.id === client.id ? { ...c, balance: newBalance } : c));
            }
        } else console.error(error);
    };
    const deleteTransaction = async (id: string, clientId: string, amount: number, type: 'charge' | 'payment') => {
        if (!supabase) return;
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(transactions.filter(t => t.id !== id));
            const client = clients.find(c => c.id === clientId);
            if(client) {
                const change = type === 'charge' ? -amount : amount; // Reverse the effect
                const newBalance = (client.balance || 0) + change;
                await supabase.from('clients').update({ balance: newBalance }).eq('id', client.id);
                setClients(clients.map(c => c.id === client.id ? { ...c, balance: newBalance } : c));
            }
        }
    };
    const addExpense = async (expense: Expense) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        const newExp = { id: expense.id, user_id: u.id, amount: expense.amount, date: expense.date, description: expense.description, category: expense.category };
        const { error } = await supabase.from('expenses').insert(newExp);
        if(!error) setExpenses([...expenses, expense]); else console.error(error);
    };
    const deleteExpense = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if(!error) setExpenses(expenses.filter(e => e.id !== id));
    };

    const uploadDocument = async (file: File, clientId: string) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;

        try {
            const fileName = `${u.id}/${generateId()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
            
            if (uploadError) {
                if (uploadError.message.includes("bucket not found")) {
                    alert("Hata: Supabase panelinde 'documents' adında bir public bucket oluşturmalısınız.");
                } else {
                    alert("Dosya yükleme hatası: " + uploadError.message);
                }
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);

            const newDoc = {
                id: generateId(),
                user_id: u.id,
                client_id: clientId,
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
                created_at: Date.now()
            };

            const { error: dbError } = await supabase.from('documents').insert(newDoc);
            
            if (!dbError) {
                setDocuments([...documents, { ...newDoc, clientId: clientId, size: newDoc.size, createdAt: newDoc.created_at } as any]);
            }
        } catch (e) {
            console.error("Upload process failed", e);
        }
    };

    const deleteDocument = async (id: string, fileName: string) => {
        if (!supabase) return;
        // In a real app we'd also delete from storage, but for simplicity just DB row here
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if(!error) setDocuments(documents.filter(d => d.id !== id));
    };

    const addTemplate = async (template: NoteTemplate) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        const { error } = await supabase.from('note_templates').insert({
            id: template.id,
            user_id: u.id,
            label: template.label,
            content: template.content,
            created_at: Date.now()
        });
        if(!error) setTemplates([...templates, template]);
    }

    const updateTemplate = async (template: NoteTemplate) => {
        if (!supabase) return;
        const { error } = await supabase.from('note_templates').update({
            label: template.label,
            content: template.content
        }).eq('id', template.id);
        if(!error) setTemplates(templates.map(t => t.id === template.id ? template : t));
    }

    const deleteTemplate = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('note_templates').delete().eq('id', id);
        if(!error) setTemplates(templates.filter(t => t.id !== id));
    }

    const saveAnamnesis = async (anamnesis: Anamnesis) => {
        if (!supabase) return;
        const { data: { user: u } } = await (supabase.auth as any).getUser();
        if (!u) return;
        
        const payload = {
            client_id: anamnesis.clientId,
            user_id: u.id,
            presenting_problem: anamnesis.presentingProblem,
            family_history: anamnesis.familyHistory,
            medical_history: anamnesis.medicalHistory,
            education_history: anamnesis.educationHistory,
            social_history: anamnesis.socialHistory,
            trauma_history: anamnesis.traumaHistory,
            updated_at: Date.now()
        };

        const { error } = await supabase.from('anamnesis').upsert(payload, { onConflict: 'client_id' });
        
        if (!error) {
            setAnamnesisCache(prev => ({...prev, [anamnesis.clientId]: anamnesis}));
            alert('Anamnez formu kaydedildi.');
        } else {
            console.error(error);
            if (error.code === 'PGRST204' || error.message.includes('anamnesis')) {
                alert('Hata: "anamnesis" tablosu bulunamadı. Lütfen SQL Editor\'den tabloyu oluşturun.');
            } else {
                alert('Kaydedilirken hata oluştu: ' + error.message);
            }
        }
    }

    const getAnamnesis = (clientId: string) => {
        return anamnesisCache[clientId];
    }

    const handleSessionCompletion = async (session: Session, note: string) => {
        let finalFee = session.fee || 0;
        if (finalFee === 0) {
            if (session.type === 'individual' && session.clientId) {
                const c = clients.find(cl => cl.id === session.clientId); if (c && c.defaultFee) finalFee = c.defaultFee;
            } else if (session.type === 'group' && session.groupId) {
                const g = groups.find(gr => gr.id === session.groupId); if (g && g.defaultFee) finalFee = g.defaultFee;
            }
        }
        const updatedSession = { ...session, status: 'completed' as const, notes: note, fee: finalFee };
        await updateSession(updatedSession);
        if (isAccountingEnabled && finalFee > 0) {
            if (session.type === 'individual' && session.clientId) {
                await addTransaction({ id: generateId(), clientId: session.clientId, amount: finalFee, type: 'charge', date: Date.now(), description: `Görüşme Ücreti - ${formatDate(session.date)}`, relatedSessionId: session.id });
            } else if (session.type === 'group' && session.groupId) {
                const group = groups.find(g => g.id === session.groupId);
                if (group) { for (const clientId of group.clientIds) { await addTransaction({ id: generateId(), clientId: clientId, amount: finalFee, type: 'charge', date: Date.now(), description: `Grup Terapisi - ${group.name} - ${formatDate(session.date)}`, relatedSessionId: session.id }); } }
            }
        }
    };

    if (!supabase) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Bağlanıyor...</div>;
    if (!user || !user.isAuthenticated) return <Auth supabase={supabase} />;
    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950"><div className="text-center"><Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-500">Veriler yükleniyor...</p></div></div>;

    return (
        <MemoryRouter>
        <Layout user={user} onLogout={async () => { await (supabase.auth as any).signOut(); setUser(null); }} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled}>
            <Routes>
            <Route path="/" element={<HomePage clients={clients} sessions={sessions} groups={groups} themeConfig={themeConfig} updateSession={updateSession} addSession={addSession} handleSessionCompletion={handleSessionCompletion} deleteSession={deleteSession} user={user} isAccountingEnabled={isAccountingEnabled} templates={templates} />} />
            <Route path="/calendar" element={<CalendarPage sessions={sessions} clients={clients} groups={groups} addSession={addSession} updateSession={updateSession} deleteSession={deleteSession} handleSessionCompletion={handleSessionCompletion} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled} templates={templates} />} />
            <Route path="/clients" element={<ClientsPage clients={clients} sessions={sessions} groups={groups} addClient={addClient} updateClient={updateClient} deleteClient={deleteClient} toggleClientStatus={toggleClientStatus} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled} />} />
            <Route path="/clients/:id" element={<ClientProfilePage clients={clients} sessions={sessions} groups={groups} transactions={transactions} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled} documents={documents} uploadDocument={uploadDocument} deleteDocument={deleteDocument} saveAnamnesis={saveAnamnesis} getAnamnesis={getAnamnesis} />} />
            <Route path="/groups" element={<GroupsPage groups={groups} clients={clients} sessions={sessions} addGroup={addGroup} updateGroup={updateGroup} deleteGroup={deleteGroup} toggleGroupStatus={toggleGroupStatus} themeConfig={themeConfig} isAccountingEnabled={isAccountingEnabled} />} />
            <Route path="/accounting" element={isAccountingEnabled ? (<AccountingPage clients={clients} transactions={transactions} expenses={expenses} addTransaction={addTransaction} deleteTransaction={deleteTransaction} addExpense={addExpense} deleteExpense={deleteExpense} themeConfig={themeConfig} />) : <Navigate to="/" />} />
            <Route path="/settings" element={<SettingsPage user={user} setUser={setUser} themeConfig={themeConfig} setThemeName={(name) => { setThemeName(name); (supabase.auth as any).getUser().then(({data}:any) => { if(data?.user) supabase.from('user_settings').upsert({ user_id: data.user.id, theme: name }, { onConflict: 'user_id' }).then(); }); }} colorMode={colorMode} setColorMode={setColorMode} isAccountingEnabled={isAccountingEnabled} toggleAccounting={() => setIsAccountingEnabled(!isAccountingEnabled)} supabase={supabase} templates={templates} addTemplate={addTemplate} updateTemplate={updateTemplate} deleteTemplate={deleteTemplate} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
        </MemoryRouter>
    );
};

export default App;