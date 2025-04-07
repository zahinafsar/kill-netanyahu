import { useRef, useEffect } from 'react';

export function useAudio() {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const punchSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    bgMusicRef.current = new Audio('/bg-music.mp3');
    hitSoundRef.current = new Audio('/hit.wav');
    punchSoundRef.current = new Audio('/punch.mp3');

    // Set initial properties
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.5;
    hitSoundRef.current.volume = 1;
    punchSoundRef.current.volume = 1;
    // Cleanup
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
      if (hitSoundRef.current) {
        hitSoundRef.current.pause();
        hitSoundRef.current = null;
      }
      if (punchSoundRef.current) {
        punchSoundRef.current.pause();
        punchSoundRef.current = null;
      }
    };
  }, []);

  const playBackgroundMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.play().catch(error => {
        console.error('Error playing background music:', error);
      });
    }
  };

  const stopBackgroundMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  };

  const playHitSound = () => {
    if (hitSoundRef.current) {
      hitSoundRef.current.currentTime = 0;
      hitSoundRef.current.play().catch(error => {
        console.error('Error playing hit sound:', error);
      });
    }
  };

  const playPunchSound = () => {
    if (punchSoundRef.current) {
      punchSoundRef.current.currentTime = 0;
      punchSoundRef.current.play().catch(error => {
        console.error('Error playing punch sound:', error);
      });
    }
  };

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    playHitSound,
    playPunchSound
  };
} 