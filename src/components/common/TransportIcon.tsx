import React from 'react';
import { Footprints, Bus, TrainFront, Car } from 'lucide-react';
import { TransportMode } from '../../types';

interface TransportIconProps {
  mode: TransportMode;
  className?: string;
}

export const TransportIcon: React.FC<TransportIconProps> = ({ mode, className = "w-4 h-4" }) => {
  switch (mode) {
    case 'walking': return <Footprints className={className} />;
    case 'bus': return <Bus className={className} />;
    case 'subway': return <TrainFront className={className} />;
    case 'taxi': return <Car className={className} />;
    case 'uber': return <Car className={className} />;
    default: return <Footprints className={className} />;
  }
};
