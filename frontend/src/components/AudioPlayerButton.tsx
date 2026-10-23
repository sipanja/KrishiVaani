import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Volume2, Loader2, Pause, Play } from 'lucide-react';

interface AudioPlayerButtonProps {
  text: string;
  language?: string;
  className?: string;
}

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = ({
  text,
  language,
  className = '',
}) => {
  const { language: currentLang, t } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const langToUse = language || currentLang;

  const handlePlayAudio = async () => {
    // If already playing, toggle pause
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If audio object already loaded, just play
    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    try {
      // Strip markdown bold and symbols for natural audio speech
      const cleanText = text
        .replace(/[*#_`]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      const blob = await api.synthesizeVoice(cleanText, langToUse);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio playback error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlayAudio}
      disabled={loading}
      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isPlaying
          ? 'bg-harvest text-white shadow-sm animate-pulse'
          : 'bg-krishi-100 text-krishi-800 hover:bg-krishi-200'
      } ${className}`}
      title={t.audio_response_btn}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      <span>{isPlaying ? 'Playing...' : t.audio_response_btn}</span>
    </button>
  );
};
