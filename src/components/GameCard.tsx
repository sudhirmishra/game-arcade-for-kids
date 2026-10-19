import React from 'react';
import { GameMetadata } from '../types/game';
import { Users, User, ArrowRight, Sparkles } from 'lucide-react';
import { sound } from '../sound/soundEffects';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (gameId: GameMetadata['id']) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const isMultiplayer = game.id === 'tictactoe';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Visual Header / Illustration Preview */}
      <div
        className="w-full h-48 relative flex items-center justify-center p-6 overflow-hidden cursor-pointer"
        style={{
          background:
            game.id === 'tictactoe'
              ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
              : game.id === 'memory'
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        }}
        onClick={() => {
          sound.playTap(520);
          onSelect(game.id);
        }}
      >
        {/* Handcrafted animated vector game artwork for each game */}
        {game.id === 'colordash' && (
          <div className="relative w-48 h-32 flex items-center justify-center">
            {/* Running Chameleon */}
            <div className="absolute top-4 left-10 w-14 h-12 bg-emerald-500 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
              🦎
            </div>
            {/* Colorful Vine segment */}
            <div className="absolute bottom-10 left-4 w-40 h-3 bg-emerald-400 rounded-full border border-emerald-300 shadow-xs flex items-center justify-around px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-200" />
              <span className="w-2 h-2 rounded-full bg-emerald-200" />
              <span className="w-2 h-2 rounded-full bg-emerald-200" />
            </div>
            {/* Floating Rainbow Bug */}
            <div className="absolute top-3 right-6 w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-sky-400 border border-white shadow-xs flex items-center justify-center text-xs group-hover:-translate-y-1 transition-transform animate-bounce">
              ✨
            </div>
            {/* Primary color bubbles */}
            <div className="absolute bottom-2 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-sky-500 border border-white shadow-2xs" />
            </div>
          </div>
        )}

        {game.id === 'jellybounce' && (
          <div className="relative w-48 h-32 flex items-center justify-center">
            {/* Jelly Character bouncing */}
            <div className="absolute top-3 left-18 w-12 h-11 bg-rose-500 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform">
              🍮
            </div>
            {/* Bouncy Rainbow Trampoline Line */}
            <div
              className="absolute bottom-10 w-36 h-2.5 rounded-full shadow-sm group-hover:scale-x-105 transition-transform"
              style={{
                background:
                  'linear-gradient(90deg, #ff598f 0%, #fd8a5e 25%, #f4d35e 50%, #2ec4b6 75%, #38bdf8 100%)',
              }}
            />
            {/* Floating Soap Bubble */}
            <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-sky-200/40 border-2 border-white/80 shadow-xs flex items-center justify-center text-sm group-hover:translate-y-1 transition-transform">
              🫧
            </div>
            {/* Candy Jar Goal */}
            <div className="absolute bottom-2 right-6 w-11 h-12 bg-sky-500/30 rounded-xl border-2 border-sky-400 flex items-center justify-center text-lg shadow-xs">
              🍬
            </div>
          </div>
        )}

        {game.id === 'tictactoe' && (
          <div className="relative flex items-center justify-center gap-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-blue-200 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              ⭐
            </div>
            <span className="text-2xl font-bold text-blue-300">VS</span>
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-blue-200 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
              🚀
            </div>
          </div>
        )}

        {game.id === 'memory' && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="w-14 h-16 bg-white rounded-xl shadow-xs border border-emerald-200 flex items-center justify-center text-2xl group-hover:-translate-y-1 transition-transform">
              🦁
            </div>
            <div className="w-14 h-16 bg-emerald-500 rounded-xl shadow-xs border border-emerald-600 flex items-center justify-center text-white text-xl">
              ✨
            </div>
            <div className="w-14 h-16 bg-white rounded-xl shadow-xs border border-emerald-200 flex items-center justify-center text-2xl group-hover:translate-y-1 transition-transform">
              🐼
            </div>
            <div className="w-14 h-16 bg-emerald-500 rounded-xl shadow-xs border border-emerald-600 flex items-center justify-center text-white text-xl">
              ✨
            </div>
            <div className="w-14 h-16 bg-white rounded-xl shadow-xs border border-emerald-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🍦
            </div>
            <div className="w-14 h-16 bg-emerald-500 rounded-xl shadow-xs border border-emerald-600 flex items-center justify-center text-white text-xl">
              ✨
            </div>
          </div>
        )}

        {game.id === 'fallingblocks' && (
          <div className="relative w-48 h-32 flex items-center justify-center">
            {/* Playful stacking critters */}
            <div className="absolute bottom-2 left-6 w-12 h-12 bg-pink-400 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
              🌸
            </div>
            <div className="absolute bottom-2 right-6 w-14 h-14 bg-sky-400 rounded-2xl border-2 border-white shadow-xs flex items-center justify-center text-2xl group-hover:-rotate-12 transition-transform">
              🧊
            </div>
            <div className="absolute bottom-12 left-16 w-12 h-12 bg-amber-400 rounded-xl border-2 border-white shadow-xs flex items-center justify-center text-2xl group-hover:scale-115 transition-transform">
              ⭐
            </div>
            <div className="absolute top-1 left-20 w-8 h-8 bg-purple-400 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-base">
              🍇
            </div>
          </div>
        )}

        {/* Player mode floating indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80">
          {isMultiplayer ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-emerald-600" />}
          <span>{game.playerMode}</span>
        </div>
      </div>

      {/* Content & Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata clean text with typographic separator (Zero-Pill compliant) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>{game.targetAge}</span>
            <span aria-hidden="true">·</span>
            <span>Powered by PixiJS</span>
            <span aria-hidden="true">·</span>
            <span>Interactive 2D</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {game.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5 mb-3">{game.subtitle}</p>

          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {game.description}
          </p>

          {/* Skill development list */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span className="text-[11px] text-slate-400 font-medium">Practices:</span>
            {game.skills.map((skill, sIdx) => (
              <span key={skill} className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            sound.playTap(580);
            onSelect(game.id);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 group-hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all shadow-xs active:scale-98"
        >
          <span>Play Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
