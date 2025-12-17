
export type Language = 'EN' | 'CN';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  WALKOVER = 'WALKOVER'
}

export enum GameFormat {
  BEST_OF_3 = 3,
  BEST_OF_5 = 5
}

export enum ScoringType {
  PAR_11 = 'PAR_11', // Point A Rally to 11
  PAR_15 = 'PAR_15',
  HIHO_9 = 'HIHO_9' // Hand In Hand Out to 9
}

export interface Club {
  id: string;
  name: string;
  location: string;
  manager: string;
}

export interface Official {
  id: string;
  name: string;
  level: string; // e.g., 'National', 'International'
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Team {
    id: string;
    name: string;
    clubId?: string;
    players: Player[];
    ranking: number;
}

export interface Player {
  id: string;
  name: string;
  partnerName?: string; // For Doubles
  rank: number;
  club: string;
  gender: 'M' | 'F';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  points: number;
  avatar?: string;
}

export interface GameScore {
  p1: number;
  p2: number;
}

export interface MatchEvent {
  id: string;
  timestamp: number; // Date.now()
  timeString: string; // "10:45"
  type: 'SCORE' | 'DECISION' | 'GAME_END' | 'MATCH_END' | 'INFO';
  detail: 'NORMAL' | 'STROKE' | 'NO_LET' | 'LET' | 'CONDUCT_WARNING' | 'GAME_WIN' | 'START';
  player?: 1 | 2; // Who benefited or was involved
  description: string;
  scoreSnapshot: string; // "10-8"
}

export interface Match {
  id: string;
  tournamentId: string;
  roundName: string; // e.g., "Quarter Final", "Group A"
  roundIndex?: number; // 1 = Final, 2 = Semi, etc.
  player1: Player | null; // Null if bye or TBD
  player2: Player | null;
  partner1Name?: string; // For Doubles
  partner2Name?: string; // For Doubles
  scores: GameScore[]; 
  status: MatchStatus;
  winnerId?: string;
  startTime?: string;
  court?: string;
  referee?: string; // Name of the referee
  group?: string; // For Round Robin
  isTeamMatch?: boolean;
  teamMatchId?: string; // If part of a tie
  signatureP1?: string; // Base64 signature
  signatureP2?: string; // Base64 signature
  signatureRef?: string; // Base64 signature
  events?: MatchEvent[]; // Detailed log of events
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'Knockout' | 'RoundRobin' | 'Team' | 'Combined';
  status: 'Upcoming' | 'Active' | 'Completed';
}

export interface RankingHistory {
  date: string;
  points: number;
}

// --- AUTH & PERMISSIONS ---

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  EVENT_ADMIN = 'EVENT_ADMIN',
  REFEREE = 'REFEREE',
  TECHNICAL_OFFICER = 'TECHNICAL_OFFICER',
  CLUB_ADMIN = 'CLUB_ADMIN',
  PLAYER = 'PLAYER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatar?: string;
}

export interface Permissions {
  canManageSystem: boolean;
  canManageEvent: boolean;
  canScore: boolean;
  canVerify: boolean;
  canManageClub: boolean;
  canViewRestricted: boolean;
}
