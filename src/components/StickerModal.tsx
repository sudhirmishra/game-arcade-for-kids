import React from 'react';
import { StickerAchievement } from '../types/game';
import { X, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../sound/soundEffects';

interface StickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerAchievement[];
}

export const StickerModal: React.FC<StickerModalProps> = ({ isOpen, onClose, stickers }) => {
  if (!isOpen) return null;

  const unlockedCount = stickers.filter((s) => s.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-amber-50/70 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
              ⭐
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Arcade Sticker Book</h2>
              <p className="text-xs text-slate-500">Collect stamps by playing and winning games!</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTap(400);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">
              {unlockedCount} of {stickers.length} Stickers Collected
            </span>
          </div>
          <div className="w-36 h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(unlockedCount / stickers.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                sticker.unlocked
                  ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
                  sticker.unlocked ? 'bg-white shadow-xs' : 'bg-slate-200 grayscale'
                }`}
              >
                {sticker.unlocked ? sticker.icon : '🔒'}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{sticker.title}</h4>
              <p className="text-xs text-slate-500 leading-snug mb-2">{sticker.description}</p>
              {sticker.unlocked ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Unlocked!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Keep Playing</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => {
              sound.playTap(500);
              onClose();
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Back to Arcade
          </button>
        </div>
      </div>
    </div>
  );
};
