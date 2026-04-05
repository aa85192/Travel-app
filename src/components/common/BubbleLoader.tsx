import React from 'react';
import { motion } from 'motion/react';

export const BubbleLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-milk-tea-500"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
