// Generar sonido de notificación sintético (similar a Facebook Messenger)
export function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Primer tono (más alto)
  const oscillator1 = audioContext.createOscillator();
  const gainNode1 = audioContext.createGain();
  
  oscillator1.connect(gainNode1);
  gainNode1.connect(audioContext.destination);
  
  oscillator1.frequency.value = 800; // Hz
  oscillator1.type = 'sine';
  
  gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.1);
  
  // Segundo tono (más bajo, ligeramente después)
  const oscillator2 = audioContext.createOscillator();
  const gainNode2 = audioContext.createGain();
  
  oscillator2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);
  
  oscillator2.frequency.value = 600; // Hz
  oscillator2.type = 'sine';
  
  gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.05);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  
  oscillator2.start(audioContext.currentTime + 0.05);
  oscillator2.stop(audioContext.currentTime + 0.15);
}
