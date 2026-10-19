/**
 * Game definitions, sticker achievements, and shared game types.
 */

export type GameId = 'colordash' | 'jellybounce' | 'tictactoe' | 'memory' | 'fallingblocks';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  playerMode: string;
  targetAge: string;
  accentColor: string;
  skills: string[];
}

export interface StickerAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export const ARCADE_GAMES: GameMetadata[] = [
  {
    id: 'colordash',
    title: 'Chameleon Color Dash',
    subtitle: 'Endless Color Mixing Runner',
    description: 'Sprint through the jungle canopy! Mix primary colors (Red, Yellow, Blue) into secondary blends (Orange, Green, Purple) to camouflage across matching vines. Catch rainbow bugs for Disco Mode!',
    playerMode: '1 Player',
    targetAge: 'Ages 4-10',
    accentColor: '#10b981',
    skills: ['Color Theory', 'Rapid Reflexes', 'Hand-Eye Coordination'],
  },
  {
    id: 'jellybounce',
    title: 'Jelly Bounce Lab',
    subtitle: 'Trampoline Physics & Bubbles',
    description: 'Draw bouncy rainbow trampoline lines with your finger or mouse! Guide the cute googly-eyed jelly past obstacles, float in soap bubbles, collect stars, and bounce straight into the candy jar.',
    playerMode: '1 Player',
    targetAge: 'Ages 5-12',
    accentColor: '#ec4899',
    skills: ['Physics Angles', 'Spatial Drawing', 'Problem Solving'],
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe Duo',
    subtitle: 'Same-Screen 2-Player Battle',
    description: 'Play side-by-side with a friend on the same screen! Choose friendly cosmic, cute pet, or sweet treat symbols with bouncy animations and celebrations.',
    playerMode: '2 Players (Local)',
    targetAge: 'Ages 4+',
    accentColor: '#3b82f6',
    skills: ['Turn Taking', 'Spatial Strategy', 'Social Play'],
  },
  {
    id: 'memory',
    title: 'Tile Match Adventure',
    subtitle: 'Animated Memory Cards',
    description: 'Flip colorful animated cards to uncover adorable zoo animals, sweet treats, and cosmic rockets. Multiple difficulty levels for little and big kids.',
    playerMode: '1 Player',
    targetAge: 'Ages 4-10',
    accentColor: '#10b981',
    skills: ['Memory Recall', 'Pattern Recognition', 'Concentration'],
  },
  {
    id: 'fallingblocks',
    title: 'Critter Tumble & Pop',
    subtitle: 'Physics Block Playground',
    description: 'Drop whimsical googly-eyed jelly blocks with realistic physics! Stack tall towers without wobbling or match bouncy critters to pop combos and clear the board.',
    playerMode: '1 Player',
    targetAge: 'Ages 5+',
    accentColor: '#f59e0b',
    skills: ['Physics Intuition', 'Balance & Geometry', 'Quick Reflexes'],
  },
];

export const INITIAL_STICKERS: StickerAchievement[] = [
  {
    id: 'first_play',
    title: 'Arcade Rookie',
    description: 'Played your very first game in WonderPix Arcade',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'tic_win',
    title: 'Tic-Tac Champion',
    description: 'Achieved victory in a Tic Tac Toe match',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'memory_ace',
    title: 'Memory Master',
    description: 'Found all pairs in the Memory Card game',
    icon: '🧠',
    unlocked: false,
  },
  {
    id: 'stack_master',
    title: 'Tower Architect',
    description: 'Stacked 8 whimsical critters in Falling Blocks',
    icon: '🏰',
    unlocked: false,
  },
  {
    id: 'combo_king',
    title: 'Combo Popper',
    description: 'Popped a combo in Critter Match mode',
    icon: '💥',
    unlocked: false,
  },
  {
    id: 'curious_explorer',
    title: 'Grand Explorer',
    description: 'Explored all three games in the arcade',
    icon: '🚀',
    unlocked: false,
  },
];
