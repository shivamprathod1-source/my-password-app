/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldAlert, 
  Sun, 
  Moon, 
  Sparkles, 
  Search, 
  Database, 
  Wrench, 
  Settings, 
  ChevronRight, 
  ShieldCheck, 
  History, 
  X, 
  PlusSquare, 
  Save,
  Copy
} from 'lucide-react';
import { 
  calculateStrength, 
  generatePassword, 
  calculateVisualStrength,
  estimateCrackTime 
} from './utils/password';
import { HistoryItem, UserPreferences } from './types';

export default function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    autoCheck: true,
    darkMode: false,
    notifications: true,
    hardenedMode: false,
    lastSynced: null
  });
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isSavedToVault, setIsSavedToVault] = useState(false);
  const [isAuditHistoryOpen, setIsAuditHistoryOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [visiblePassIds, setVisiblePassIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [crackTimeDisplay, setCrackTimeDisplay] = useState('—');
  const [visualStrength, setVisualStrength] = useState({ percentage: 0, color: '#e5e7eb' });
  const [auditHistory, setAuditHistory] = useState<HistoryItem[]>([]);
  const [vaultHistory, setVaultHistory] = useState<HistoryItem[]>([]);

  // Load preferences and history on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('fortress_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(parsed);
        if (parsed.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.error('Failed to parse preferences', e);
      }
    } else {
      // Fallback to theme-only retrieval for legacy
      const savedTheme = localStorage.getItem('fortress_theme');
      const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setPreferences(prev => ({ ...prev, darkMode: isDark }));
      if (isDark) document.documentElement.classList.add('dark');
    }
  }, []); // Fix missing close brace/deps

  // Sync preferences to storage
  const syncPreferences = (newPrefs: UserPreferences) => {
    setIsSyncing(true);
    const updated = { ...newPrefs, lastSynced: new Date().toISOString() };
    
    // Simulate remote database delay
    setTimeout(() => {
      setPreferences(updated);
      localStorage.setItem('fortress_preferences', JSON.stringify(updated));
      localStorage.setItem('fortress_theme', updated.darkMode ? 'dark' : 'light');
      setIsSyncing(false);
    }, 800);
  };

  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  const analysis = useMemo(() => calculateStrength(password, preferences.hardenedMode), [password, preferences.hardenedMode]);

  // Update visual strength and crack time immediately on password change
  useEffect(() => {
    const visual = calculateVisualStrength(password, preferences.hardenedMode);
    const time = estimateCrackTime(password);
    
    setVisualStrength(visual);
    setCrackTimeDisplay(password ? time : '—');
  }, [password, preferences.hardenedMode]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('audit_logs');
    const savedVault = localStorage.getItem('fortress_vault');
    if (savedHistory) {
      try {
        setAuditHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse audit history', e);
      }
    }
    if (savedVault) {
      try {
        setVaultHistory(JSON.parse(savedVault));
      } catch (e) {
        console.error('Failed to parse vault history', e);
      }
    }
  }, []);

  // Save to history when analysis changes (debounced)
  useEffect(() => {
    if (!password || !preferences.autoCheck) return;

    const timer = setTimeout(() => {
      setAuditHistory(prev => {
        // Prevent duplicate consecutive entries for the same password
        if (prev[0]?.password === password) return prev;

        const newEntry: HistoryItem = {
          id: crypto.randomUUID(),
          password: password, // In a real app, we might hash this or just store metadata
          bits: analysis.entropy,
          strength: analysis.label,
          timestamp: new Date().toISOString()
        };

        const updated = [newEntry, ...prev].slice(0, 30);
        localStorage.setItem('audit_logs', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [password, analysis.entropy, analysis.label]);

  const onGenerate = () => {
    const newPass = generatePassword(16);
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleClearAll = () => {
    if (window.confirm("Kya aap yakin hain ki saari history delete karna chahte hain?")) {
      setAuditHistory([]);
      localStorage.removeItem('audit_logs');
      // If notifications were implemented, we could notify here
    }
  };

  const criteria = [
    { label: 'Length', met: password.length >= 12, desc: 'At least 12 characters' },
    { label: 'Uppercase', met: /[A-Z]/.test(password), desc: 'Includes A-Z' },
    { label: 'Lowercase', met: /[a-z]/.test(password), desc: 'Includes a-z' },
    { label: 'Numbers', met: /[0-9]/.test(password), desc: 'Includes 0-9' },
    { label: 'Symbols', met: /[^A-Za-z0-9]/.test(password), desc: 'Includes !@#$%^&*' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1F2937] rounded-[12px] p-6 shadow-2xl relative transition-all">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => syncPreferences({ ...preferences, darkMode: !preferences.darkMode })}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            {preferences.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Header */}
        <header className="text-left mb-8">
          <div className="mb-4 text-[#9CA3AF]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-[1.5rem] font-semibold text-[#1E293B] dark:text-white mb-1">
            Check Security
          </h2>
          <p className="text-[1rem] text-[#64748B] dark:text-[#D1D5DB]">
            Measure the resilience of your password.
          </p>
        </header>

        <main className="space-y-6">
          {/* Input Section */}
          <div className="relative flex items-center group">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password..."
                className="w-full h-[48px] bg-[#F1F5F9] dark:bg-[#374151] rounded-lg px-4 pr-28 text-[16px] text-[#1E293B] dark:text-white transition-all focus:outline-none placeholder:text-[#94A3B8] dark:placeholder:text-[#9CA3AF]"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-[#94A3B8] dark:text-[#9CA3AF] hover:text-[#4F46E5] dark:hover:text-white transition-colors"
                  title={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                  className={`p-2 transition-colors ${isAiMenuOpen ? 'text-[#4F46E5]' : 'text-[#94A3B8] dark:text-[#9CA3AF] hover:text-[#4F46E5] dark:hover:text-white'}`}
                  title="AI Security Tools"
                >
                  <Sparkles size={18} />
                </button>
              </div>

              {/* AI Context Menu */}
              <AnimatePresence>
                {isAiMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsAiMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 350, 
                        damping: 25,
                        mass: 0.8
                      }}
                      style={{ originY: 1 }}
                      className="absolute bottom-full left-0 right-0 mb-4 z-20 bg-[#1E293B] border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden p-2"
                    >
                      <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                          show: {
                            transition: {
                              staggerChildren: 0.03
                            }
                          }
                        }}
                        className="space-y-1"
                      >
                        {[
                          { icon: <Search size={16} />, label: "Scan for Common Passwords", color: "indigo" },
                          { icon: <Database size={16} />, label: "Check Pwned Database", color: "indigo" },
                        ].map((btn, idx) => (
                          <motion.button 
                            key={idx}
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#D1D5DB] transition-colors text-left group"
                          >
                            <div className={`text-[#9CA3AF] group-hover:text-${btn.color}-400 transition-colors`}>
                              {btn.icon}
                            </div>
                            <span className="text-[13px] font-medium">{btn.label}</span>
                          </motion.button>
                        ))}
                        
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, scaleX: 0 },
                            show: { opacity: 1, scaleX: 1 }
                          }}
                          className="h-px bg-zinc-700/50 my-1 mx-2 origin-left" 
                        />
                        
                        <div className="grid grid-cols-2 gap-1 p-1">
                          <motion.button 
                            variants={{
                              hidden: { opacity: 0, y: 5 },
                              show: { opacity: 1, y: 0 }
                            }}
                            onClick={() => {
                              setIsToolsModalOpen(true);
                              setIsAiMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#D1D5DB] transition-colors text-left group"
                          >
                            <Wrench size={16} className="text-indigo-400" />
                            <span className="text-[12px] font-bold text-indigo-400">+ Tools</span>
                          </motion.button>

                          <motion.button 
                            variants={{
                              hidden: { opacity: 0, y: 5 },
                              show: { opacity: 1, y: 0 }
                            }}
                            onClick={() => {
                              if (!password) return;
                              const newEntry: HistoryItem = {
                                id: crypto.randomUUID(),
                                password: password,
                                bits: analysis.entropy,
                                strength: analysis.label,
                                timestamp: new Date().toISOString()
                              };
                              setVaultHistory(prev => {
                                const updated = [newEntry, ...prev].slice(0, 50);
                                localStorage.setItem('fortress_vault', JSON.stringify(updated));
                                return updated;
                              });
                              setIsSavedToVault(true);
                              setTimeout(() => setIsSavedToVault(false), 2000);
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#D1D5DB] transition-colors text-left group"
                          >
                            <Save size={16} className={isSavedToVault ? "text-emerald-400" : "text-emerald-500/80"} />
                            <span className={`text-[12px] font-bold transition-colors ${isSavedToVault ? "text-emerald-400" : "text-emerald-500/80"}`}>
                              {isSavedToVault ? "Saved!" : "Copy to Vault"}
                            </span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
          </div>

          {/* Analysis Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-widest mb-1">Strength</span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${analysis.color}`} />
                <span className={`text-[14px] font-bold ${
                  analysis.label === 'Excellent' ? 'text-emerald-500' :
                  analysis.label === 'Strong' ? 'text-blue-500' :
                  analysis.label === 'Fair' ? 'text-yellow-500' :
                  analysis.label === 'Too Weak' ? 'text-zinc-300 dark:text-zinc-500' :
                  'text-orange-500'
                }`}>
                  {analysis.label}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-widest mb-1">Time to Crack</span>
              <span className="text-[14px] font-bold text-[#1E293B] dark:text-white">
                {crackTimeDisplay}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-[#F1F5F9] dark:bg-[#374151] rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ 
                width: `${visualStrength.percentage}%`,
                backgroundColor: visualStrength.color
              }}
              className="h-full rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Checklist */}
          <div className="text-left space-y-3 pt-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-[#9CA3AF]">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: c.met ? [1, 1.2, 1] : 1,
                      backgroundColor: c.met ? '#10B981' : 'transparent',
                      borderColor: c.met ? '#10B981' : '#6B7280',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0 rounded-full border flex items-center justify-center ${
                      c.met ? 'border-[#10B981]' : 'border-[#6B7280]'
                    }`}
                  >
                    <AnimatePresence>
                      {c.met && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={4} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <span className={`transition-colors duration-300 ${c.met ? 'text-emerald-600 dark:text-[#A7F3D0] font-medium' : 'text-[#64748B] dark:text-[#9CA3AF]'}`}>
                  {c.desc}
                </span>
              </div>
            ))}
          </div>
        </main>

        <footer className="mt-8 text-[11px] text-[#94A3B8] dark:text-[#9CA3AF] tracking-widest uppercase font-bold text-center">
          ENCRYPTED LOCAL ANALYSIS • NO DATA SHARED
        </footer>
      </div>

      {/* Extra Tools Modal */}
      <AnimatePresence>
        {isToolsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#1E293B] border border-zinc-700/50 rounded-[24px] p-6 shadow-2xl"
            >
              <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-indigo-400">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Wrench size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Security Vault</h3>
                </div>
                <button 
                  onClick={() => setIsToolsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#9CA3AF]"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-3">
                <div 
                  onClick={() => {
                    setIsAuditHistoryOpen(true);
                    setIsToolsModalOpen(false);
                  }}
                  className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-white">
                      <History size={16} className="text-indigo-400" />
                      <span className="text-[14px] font-semibold">Audit History</span>
                    </div>
                    <ChevronRight size={14} className="text-[#4B5563]" />
                  </div>
                  <p className="text-[12px] text-[#9CA3AF]">Access your last 30 password security audits.</p>
                </div>

                <div 
                  onClick={() => syncPreferences({ ...preferences, notifications: !preferences.notifications })}
                  className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-white">
                      <Settings size={16} className="text-indigo-400" />
                      <span className="text-[14px] font-semibold">Preference Sync</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSyncing && (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Database size={12} className="text-[#4B5563]" />
                        </motion.div>
                      )}
                      <span className="text-[10px] text-[#4B5563] font-mono lowercase">
                        {preferences.lastSynced ? `Synced ${new Date(preferences.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not Synced'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF]">Notifications are {preferences.notifications ? 'Enabled' : 'Disabled'}. Click to toggle sync.</p>
                </div>

                <div 
                  onClick={() => syncPreferences({ ...preferences, autoCheck: !preferences.autoCheck })}
                  className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles size={16} className="text-indigo-400" />
                      <span className="text-[14px] font-semibold">Auto Check</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${preferences.autoCheck ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                      <motion.div 
                        initial={false}
                        animate={{ x: preferences.autoCheck ? 18 : 2 }}
                        className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF]">Automatically analyze strength as you type.</p>
                </div>

                <div className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer"
                  onClick={() => syncPreferences({ ...preferences, hardenedMode: !preferences.hardenedMode })}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-white">
                      <ShieldCheck size={16} className="text-indigo-400" />
                      <span className="text-[14px] font-semibold">Hardened Mode</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${preferences.hardenedMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                      <motion.div 
                        initial={false}
                        animate={{ x: preferences.hardenedMode ? 18 : 2 }}
                        className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF]">Enable strict entropy requirements for all checks.</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 text-center">
                <p className="text-[11px] text-[#4B5563] font-medium tracking-wide italic">
                  Advanced tools are currently restricted to local sandbox mode.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit History Modal */}
      <AnimatePresence>
        {isAuditHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditHistoryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#1E293B] border border-zinc-700/50 rounded-[24px] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <header className="p-6 border-b border-white/5 bg-[#1E293B] sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <History size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Audit History</h3>
                  </div>
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] text-red-400/60 hover:text-red-400 font-bold uppercase tracking-widest transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setIsAuditHistoryOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#9CA3AF]"
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {auditHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <History size={40} className="mx-auto text-zinc-700/30 mb-4" />
                    <p className="text-[#9CA3AF] text-sm">No history found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {auditHistory.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-white/[0.08] transition-colors"
                      >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-mono text-[#D1D5DB] transition-all truncate max-w-[120px] ${
                              !visiblePassIds.has(item.id) && 'blur-[4px] select-none opacity-40'
                            }`}>
                              {visiblePassIds.has(item.id) ? item.password : '••••••••'}
                            </span>
                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                              item.strength === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.strength === 'Strong' ? 'bg-blue-500/10 text-blue-400' :
                              item.strength === 'Fair' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {item.strength}
                            </div>
                          </div>
                          <span className="text-[10px] text-[#64748B]">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                          <button
                            onClick={() => {
                              const next = new Set(visiblePassIds);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              setVisiblePassIds(next);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-[#94A3B8] hover:text-white transition-all transform hover:scale-110"
                            title={visiblePassIds.has(item.id) ? "Hide Password" : "Show Password"}
                          >
                            {visiblePassIds.has(item.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.password);
                              setCopiedId(item.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className={`p-1.5 hover:bg-white/10 rounded-lg transition-all transform active:scale-95 ${
                              copiedId === item.id ? 'text-emerald-400' : 'text-[#94A3B8] hover:text-white'
                            }`}
                            title="Copy Password"
                          >
                            {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          
                          <div className="pl-2 border-l border-white/5 ml-1">
                            <span className="text-[11px] font-mono text-[#9CA3AF]">
                              {item.bits.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <footer className="p-4 bg-zinc-900/50 border-t border-white/5 text-center">
                <p className="text-[10px] text-[#4B5563] font-medium tracking-wide">
                  Showing last {auditHistory.length} local security transformations.
                </p>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
