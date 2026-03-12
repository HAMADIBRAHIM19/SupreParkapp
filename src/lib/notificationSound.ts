// Simple notification sound using Web Audio API
let audioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Two-tone notification beep
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch {
    // Silently fail if audio isn't available
  }
};
