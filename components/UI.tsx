
import React, { useState, useRef, useEffect } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  activeTheme?: any;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  icon,
  activeTheme,
  ...props 
}) => {
  let baseStyles = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  let sizeStyles = "px-6 py-3 text-base";
  if (size === 'sm') sizeStyles = "px-3 py-1.5 text-xs";
  if (size === 'lg') sizeStyles = "px-8 py-4 text-lg";

  let variantStyles = "";
  if (variant === 'primary') {
    variantStyles = `${activeTheme?.primaryClass || 'bg-blue-600'} text-white shadow-lg shadow-black/5 hover:brightness-110`;
  } else if (variant === 'secondary') {
    variantStyles = `${activeTheme?.secondaryClass || 'bg-blue-100'} ${activeTheme?.accentClass || 'text-blue-700'} hover:bg-opacity-80`;
  } else if (variant === 'ghost') {
    variantStyles = "bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300";
  } else if (variant === 'danger') {
    variantStyles = "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <button className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {icon && <span className={size === 'sm' ? "w-4 h-4" : "w-5 h-5"}>{icon}</span>}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 ${className}`} {...props}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">{label}</label>}
    <input 
      className={`px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-gray-900 dark:text-white ${className}`} 
      {...props} 
    />
  </div>
);

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, label, placeholder = 'Seçiniz', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={wrapperRef}>
       {label && <label className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">{label}</label>}
       
       <div 
         className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 cursor-pointer flex justify-between items-center"
         onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
       >
          <span className={`${!selectedOption ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
             {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
       </div>

       {isOpen && (
         <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-60 flex flex-col">
            <div className="p-2 border-b border-gray-100 dark:border-slate-800">
               <input 
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none text-sm"
                  placeholder="Ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
               />
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
               {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => (
                   <div 
                     key={opt.value}
                     className={`px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 text-sm ${opt.value === value ? 'text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                     onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                     }}
                   >
                     {opt.label}
                   </div>
                 ))
               ) : (
                 <div className="p-4 text-center text-gray-500 text-sm">Sonuç bulunamadı</div>
               )}
            </div>
         </div>
       )}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; headerAction?: React.ReactNode }> = ({ isOpen, onClose, title, children, headerAction }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay: fixed position to cover viewport, remove blur, increased opacity */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Fixed Header Section */}
        <div className="flex items-center justify-between p-8 pb-4 shrink-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <div className="flex items-center gap-2">
            {headerAction}
            <button 
                onClick={onClose} 
                className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white -mr-2"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6 18 18"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="p-8 pt-2 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
