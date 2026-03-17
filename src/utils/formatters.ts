export const formatTime = (seconds: number): string => {
  const s = seconds || 0;
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const formatTimeHHMM = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "00:00";
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
