import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, hover = false, onClick }) => {
  const Component = onClick ? motion.div : 'div';
  
  return (
    <Component
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden',
        hover && 'hover:shadow-xl transition-shadow duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...(onClick && {
        whileHover: { y: -2 },
        whileTap: { y: 0 },
      })}
    >
      {children}
    </Component>
  );
};

export default Card;