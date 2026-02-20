import { motion } from 'framer-motion';
import { Card as CardType, Suit, Rank } from '../types';

interface CardProps {
  card: CardType | null;
  faceUp?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SUIT_SYMBOLS = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

const RANK_SYMBOLS = {
  [Rank.Two]: '2',
  [Rank.Three]: '3',
  [Rank.Four]: '4',
  [Rank.Five]: '5',
  [Rank.Six]: '6',
  [Rank.Seven]: '7',
  [Rank.Eight]: '8',
  [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J',
  [Rank.Queen]: 'Q',
  [Rank.King]: 'K',
  [Rank.Ace]: 'A',
};

const SUIT_COLORS = {
  [Suit.Clubs]: 'text-black',
  [Suit.Diamonds]: 'text-red-600',
  [Suit.Hearts]: 'text-red-600',
  [Suit.Spades]: 'text-black',
};

const SIZE_CLASSES = {
  sm: 'w-12 h-16 text-xs',
  md: 'w-16 h-24 text-base',
  lg: 'w-20 h-32 text-lg',
};

export default function Card({ card, faceUp = true, size = 'md', className = '' }: CardProps) {
  if (!card) {
    return (
      <div className={`${SIZE_CLASSES[size]} bg-casino-black/30 border-2 border-dashed border-casino-gold/30 rounded-lg ${className}`} />
    );
  }

  if (!faceUp) {
    return (
      <motion.div
        className={`${SIZE_CLASSES[size]} card-back rounded-lg border-2 border-white/20 shadow-lg ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white/20 text-2xl">🂠</div>
        </div>
      </motion.div>
    );
  }

  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const rankSymbol = RANK_SYMBOLS[card.rank];

  return (
    <motion.div
      className={`${SIZE_CLASSES[size]} card-face rounded-lg border-2 border-gray-300 shadow-lg flex flex-col items-center justify-between p-2 ${className}`}
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <div className={`text-left w-full font-bold ${suitColor}`}>
        <div>{rankSymbol}</div>
        <div className="text-lg">{suitSymbol}</div>
      </div>
      <div className={`text-3xl ${suitColor}`}>
        {suitSymbol}
      </div>
      <div className={`text-right w-full font-bold ${suitColor} rotate-180`}>
        <div>{rankSymbol}</div>
        <div className="text-lg">{suitSymbol}</div>
      </div>
    </motion.div>
  );
}
