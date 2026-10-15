import React, { useState } from 'react';
import { initAudio } from '@/lib/audio';
import { CORPORATE_INFO } from '@/constants';

interface LoginViewProps {
  onLogin: (username: string, password?: string) => Promise<boolean>;
}

const LoginViewComponent: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Inicializar el sistema de audio tras la interacción del usuario al iniciar sesión
    // Esto habilita la reproducción de alertas de sonido en el navegador durante la sesión
    try {
      initAudio();
    } catch (err) {
      console.warn("No se pudo inicializar el audio:", err);
    }

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      <div className="max-w-[440px] w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm">G</div>
            <div className="text-left">
              <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">
                {CORPORATE_INFO.name}<span className="text-indigo-600">.</span>
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">By {CORPORATE_INFO.company}</p>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal Corporativo</h2>
          <p className="text-slate-500 mt-2 font-medium">{CORPORATE_INFO.systemName}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-pulse">
              Credenciales no válidas
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Identificador de Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Clave de Acceso</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-400 font-bold border-t border-slate-100">
            <span className="text-indigo-600 font-black">{CORPORATE_INFO.version}</span>
            <span className="opacity-60">{CORPORATE_INFO.support}</span>
          </div>
        </form>

        <footer className="mt-12 text-center space-y-1">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{CORPORATE_INFO.systemName} &bull; Powered by <a href={CORPORATE_INFO.brandUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{CORPORATE_INFO.companyFullName}</a></p>
           <p className="text-[10px] text-slate-400 font-bold lowercase tracking-wide">{CORPORATE_INFO.domain}</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginViewComponent;
