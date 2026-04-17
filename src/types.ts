export type SpotCategory = 
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'shopping'
  | 'hotel'
  | 'transport'
  | 'activity'
  | 'other';

export type TransportMode = 'walking' | 'bus' | 'subway' | 'taxi' | 'uber';

export interface Participant {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MerchantCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface SavedSpot {
  id: string;
  name: string;
  address?: string;
  photo?: string;
  category: SpotCategory;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  payerId: string;
  splitWithIds: string[]; // IDs of participants sharing the cost
  date: string;
  category: string;
  isShared?: boolean; // true/undefined = shared group expense, false = private personal expense
  customAmounts?: { [participantId: string]: number }; // Optional custom split
}

export interface TransitEstimate {
  duration: number;
  distance: number;
  cost?: number;
  description?: string;
  naverRouteUrl?: string;
}

export interface Transit {
  id: string;
  fromSpotId: string;
  toSpotId: string;
  selectedMode: TransportMode;
  estimates: {
    [key in TransportMode]?: TransitEstimate;
  };
}

export interface Spot {
  id: string;
  name: string;
  nameLocal?: string;
  address: string;
  addressLocal?: string;
  photo: string;
  category: SpotCategory;
  lat: number;
  lng: number;
  duration: number;
  cost?: number;
  currency?: string;
  notes?: string;
  tags?: string[];
  openingHours?: string;
  rating?: number;
  order: number;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  title?: string;
  spots: Spot[];
  transits: Transit[];
}

export interface Trip {
  id: string;
  title: string;
  coverImage: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  participants: Participant[];
  expenses: Expense[];
  merchantCategories?: MerchantCategory[];
  savedSpots?: SavedSpot[];
}
