
import { GoogleGenAI } from "@google/genai";
import { Match, Player } from '../types';

// Safely access API Key
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const analyzeMatch = async (match: Match): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate analysis.";

  const prompt = `
    Analyze the following Squash match result and provide a short, professional sports commentary summary (max 50 words) suitable for a press release.
    
    Match Details:
    Tournament: ProSquash Open
    Round: ${match.roundName}
    Player 1: ${match.player1?.name} (Rank ${match.player1?.rank})
    Player 2: ${match.player2?.name} (Rank ${match.player2?.rank})
    
    Scores (P1 vs P2): ${match.scores.map(s => `${s.p1}-${s.p2}`).join(', ')}
    Winner: ${match.winnerId === match.player1?.id ? match.player1?.name : match.player2?.name}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate analysis at this time.";
  }
};

export const suggestSeeding = async (players: Player[]): Promise<string> => {
    if (!apiKey) return "API Key missing.";
    
    const playerList = players.map(p => `${p.name} (Current Points: ${p.points}, Club: ${p.club})`).join('\n');
    
    const prompt = `
      As a Squash Tournament Director, suggest the top 4 seeds for a draw based on the following player list. Explain why briefly.
      
      Players:
      ${playerList}
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "No seeding suggestion.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to suggest seeding.";
    }
  };

export const predictMatch = async (p1: Player, p2: Player, h2hSummary: string): Promise<string> => {
    if (!apiKey) return "API Key missing.";

    const prompt = `
      You are a Squash Expert. Predict the outcome of a match between these two players:
      
      Player A: ${p1.name} (Rank: ${p1.rank}, Points: ${p1.points}, Club: ${p1.club})
      Player B: ${p2.name} (Rank: ${p2.rank}, Points: ${p2.points}, Club: ${p2.club})
      
      Head-to-Head History: ${h2hSummary}
      
      Provide a percentage chance of winning for Player A, and a 1-sentence tactical key for the match.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Prediction unavailable.";
    } catch (error) {
        return "AI Prediction unavailable.";
    }
}
