
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Match, Player, MatchStatus, Club, Official } from '../types';

interface DataContextType {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  updatePlayer: (player: Player) => void;
  clubs: Club[];
  addClub: (club: Club) => void;
  officials: Official[];
  addOfficial: (official: Official) => void;
  updateMatch: (match: Match) => void;
  checkConflict: (matchId: string, court: string, startTime: string, p1Id?: string, p2Id?: string) => string | null;
  resetSystem: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// FULL INITIAL DATA
const INITIAL_PLAYERS: Player[] = [
    // BOYS U19
    { id: 'BU19-1', name: '胡哲', rank: 1, club: 'National', gender: 'M', status: 'APPROVED', points: 1900 },
    { id: 'BU19-2', name: '杨倪瑞', rank: 1, club: 'National', gender: 'M', status: 'APPROVED', points: 1900 },
    { id: 'BU19-3', name: '梁皓骢', rank: 3, club: 'National', gender: 'M', status: 'APPROVED', points: 1940 },
    { id: 'BU19-4', name: '陈浩瑀', rank: 4, club: 'National', gender: 'M', status: 'APPROVED', points: 1148 },
    { id: 'BU19-5', name: '张灵希', rank: 5, club: 'National', gender: 'M', status: 'APPROVED', points: 1000 },
    // International Stars (Demo)
    { id: '1', name: 'Ali Farag', rank: 1, club: 'Cairo SC', points: 2000, gender: 'M', status: 'APPROVED' },
    { id: '2', name: 'Diego Elias', rank: 2, club: 'Lima Squash', points: 1800, gender: 'M', status: 'APPROVED' },
    { id: '3', name: 'Paul Coll', rank: 3, club: 'Greymouth', points: 1750, gender: 'M', status: 'APPROVED' },
];

const INITIAL_CLUBS: Club[] = [
    { id: 'c1', name: 'Beijing Squash Academy', location: 'Beijing', manager: 'Mr. Liu' },
    { id: 'c2', name: 'Shanghai Squash Elite', location: 'Shanghai', manager: 'Ms. Chen' },
    { id: 'c3', name: 'National', location: 'China', manager: 'Squash Association' },
];

const INITIAL_OFFICIALS: Official[] = [
    { id: 'o1', name: 'Mike Ross', level: 'WSF National', status: 'ACTIVE' },
    { id: 'o2', name: 'Rachel Zane', level: 'Regional', status: 'ACTIVE' },
    { id: 'o3', name: 'Louis Litt', level: 'International', status: 'ACTIVE' },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State with Lazy Loading from LocalStorage
  const [matches, setMatches] = useState<Match[]>(() => {
      const saved = localStorage.getItem('psm_matches');
      return saved ? JSON.parse(saved) : [];
  });

  const [players, setPlayers] = useState<Player[]>(() => {
      const saved = localStorage.getItem('psm_players');
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [clubs, setClubs] = useState<Club[]>(() => {
      const saved = localStorage.getItem('psm_clubs');
      return saved ? JSON.parse(saved) : INITIAL_CLUBS;
  });

  const [officials, setOfficials] = useState<Official[]>(() => {
      const saved = localStorage.getItem('psm_officials');
      return saved ? JSON.parse(saved) : INITIAL_OFFICIALS;
  });

  // 2. Auto-Save Effects
  useEffect(() => { localStorage.setItem('psm_matches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem('psm_players', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('psm_clubs', JSON.stringify(clubs)); }, [clubs]);
  useEffect(() => { localStorage.setItem('psm_officials', JSON.stringify(officials)); }, [officials]);

  // Helper to advance winner AND loser (to Plate) in knockout format
  const handleKnockoutProgression = (allMatches: Match[], finishedMatch: Match): Match[] => {
      const winner = finishedMatch.winnerId === finishedMatch.player1?.id
          ? finishedMatch.player1
          : finishedMatch.player2;
      const loser = finishedMatch.winnerId === finishedMatch.player1?.id
          ? finishedMatch.player2
          : finishedMatch.player1;
      
      // Safety checks
      if (!winner || !finishedMatch.id.startsWith('R')) return allMatches;

      let newMatches = [...allMatches];

      try {
          const [rPart, mPart] = finishedMatch.id.split('-');
          const currentRoundSize = parseInt(rPart.substring(1)); // e.g. 4 (Semi) or 8 (Quarter)
          const currentMatchIndex = parseInt(mPart.substring(1)); // e.g. 1

          // 1. Advance WINNER to Next Round Main Draw
          if (currentRoundSize > 1) {
              const nextRoundSize = currentRoundSize / 2;
              const nextMatchIndex = Math.ceil(currentMatchIndex / 2);
              const nextMatchId = `R${nextRoundSize}-M${nextMatchIndex}`;

              newMatches = newMatches.map(m => {
                  if (m.id === nextMatchId) {
                      const isPlayer1Slot = currentMatchIndex % 2 !== 0; // Odd numbers (1,3) go to P1, Even (2,4) go to P2
                      return {
                          ...m,
                          player1: isPlayer1Slot ? winner : m.player1,
                          player2: isPlayer1Slot ? m.player2 : winner
                      };
                  }
                  return m;
              });
          }

          // 2. Send LOSER to Plate (Only if a corresponding Plate match exists)
          // Logic: The Plate bracket usually starts half the size of the Main Draw.
          // e.g. Main Draw R16 (8 matches) -> Feeds Plate QF (4 matches)
          // Plate Match ID logic matches TournamentPage: PLATE-R{size}-M{index}
          
          if (loser) {
              const plateRoundSize = currentRoundSize / 2;
              const plateMatchIndex = Math.ceil(currentMatchIndex / 2);
              const plateMatchId = `PLATE-R${plateRoundSize}-M${plateMatchIndex}`;

              // Check if this plate match exists (meaning this was a plate-feeding round)
              const plateMatchExists = newMatches.some(m => m.id === plateMatchId);

              if (plateMatchExists) {
                  newMatches = newMatches.map(m => {
                      if (m.id === plateMatchId) {
                          const isPlayer1Slot = currentMatchIndex % 2 !== 0;
                          return {
                              ...m,
                              player1: isPlayer1Slot ? loser : m.player1,
                              player2: isPlayer1Slot ? m.player2 : loser
                          };
                      }
                      return m;
                  });
              }
          }

      } catch (e) {
          console.error("Error advancing match:", e);
      }
      
      return newMatches;
  };

  const updateMatch = (updatedMatch: Match) => {
    setMatches(prev => {
        let newMatches = prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
        
        // Auto-advance logic if match completed
        if (updatedMatch.status === MatchStatus.COMPLETED) {
            newMatches = handleKnockoutProgression(newMatches, updatedMatch);
        }
        
        return newMatches;
    });
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const addClub = (club: Club) => {
      setClubs(prev => [...prev, club]);
  };

  const addOfficial = (official: Official) => {
      setOfficials(prev => [...prev, official]);
  };

  const resetSystem = () => {
      if(confirm("Are you sure you want to reset all system data? This cannot be undone.")) {
          setMatches([]);
          setPlayers(INITIAL_PLAYERS);
          setClubs(INITIAL_CLUBS);
          setOfficials(INITIAL_OFFICIALS);
          localStorage.clear();
          window.location.reload();
      }
  }

  // 3. Smart Conflict Detection (Time Overlap & Player Rest)
  const checkConflict = (matchId: string, court: string, startTime: string, p1Id?: string, p2Id?: string): string | null => {
      if (!startTime) return null;

      // Helper to convert "10:00" to minutes
      const toMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
      };

      const MATCH_DURATION = 45; // Minutes
      const MIN_REST_TIME = 30; // Minutes required between matches
      const newStart = toMinutes(startTime);
      const newEnd = newStart + MATCH_DURATION;

      for (const m of matches) {
          // Skip self, or matches without time
          if (m.id === matchId || !m.startTime) continue;

          const existingStart = toMinutes(m.startTime);
          const existingEnd = existingStart + MATCH_DURATION;
          
          // Check 1: Court Conflict
          // Overlap logic: (StartA < EndB) and (EndA > StartB)
          const timeOverlap = (newStart < existingEnd && newEnd > existingStart);
          
          if (m.court === court && timeOverlap) {
              return `Court Conflict: ${court} is booked at ${m.startTime}`;
          }

          // Check 2: Player Conflict (Rest Time)
          if (p1Id && p2Id) {
             const involvesPlayer = (
                 m.player1?.id === p1Id || m.player2?.id === p1Id ||
                 m.player1?.id === p2Id || m.player2?.id === p2Id
             );

             if (involvesPlayer) {
                 // Check strict overlap
                 if (timeOverlap) {
                     return `Player Conflict: ${m.player1?.name} or ${m.player2?.name} is playing at ${m.startTime}`;
                 }
                 
                 // Check Rest Buffer (End of M1 to Start of M2)
                 // Case A: Existing match is BEFORE new match
                 if (existingEnd <= newStart && (newStart - existingEnd) < MIN_REST_TIME) {
                      return `Rest Conflict: <${MIN_REST_TIME}min rest after match at ${m.startTime}`;
                 }
                 // Case B: Existing match is AFTER new match
                 if (newEnd <= existingStart && (existingStart - newEnd) < MIN_REST_TIME) {
                      return `Rest Conflict: <${MIN_REST_TIME}min rest before match at ${m.startTime}`;
                 }
             }
          }
      }

      return null;
  };

  return (
    <DataContext.Provider value={{ 
        matches, setMatches, updateMatch, checkConflict,
        players, setPlayers, updatePlayer,
        clubs, addClub,
        officials, addOfficial,
        resetSystem 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
