// Contexto de audio global para reproducción de sonidos
let audioCtx: AudioContext | null = null;

// Inicializa el sistema de audio del navegador
export const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  if (audioCtx) {
    // Reactivar el audio si el navegador lo suspendió por inactividad
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Emitir un tono inaudible para desbloquear el audio en navegadores móviles y de escritorio
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0; // Sin volumen (silencio)
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
};

// Reproduce el sonido de llamado configurado (campana, timbre o alerta)
export const playNotificationSound = (type: string, masterVolume: number = 1, durationMultiplier: number = 1) => {
  if (!audioCtx) {
    initAudio(); // Inicializar si aún no estaba listo
  }
  if (!audioCtx) return;

  // Asegurar que el contexto de sonido esté activo
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const ctx = audioCtx;

  // Genera un tono musical sintético según frecuencia y duración
  const playTone = (freq: number, type: OscillatorType, time: number, duration: number, vol: number = 0.1) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time * durationMultiplier);
    
    // Ajustar el volumen final con el volumen maestro seleccionado
    const finalVol = vol * masterVolume * 10;
    
    gain.gain.setValueAtTime(finalVol, ctx.currentTime + time * durationMultiplier);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (time + duration) * durationMultiplier);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + time * durationMultiplier);
    osc.stop(ctx.currentTime + (time + duration) * durationMultiplier);
  };

  if (type === 'campana') {
    playTone(880, 'sine', 0, 0.5, 0.2);
  } else if (type === 'timbre') {
    playTone(659.25, 'sine', 0, 0.4, 0.2); // Nota Mi (E5)
    playTone(523.25, 'sine', 0.4, 0.6, 0.2); // Nota Do (C5)
  } else if (type === 'alerta') {
    playTone(1000, 'square', 0, 0.1, 0.05);
    playTone(1000, 'square', 0.2, 0.1, 0.05);
    playTone(1000, 'square', 0.4, 0.1, 0.05);
  }
};
