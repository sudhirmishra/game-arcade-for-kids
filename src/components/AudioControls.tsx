import React, { useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { sound } from '../sound/soundEffects';

export const AudioControls: React.FC = () => {
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [isBgmOn, setIsBgmOn] = useState<boolean>(() => sound.isBgmPlaying());

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) {
      sound.playTap(600);
    }
  };

  const handleToggleBgm = () => {
    const next = sound.toggleBgm();
    setIsBgmOn(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleMute}
        title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
        className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
          isMuted
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
        <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
      </button>

      <button
        onClick={handleToggleBgm}
        title={isBgmOn ? 'Stop Arcade Melody' : 'Play Gentle Arcade Melody'}
        className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
          isBgmOn
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        <Music className={`w-4 h-4 ${isBgmOn ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">{isBgmOn ? 'Melody Playing' : 'Melody'}</span>
      </button>
    </div>
  );
};
