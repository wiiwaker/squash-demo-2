import React, { useState, useEffect, useMemo } from "react";
import {
	Plus,
	Download,
	Printer,
	Wand2,
	Users,
	Grid,
	ListTree,
	Trophy,
	Shuffle,
	PlayCircle,
	Edit,
	Clock,
	MapPin,
	X,
	Settings,
	AlertTriangle,
	Link2,
	Unlink,
	CalendarClock,
	Shield,
	UserCheck,
	Activity,
	BrainCircuit,
	LayoutList,
	Search,
	ArrowRight,
	Filter,
	Target,
	Zap,
	Check,
	MousePointerClick,
	Move,
} from "lucide-react";
import { suggestSeeding, predictMatch } from "../services/geminiService";
import { Player, Language, Match, MatchStatus } from "../types";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import PlayerProfileModal from "../components/PlayerProfileModal";

interface Props {
	language: Language;
	onStartMatch: (match: Match) => void;
}

// --- QUICK SCORE MODAL ---
interface QuickScoreProps {
	match: Match;
	onClose: () => void;
	onSave: (match: Match) => void;
}

const QuickScoreModal: React.FC<QuickScoreProps> = ({
	match,
	onClose,
	onSave,
}) => {
	const [scores, setScores] = useState<{ p1: string; p2: string }[]>([
		{ p1: "", p2: "" },
		{ p1: "", p2: "" },
		{ p1: "", p2: "" },
		{ p1: "", p2: "" },
		{ p1: "", p2: "" },
	]);
	const [status, setStatus] = useState<MatchStatus>(MatchStatus.COMPLETED);
	const [walkoverWinner, setWalkoverWinner] = useState<1 | 2 | null>(null);

	const handleScoreChange = (
		index: number,
		player: "p1" | "p2",
		value: string
	) => {
		const newScores = [...scores];
		newScores[index][player] = value;
		setScores(newScores);
	};

	const handleSave = () => {
		const validScores = scores
			.filter((s) => s.p1 !== "" && s.p2 !== "")
			.map((s) => ({ p1: parseInt(s.p1), p2: parseInt(s.p2) }));

		let winnerId = undefined;

		if (status === MatchStatus.WALKOVER && walkoverWinner) {
			winnerId = walkoverWinner === 1 ? match.player1?.id : match.player2?.id;
		} else {
			// Auto calc winner based on games
			let p1Games = 0,
				p2Games = 0;
			validScores.forEach((s) => {
				if (s.p1 > s.p2) p1Games++;
				else p2Games++;
			});
			if (p1Games > p2Games) winnerId = match.player1?.id;
			else if (p2Games > p1Games) winnerId = match.player2?.id;
		}

		if (!winnerId) {
			alert("Could not determine winner. Please check scores.");
			return;
		}

		onSave({
			...match,
			scores: validScores,
			status: status,
			winnerId: winnerId,
		});
		onClose();
	};

	return (
		<div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-bold flex items-center gap-2">
						<Zap className="text-yellow-500" size={20} /> Quick Result
					</h3>
					<button onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className="flex items-center justify-between mb-4 px-2">
					<div className="text-center w-1/3">
						<div className="font-bold truncate">{match.player1?.name}</div>
						{status === MatchStatus.WALKOVER && (
							<button
								onClick={() => setWalkoverWinner(1)}
								className={`text-xs px-2 py-1 rounded mt-1 border ${
									walkoverWinner === 1
										? "bg-green-100 text-green-700 border-green-200"
										: "text-slate-400"
								}`}
							>
								Winner
							</button>
						)}
					</div>
					<div className="text-sm font-bold text-slate-400">vs</div>
					<div className="text-center w-1/3">
						<div className="font-bold truncate">{match.player2?.name}</div>
						{status === MatchStatus.WALKOVER && (
							<button
								onClick={() => setWalkoverWinner(2)}
								className={`text-xs px-2 py-1 rounded mt-1 border ${
									walkoverWinner === 2
										? "bg-green-100 text-green-700 border-green-200"
										: "text-slate-400"
								}`}
							>
								Winner
							</button>
						)}
					</div>
				</div>

				<div className="space-y-3 mb-6">
					<div className="flex gap-2 justify-center mb-2">
						<button
							onClick={() => setStatus(MatchStatus.COMPLETED)}
							className={`px-3 py-1 text-xs rounded-full border ${
								status === MatchStatus.COMPLETED
									? "bg-blue-600 text-white border-blue-600"
									: "text-slate-500"
							}`}
						>
							Normal
						</button>
						<button
							onClick={() => setStatus(MatchStatus.WALKOVER)}
							className={`px-3 py-1 text-xs rounded-full border ${
								status === MatchStatus.WALKOVER
									? "bg-blue-600 text-white border-blue-600"
									: "text-slate-500"
							}`}
						>
							Walkover / Retired
						</button>
					</div>

					{status === MatchStatus.COMPLETED &&
						scores.map((s, i) => (
							<div key={i} className="flex items-center justify-center gap-4">
								<span className="text-xs font-bold text-slate-400 w-6">
									G{i + 1}
								</span>
								<input
									type="number"
									className="w-16 p-2 text-center border rounded font-mono font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
									value={s.p1}
									onChange={(e) => handleScoreChange(i, "p1", e.target.value)}
									placeholder="0"
								/>
								<span className="text-slate-300">-</span>
								<input
									type="number"
									className="w-16 p-2 text-center border rounded font-mono font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
									value={s.p2}
									onChange={(e) => handleScoreChange(i, "p2", e.target.value)}
									placeholder="0"
								/>
							</div>
						))}
				</div>

				<button
					onClick={handleSave}
					className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2"
				>
					<Check size={18} /> Confirm Result
				</button>
			</div>
		</div>
	);
};

// --- MATCH CARD ---
interface MatchCardProps {
	match: Match;
	isPlate?: boolean;
	isHighlighted?: boolean;
	onStartMatch: (match: Match) => void;
	onEdit: (match: Match) => void;
	onQuickScore: (match: Match) => void;
	onPreview: (match: Match) => void;
	onPlayerClick: (id: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
	match,
	isPlate,
	isHighlighted,
	onStartMatch,
	onEdit,
	onQuickScore,
	onPreview,
	onPlayerClick,
}) => {
	const { checkConflict } = useData();
	const { permissions } = useAuth();

	// Check conflict
	const conflictMsg =
		match.startTime && match.court
			? checkConflict(
					match.id,
					match.court,
					match.startTime,
					match.player1?.id,
					match.player2?.id
			  )
			: null;
	const hasConflict = !!conflictMsg;

	return (
		<div className="flex items-center my-2 break-inside-avoid relative w-full justify-center z-10 px-2">
			<div
				className={`w-full max-w-[280px] transition-transform duration-300 ${
					isHighlighted ? "scale-105 z-20" : ""
				}`}
			>
				<div
					className={`relative bg-white border rounded-lg shadow-sm overflow-visible hover:shadow-md transition-all group print:border-slate-800 print:shadow-none 
                ${
									isHighlighted
										? "ring-4 ring-yellow-400 shadow-xl border-yellow-400"
										: hasConflict
										? "border-red-500 ring-1 ring-red-500 bg-red-50"
										: isPlate
										? "border-orange-200"
										: "border-slate-300"
								}`}
				>
					{hasConflict && (
						<div
							className="absolute -top-2 -right-2 z-30 bg-red-500 text-white rounded-full p-1 shadow-sm animate-pulse"
							title={conflictMsg || "Conflict"}
						>
							<AlertTriangle size={12} />
						</div>
					)}

					<div
						className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 flex justify-between items-center ${
							isPlate
								? "bg-orange-50 text-orange-700"
								: "bg-slate-50 text-slate-500"
						} print:bg-white print:text-black`}
					>
						<span className="truncate max-w-[100px] flex items-center gap-1">
							{isPlate && <Shield size={10} />}
							{match.id.split("-").pop()} {/* Show M1, M2 etc */}
						</span>
						<div className="flex gap-2 items-center">
							{match.startTime ? (
								<span className="flex items-center gap-1">
									<Clock size={10} /> {match.startTime}
								</span>
							) : (
								<span className="text-slate-300 italic">TBD</span>
							)}
							{match.court && (
								<span className="flex items-center gap-1">
									<MapPin size={10} /> {match.court.replace("Court ", "C")}
								</span>
							)}
						</div>
					</div>

					<div className="p-0 relative">
						{/* Player 1 Row */}
						<div
							className={`flex justify-between items-center px-3 py-2 border-b border-slate-50 ${
								match.winnerId && match.winnerId === match.player1?.id
									? "bg-green-50/50"
									: ""
							}`}
						>
							<div className="flex flex-col overflow-hidden">
								<button
									onClick={(e) => {
										e.stopPropagation();
										match.player1 &&
											!match.player1.id.startsWith("placeholder") &&
											onPlayerClick(match.player1.id);
									}}
									className={`text-left text-sm truncate font-medium hover:text-blue-600 hover:underline transition-colors ${
										match.player1?.id.startsWith("placeholder")
											? "text-slate-400 italic"
											: match.winnerId === match.player1?.id
											? "text-green-700 font-bold"
											: "text-slate-700"
									}`}
								>
									{match.player1 ? match.player1.name : "Bye"}
								</button>
								{match.partner1Name && (
									<span className="text-[10px] text-slate-400 flex items-center gap-1">
										<Users size={8} /> {match.partner1Name}
									</span>
								)}
							</div>
							{match.status === MatchStatus.COMPLETED && (
								<span className="text-xs font-bold text-slate-800 bg-slate-100 px-1.5 rounded ml-2">
									{match.scores.filter((s) => s.p1 > s.p2).length}
								</span>
							)}
						</div>

						{/* Player 2 Row */}
						<div
							className={`flex justify-between items-center px-3 py-2 ${
								match.winnerId && match.winnerId === match.player2?.id
									? "bg-green-50/50"
									: ""
							}`}
						>
							<div className="flex flex-col overflow-hidden">
								<button
									onClick={(e) => {
										e.stopPropagation();
										match.player2 &&
											!match.player2.id.startsWith("placeholder") &&
											onPlayerClick(match.player2.id);
									}}
									className={`text-left text-sm truncate font-medium hover:text-blue-600 hover:underline transition-colors ${
										match.player2?.id.startsWith("placeholder")
											? "text-slate-400 italic"
											: match.winnerId === match.player2?.id
											? "text-green-700 font-bold"
											: "text-slate-700"
									}`}
								>
									{match.player2 ? match.player2.name : "Bye"}
								</button>
								{match.partner2Name && (
									<span className="text-[10px] text-slate-400 flex items-center gap-1">
										<Users size={8} /> {match.partner2Name}
									</span>
								)}
							</div>
							{match.status === MatchStatus.COMPLETED && (
								<span className="text-xs font-bold text-slate-800 bg-slate-100 px-1.5 rounded ml-2">
									{match.scores.filter((s) => s.p2 > s.p1).length}
								</span>
							)}
						</div>

						{/* Hover Actions */}
						<div
							className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden cursor-pointer"
							onClick={() => onPreview(match)}
						>
							{permissions.canManageEvent && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										onEdit(match);
									}}
									className="p-1.5 bg-white text-slate-700 rounded-full hover:bg-slate-100 shadow-sm border border-slate-200"
									title="Edit Schedule"
								>
									<Edit size={14} />
								</button>
							)}
							{permissions.canScore &&
								match.player1 &&
								match.player2 &&
								match.status !== MatchStatus.COMPLETED && (
									<>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onQuickScore(match);
											}}
											className="p-1.5 bg-white text-yellow-600 rounded-full hover:bg-yellow-50 shadow-sm border border-yellow-200"
											title="Quick Result"
										>
											<Zap size={14} />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onStartMatch(match);
											}}
											className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm hover:bg-blue-700 flex items-center gap-1"
										>
											<PlayCircle size={12} /> Score
										</button>
									</>
								)}
						</div>
					</div>

					{match.referee && (
						<div className="px-2 py-0.5 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 flex justify-end items-center gap-1">
							<UserCheck size={8} /> {match.referee}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// ... (GroupStandings) ...
const GroupStandings: React.FC<{ matches: Match[]; players: Player[] }> = ({
	matches,
	players,
}) => {
	const stats: Record<
		string,
		{
			p: Player;
			played: number;
			wins: number;
			losses: number;
			gf: number;
			ga: number;
			points: number;
		}
	> = {};
	players.forEach((p) => {
		stats[p.id] = { p, played: 0, wins: 0, losses: 0, gf: 0, ga: 0, points: 0 };
	});
	matches.forEach((m) => {
		if (m.status === MatchStatus.COMPLETED && m.player1 && m.player2) {
			const s1 = stats[m.player1.id];
			const s2 = stats[m.player2.id];
			if (!s1 || !s2) return;
			s1.played++;
			s2.played++;
			let p1g = 0,
				p2g = 0;
			m.scores.forEach((g) => {
				if (g.p1 > g.p2) p1g++;
				else p2g++;
			});
			s1.gf += p1g;
			s1.ga += p2g;
			s2.gf += p2g;
			s2.ga += p1g;
			if (m.winnerId === m.player1.id) {
				s1.wins++;
				s2.losses++;
				s1.points += 1;
			} else {
				s2.wins++;
				s1.losses++;
				s2.points += 1;
			}
		}
	});
	const sortedStats = Object.values(stats).sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		return b.gf - b.ga - (a.gf - a.ga);
	});
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm text-left border-collapse">
				<thead className="bg-slate-50 text-slate-500 uppercase text-xs">
					<tr>
						<th className="px-3 py-2">Pos</th>
						<th className="px-3 py-2">Player</th>
						<th className="px-3 py-2 text-center">P</th>
						<th className="px-3 py-2 text-center">W</th>
						<th className="px-3 py-2 text-center">L</th>
						<th className="px-3 py-2 text-center">Games</th>
						<th className="px-3 py-2 text-center">Pts</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{sortedStats.map((stat, i) => (
						<tr key={stat.p.id} className={i < 2 ? "bg-green-50/50" : ""}>
							<td className="px-3 py-2 font-bold text-slate-400">{i + 1}</td>
							<td className="px-3 py-2 font-medium">{stat.p.name}</td>
							<td className="px-3 py-2 text-center text-slate-500">
								{stat.played}
							</td>
							<td className="px-3 py-2 text-center text-green-600 font-bold">
								{stat.wins}
							</td>
							<td className="px-3 py-2 text-center text-red-400">
								{stat.losses}
							</td>
							<td className="px-3 py-2 text-center text-slate-500 text-xs">
								{stat.gf}-{stat.ga}
							</td>
							<td className="px-3 py-2 text-center font-bold text-slate-900 bg-slate-50/50">
								{stat.points}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

// INTERACTIVE COURT SCHEDULER
const CourtScheduler: React.FC<{
	matches: Match[];
	onEdit: (m: Match) => void;
	onPlaceMatch: (court: string, time: string) => void;
	movingMatch: Match | null;
}> = ({ matches, onEdit, onPlaceMatch, movingMatch }) => {
	const courts = ["Center", "Court 1", "Court 2", "Court 3"];
	const timeSlots = Array.from({ length: 13 }, (_, i) => 9 + i * 0.75);

	const formatTime = (decimalTime: number) => {
		const hrs = Math.floor(decimalTime);
		const mins = Math.round((decimalTime - hrs) * 60);
		return `${hrs.toString().padStart(2, "0")}:${mins
			.toString()
			.padStart(2, "0")}`;
	};

	const getMatchStyle = (startTime: string) => {
		if (!startTime) return { left: 0, width: 0, display: "none" };
		const parts = startTime.split(":").map(Number);
		const h = parts[0] || 0;
		const m = parts[1] || 0;
		const decimal = h + m / 60;
		const startOffset = 9;
		const duration = 0.75;
		const totalDuration = 9;
		const left = ((decimal - startOffset) / totalDuration) * 100;
		const width = (duration / totalDuration) * 100;
		return { left: `${left}%`, width: `${width}%` };
	};

	return (
		<div
			className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto relative ${
				movingMatch ? "cursor-crosshair ring-2 ring-blue-400 ring-offset-2" : ""
			}`}
		>
			{movingMatch && (
				<div className="absolute top-2 right-2 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse pointer-events-none">
					Select a slot to place: {movingMatch.player1?.name} vs{" "}
					{movingMatch.player2?.name}
				</div>
			)}
			<div className="min-w-[800px] p-6">
				<div className="flex border-b border-slate-200 mb-4 pb-2">
					<div className="w-24 font-bold text-slate-400 text-xs uppercase tracking-wider">
						Court
					</div>
					<div className="flex-1 relative h-6">
						{timeSlots.map((t, i) => (
							<div
								key={i}
								className="absolute text-xs text-slate-400 -translate-x-1/2"
								style={{ left: `${(i / (timeSlots.length - 1)) * 100}%` }}
							>
								{formatTime(t)}
							</div>
						))}
					</div>
				</div>

				<div className="space-y-4">
					{courts.map((court) => (
						<div key={court} className="flex items-center h-16 group">
							<div className="w-24 font-bold text-slate-700 text-sm flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										court === "Center" ? "bg-purple-500" : "bg-slate-300"
									}`}
								></div>
								{court}
							</div>
							<div className="flex-1 relative h-full bg-slate-50 rounded-lg border border-slate-100 group-hover:border-slate-300 transition-colors overflow-hidden">
								{/* Grid Lines & Click Targets */}
								{timeSlots.map((t, i) => {
									if (i === timeSlots.length - 1) return null; // Skip last line for slot logic
									return (
										<div
											key={i}
											onClick={() =>
												movingMatch && onPlaceMatch(court, formatTime(t))
											}
											className={`absolute top-0 bottom-0 border-l border-slate-200 border-dashed z-0 hover:bg-blue-100/50 transition-colors ${
												movingMatch ? "hover:bg-blue-200/80 cursor-pointer" : ""
											}`}
											style={{
												left: `${(i / (timeSlots.length - 1)) * 100}%`,
												width: `${(1 / (timeSlots.length - 1)) * 100}%`,
											}}
											title={movingMatch ? `Place here: ${formatTime(t)}` : ""}
										></div>
									);
								})}

								{/* Matches */}
								{matches
									.filter((m) => m.court === court && m.startTime)
									.map((m) => (
										<button
											key={m.id}
											onClick={() => onEdit(m)}
											className={`absolute top-1 bottom-1 rounded px-2 flex flex-col justify-center text-[10px] overflow-hidden hover:z-20 hover:shadow-md transition-all z-10
                                            ${
																							m.status === MatchStatus.COMPLETED
																								? "bg-slate-200 text-slate-500"
																								: m.status ===
																								  MatchStatus.IN_PROGRESS
																								? "bg-green-100 text-green-700 border-green-300 border"
																								: m.id === movingMatch?.id
																								? "bg-blue-600 text-white shadow-xl scale-105 ring-2 ring-white opacity-50"
																								: m.id.includes("PLATE")
																								? "bg-orange-100 text-orange-700 border-orange-200 border"
																								: "bg-blue-100 text-blue-700 border-blue-200 border"
																						}`}
											style={getMatchStyle(m.startTime || "")}
											title={`${m.startTime} - ${m.roundName}`}
										>
											<div className="font-bold truncate">{m.roundName}</div>
											<div className="truncate opacity-75">
												{m.player1?.name} vs {m.player2?.name}
											</div>
										</button>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

const TournamentPage: React.FC<Props> = ({ language, onStartMatch }) => {
	const {
		matches: globalMatches,
		setMatches: setGlobalMatches,
		players: globalPlayers,
		updateMatch,
		checkConflict,
		officials,
		updatePlayer,
	} = useData();
	const { permissions } = useAuth();

	const [activeTab, setActiveTab] = useState<
		"DRAW" | "PLATE" | "SCHEDULE" | "GROUPS" | "ENTRIES"
	>("DRAW");
	const [loadingAI, setLoadingAI] = useState(false);
	const [seedingSuggestion, setSeedingSuggestion] = useState<string | null>(
		null
	);
	const [showAddEntry, setShowAddEntry] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	const [tournamentMeta, setTournamentMeta] = useState({
		name: "National Squash Championship 2024",
		subtitle: "Mens Open • Knockout 32 • Shanghai",
		location: "Shanghai",
		date: "2024-10-01",
		format: "Singles" as "Singles" | "Doubles",
	});
	const [groupCount, setGroupCount] = useState(2);
	const [generatedGroups, setGeneratedGroups] = useState<
		{ name: string; players: Player[]; matches: Match[] }[]
	>([]);
	const [editingMatch, setEditingMatch] = useState<Match | null>(null);
	const [quickScoreMatch, setQuickScoreMatch] = useState<Match | null>(null);
	const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
	const [previewStats, setPreviewStats] = useState<{
		h2h: string;
		prediction: string | null;
	}>({ h2h: "", prediction: null });
	const [editForm, setEditForm] = useState({
		startTime: "",
		court: "",
		referee: "",
		partner1: "",
		partner2: "",
	});
	const [conflictWarning, setConflictWarning] = useState<string | null>(null);
	const [newEntry, setNewEntry] = useState({
		name: "",
		partnerName: "",
		club: "",
		rank: 0,
		points: 0,
	});
	const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
	const [players, setPlayers] = useState<Player[]>(globalPlayers);
	const [entrySearch, setEntrySearch] = useState("");

	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
	const [drawSearch, setDrawSearch] = useState("");

	// Move Match State
	const [movingMatch, setMovingMatch] = useState<Match | null>(null);

	useEffect(() => {
		setPlayers(globalPlayers);
	}, [globalPlayers]);

	const t = {
		draw: language === "CN" ? "正赛签表" : "Main Draw",
		plate: language === "CN" ? "遗材赛(败者组)" : "Plate Event",
		schedule: language === "CN" ? "赛程表" : "Schedule",
		groups: language === "CN" ? "小组循环赛" : "Group Stage",
		entries: language === "CN" ? "报名与种子" : "Entries & Seeding",
		print: language === "CN" ? "打印对阵表" : "Print Draw",
		export: language === "CN" ? "导出Excel" : "Export XLS",
		add: language === "CN" ? "添加报名" : "Add Entry",
		aiSeeding: language === "CN" ? "AI智能定种子" : "AI Smart Seeding",
		analyzing: language === "CN" ? "分析中..." : "Analyzing...",
		generateGroups: language === "CN" ? "生成分组" : "Generate Groups",
		generateDraw: language === "CN" ? "生成签表" : "Generate Draw",
		groupCount: language === "CN" ? "分组数量" : "Number of Groups",
		editSchedule: language === "CN" ? "调整赛程" : "Edit Schedule",
		startTime: language === "CN" ? "比赛时间" : "Start Time",
		court: language === "CN" ? "比赛场地" : "Court",
		referee: language === "CN" ? "裁判" : "Referee",
		assignRef: language === "CN" ? "指派裁判" : "Assign Referee",
		settings: language === "CN" ? "赛事设置" : "Settings",
		save: language === "CN" ? "保存" : "Save",
		cancel: language === "CN" ? "取消" : "Cancel",
		format: language === "CN" ? "赛制模式" : "Tournament Mode",
		singles: language === "CN" ? "单打" : "Singles",
		doubles: language === "CN" ? "双打" : "Doubles",
		partner: language === "CN" ? "搭档" : "Partner",
		conflict: language === "CN" ? "冲突警告" : "Conflict Warning",
		pairUp: language === "CN" ? "组合配对" : "Pair Up",
		unpair: language === "CN" ? "拆分组合" : "Unpair",
		autoSchedule: language === "CN" ? "智能自动排程" : "Auto-Schedule",
		matchPreview: language === "CN" ? "赛前分析" : "Match Preview",
		h2h: language === "CN" ? "交手记录" : "Head to Head",
		prediction: language === "CN" ? "AI 胜率预测" : "AI Win Prediction",
		generatePlate: language === "CN" ? "生成遗材赛" : "Generate Plate",
		autoAssignRef: language === "CN" ? "智能指派裁判" : "Auto-Assign Refs",
		searchDraw:
			language === "CN" ? "搜索签表中球员..." : "Search player in draw...",
	};

	// ... (Event handlers omitted for brevity, logic remains same)
	const handleSmartSeeding = async () => {
		setLoadingAI(true);
		const suggestion = await suggestSeeding(players);
		setSeedingSuggestion(suggestion);
		setLoadingAI(false);
	};
	const handleAddEntry = () => {
		if (!newEntry.name) return;
		const newPlayer: Player = {
			id: Date.now().toString(),
			name: newEntry.name,
			partnerName:
				tournamentMeta.format === "Doubles" ? newEntry.partnerName : undefined,
			club: newEntry.club || "Unattached",
			rank: newEntry.rank || 999,
			points: newEntry.points || 0,
			gender: "M",
			status: "APPROVED",
		};
		setPlayers([...players, newPlayer]);
		setShowAddEntry(false);
		setNewEntry({ name: "", partnerName: "", club: "", rank: 0, points: 0 });
	};
	const handleCheckboxChange = (id: string) => {
		setSelectedEntryIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};
	const handlePairUp = () => {
		if (selectedEntryIds.length !== 2) {
			alert("Please select exactly 2 players to pair up.");
			return;
		}
		const p1 = players.find((p) => p.id === selectedEntryIds[0]);
		const p2 = players.find((p) => p.id === selectedEntryIds[1]);
		if (!p1 || !p2) return;
		const updatedP1 = { ...p1, partnerName: p2.name };
		const remainingPlayers = players.filter(
			(p) => p.id !== p1.id && p.id !== p2.id
		);
		setPlayers([...remainingPlayers, updatedP1]);
		setSelectedEntryIds([]);
	};
	const handleUnpair = () => {
		const entriesToUnpair = players.filter(
			(p) => selectedEntryIds.includes(p.id) && p.partnerName
		);
		if (entriesToUnpair.length === 0) return;
		let newPlayers = [...players];
		entriesToUnpair.forEach((entry) => {
			const originalEntryIndex = newPlayers.findIndex((p) => p.id === entry.id);
			if (originalEntryIndex === -1) return;
			const partnerName = newPlayers[originalEntryIndex].partnerName;
			newPlayers[originalEntryIndex] = {
				...newPlayers[originalEntryIndex],
				partnerName: undefined,
			};
			if (partnerName) {
				const newPartner: Player = {
					id: Date.now().toString() + Math.random(),
					name: partnerName,
					club: entry.club,
					rank: 999,
					points: 0,
					gender: entry.gender,
					status: "APPROVED",
				};
				newPlayers.push(newPartner);
			}
		});
		setPlayers(newPlayers);
		setSelectedEntryIds([]);
	};
	const handleUpdateRank = (player: Player, newRank: number) => {
		updatePlayer({ ...player, rank: newRank });
	};
	const handlePrint = () => {
		window.print();
	};
	const handleExportData = () => {
		const headers = [
			"Match ID",
			"Round",
			"Date",
			"Time",
			"Court",
			"Player 1",
			"Player 2",
			"Score",
			"Winner",
		];
		const rows = globalMatches.map((m) => [
			m.id,
			m.roundName,
			tournamentMeta.date,
			m.startTime || "TBD",
			m.court || "TBD",
			m.player1?.name || "Bye",
			m.player2?.name || "Bye",
			m.scores.map((s) => `${s.p1}-${s.p2}`).join(" "),
			m.winnerId === m.player1?.id
				? m.player1?.name
				: m.winnerId === m.player2?.id
				? m.player2?.name
				: "-",
		]);
		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", "tournament_data.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	const generateSeededIndices = (n: number): number[] => {
		if (n === 2) return [0, 1];
		const prev = generateSeededIndices(n / 2);
		const next: number[] = [];
		prev.forEach((p) => {
			next.push(p);
			next.push(n - 1 - p);
		});
		return next;
	};

	const handleGenerateDraw = (sourcePlayers: Player[] = players) => {
		const sortedPlayers = [...sourcePlayers].sort((a, b) => a.rank - b.rank);
		let size = 2;
		while (size < sortedPlayers.length) size *= 2;
		const bracketPlayers: (Player | null)[] = [...sortedPlayers];
		while (bracketPlayers.length < size) bracketPlayers.push(null);
		const indices = generateSeededIndices(size);
		const matches: Match[] = [];
		const matchCount = size / 2;
		for (let i = 0; i < matchCount; i++) {
			const idx1 = indices[i * 2];
			const idx2 = indices[i * 2 + 1];
			const p1 = bracketPlayers[idx1];
			const p2 = bracketPlayers[idx2];
			matches.push({
				id: `R${matchCount}-M${i + 1}`,
				tournamentId: "T1",
				roundName:
					matchCount === 4
						? "Quarter Final"
						: matchCount === 2
						? "Semi Final"
						: matchCount === 1
						? "Final"
						: `Round of ${size}`,
				roundIndex: matchCount,
				player1: p1,
				player2: p2,
				partner1Name: p1?.partnerName,
				partner2Name: p2?.partnerName,
				scores: [],
				status: MatchStatus.SCHEDULED,
				startTime: "",
				court: "",
			});
		}
		let currentRoundMatchCount = matchCount / 2;
		while (currentRoundMatchCount >= 1) {
			for (let i = 0; i < currentRoundMatchCount; i++) {
				matches.push({
					id: `R${currentRoundMatchCount}-M${i + 1}`,
					tournamentId: "T1",
					roundName:
						currentRoundMatchCount === 2
							? "Semi Final"
							: currentRoundMatchCount === 1
							? "Final"
							: `Round of ${currentRoundMatchCount * 2}`,
					roundIndex: currentRoundMatchCount,
					player1: null,
					player2: null,
					scores: [],
					status: MatchStatus.SCHEDULED,
					startTime: "",
					court: "",
				});
			}
			currentRoundMatchCount /= 2;
		}
		setGlobalMatches(matches);
		setActiveTab("DRAW");
	};
	const handleGeneratePlate = () => {
		const maxRoundIndex = Math.max(
			...globalMatches
				.filter((m) => !m.id.includes("PLATE"))
				.map((m) => m.roundIndex || 0)
		);
		if (maxRoundIndex <= 1) {
			alert("Cannot generate Plate for Final only.");
			return;
		}
		const plateStartRoundIndex = maxRoundIndex / 2;
		const plateMatches: Match[] = [];
		let currentSize = plateStartRoundIndex;
		while (currentSize >= 1) {
			const matchCount = currentSize;
			for (let i = 0; i < matchCount; i++) {
				plateMatches.push({
					id: `PLATE-R${currentSize}-M${i + 1}`,
					tournamentId: "T1-PLATE",
					roundName:
						currentSize === 4
							? "Plate QF"
							: currentSize === 2
							? "Plate SF"
							: currentSize === 1
							? "Plate Final"
							: `Plate R${currentSize * 2}`,
					roundIndex: currentSize,
					player1: {
						id: `placeholder-p1-${currentSize}-${i}`,
						name:
							i === 0 && currentSize === plateStartRoundIndex
								? "Loser M1"
								: "TBD",
						rank: 999,
						club: "",
						gender: "M",
						status: "APPROVED",
						points: 0,
					},
					player2: {
						id: `placeholder-p2-${currentSize}-${i}`,
						name:
							i === 0 && currentSize === plateStartRoundIndex
								? "Loser M2"
								: "TBD",
						rank: 999,
						club: "",
						gender: "M",
						status: "APPROVED",
						points: 0,
					},
					scores: [],
					status: MatchStatus.SCHEDULED,
					startTime: "",
					court: "",
				});
			}
			currentSize /= 2;
		}
		const nonPlateMatches = globalMatches.filter(
			(m) => !m.id.includes("PLATE")
		);
		setGlobalMatches([...nonPlateMatches, ...plateMatches]);
		setActiveTab("PLATE");
		alert(
			"Plate Draw Generated! Update Main Draw results to populate players automatically."
		);
	};

	// ENHANCED AUTO SCHEDULE
	const handleAutoSchedule = () => {
		if (globalMatches.length === 0) return;

		const courts = ["Center", "Court 1", "Court 2"];
		const matchDuration = 45; // Minutes

		const roundIndices = Array.from(
			new Set(globalMatches.map((m) => m.roundIndex || 0))
		).sort((a, b) => (b as number) - (a as number)); // Descending

		let currentGlobalTime = 9 * 60; // 09:00 AM
		let updatedMatches = [...globalMatches];

		roundIndices.forEach((roundSize) => {
			const matchesInRound = updatedMatches.filter(
				(m) => m.roundIndex === roundSize
			);

			let courtIdx = 0;
			let roundStartTime = currentGlobalTime;

			matchesInRound.forEach((match, idx) => {
				if (match.startTime) return;

				const assignedTime = `${Math.floor(roundStartTime / 60)
					.toString()
					.padStart(2, "0")}:${(roundStartTime % 60)
					.toString()
					.padStart(2, "0")}`;
				const assignedCourt = courts[courtIdx];

				const mIndex = updatedMatches.findIndex((m) => m.id === match.id);
				if (mIndex !== -1) {
					updatedMatches[mIndex] = {
						...updatedMatches[mIndex],
						startTime: assignedTime,
						court: assignedCourt,
					};
				}

				courtIdx++;
				if (courtIdx >= courts.length) {
					courtIdx = 0;
					roundStartTime += matchDuration;
				}
			});
			currentGlobalTime = roundStartTime + matchDuration + 15; // Added small buffer between rounds
		});

		setGlobalMatches(updatedMatches);
		alert(`Smart Auto-Schedule Complete!`);
	};

	const handleGenerateGroups = () => {
		const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);
		const groups: { name: string; players: Player[]; matches: Match[] }[] = [];
		for (let i = 0; i < groupCount; i++) {
			groups.push({
				name: String.fromCharCode(65 + i),
				players: [],
				matches: [],
			});
		}
		sortedPlayers.forEach((player, index) => {
			const cycle = Math.floor(index / groupCount);
			const isEven = cycle % 2 === 0;
			const groupIndex = isEven
				? index % groupCount
				: groupCount - 1 - (index % groupCount);
			groups[groupIndex].players.push(player);
		});
		groups.forEach((group) => {
			const p = group.players;
			for (let i = 0; i < p.length; i++) {
				for (let j = i + 1; j < p.length; j++) {
					group.matches.push({
						id: `G${group.name}-${i}-${j}`,
						tournamentId: "T1",
						roundName: `Group ${group.name}`,
						player1: p[i],
						player2: p[j],
						partner1Name: p[i].partnerName,
						partner2Name: p[j].partnerName,
						scores: [],
						status: MatchStatus.SCHEDULED,
						court: `Court 1`,
						group: group.name,
						startTime: "10:00",
					});
				}
			}
		});
		setGeneratedGroups(groups);
		setActiveTab("GROUPS");
	};

	// Interactive Scheduling Handlers
	const handleScheduleClick = (match: Match) => {
		// If we are already moving this match, cancel move
		if (movingMatch?.id === match.id) {
			setMovingMatch(null);
			return;
		}
		setMovingMatch(match);
	};

	const handlePlaceMatch = (court: string, time: string) => {
		if (!movingMatch) return;

		const conflict = checkConflict(
			movingMatch.id,
			court,
			time,
			movingMatch.player1?.id,
			movingMatch.player2?.id
		);
		if (conflict) {
			if (!confirm(`Warning: ${conflict}\nDo you want to proceed anyway?`)) {
				return;
			}
		}

		const updated = { ...movingMatch, court, startTime: time };
		updateMatch(updated);
		setMovingMatch(null);
	};

	useEffect(() => {
		if (editingMatch && editForm.court && editForm.startTime) {
			const warning = checkConflict(
				editingMatch.id,
				editForm.court,
				editForm.startTime,
				editingMatch.player1?.id,
				editingMatch.player2?.id
			);
			setConflictWarning(warning);
		}
	}, [editForm.court, editForm.startTime, editingMatch]);

	const openEditModal = (match: Match) => {
		if (movingMatch) {
			// If in moving mode, clicking a match might mean swapping or placing?
			// For simplicity, just cancel move if clicking another match
			handleScheduleClick(match);
			return;
		}

		if (!permissions.canManageEvent) return;
		setEditingMatch(match);
		setEditForm({
			startTime: match.startTime || "",
			court: match.court || "",
			referee: match.referee || "",
			partner1: match.partner1Name || "",
			partner2: match.partner2Name || "",
		});
		setConflictWarning(null);
	};
	const handleUpdateMatch = () => {
		if (!editingMatch) return;
		const updated = {
			...editingMatch,
			startTime: editForm.startTime,
			court: editForm.court,
			referee: editForm.referee,
			partner1Name: editForm.partner1,
			partner2Name: editForm.partner2,
		};
		updateMatch(updated);
		setEditingMatch(null);
	};
	const handlePreviewMatch = async (match: Match) => {
		if (!match.player1 || !match.player2) return;
		setPreviewMatch(match);
		const p1Id = match.player1.id;
		const p2Id = match.player2.id;
		const history = globalMatches.filter(
			(m) =>
				m.status === MatchStatus.COMPLETED &&
				((m.player1?.id === p1Id && m.player2?.id === p2Id) ||
					(m.player1?.id === p2Id && m.player2?.id === p1Id))
		);
		const p1Wins = history.filter((m) => m.winnerId === p1Id).length;
		const p2Wins = history.filter((m) => m.winnerId === p2Id).length;
		const h2hStr = `${match.player1.name} wins: ${p1Wins}, ${match.player2.name} wins: ${p2Wins}`;
		setPreviewStats({ h2h: h2hStr, prediction: null });
		const pred = await predictMatch(match.player1, match.player2, h2hStr);
		setPreviewStats((prev) => ({ ...prev, prediction: pred }));
	};

	// ... (Auto Assign Referees logic omitted for brevity, same as before) ...
	const handleAutoAssignReferees = () => {
		if (officials.length === 0) {
			alert("No officials available to assign.");
			return;
		}
		let refIndex = 0;
		const updatedBracket = globalMatches.map((m) => {
			if (m.referee) return m;
			const ref = officials[refIndex];
			refIndex = (refIndex + 1) % officials.length;
			return { ...m, referee: ref.name };
		});
		setGlobalMatches(updatedBracket);
		alert(
			`Assigned referees to ${
				updatedBracket.filter(
					(m) =>
						m.referee &&
						!globalMatches.find((gm) => gm.id === m.id && gm.referee)
				).length
			} matches.`
		);
	};

	// Helper to render round matches with pair grouping for bracket visualization
	const renderRound = (roundIdx: number, matches: Match[], isPlate = false) => {
		// Sort to ensure correct pairing (Match 1 with Match 2)
		const sorted = [...matches].sort((a, b) => {
			const getIdx = (id: string): number => {
				const parts = id.split("-M");
				return parts.length > 1 ? parseInt(parts[1], 10) : 0;
			};
			return getIdx(a.id) - getIdx(b.id);
		});

		// Special case: Final (Round 1) has no pairs, just one match
		if (roundIdx === 1) {
			const m = sorted[0];
			const isHighlighted =
				drawSearch &&
				m &&
				(m.player1?.name.toLowerCase().includes(drawSearch.toLowerCase()) ||
					m.player2?.name.toLowerCase().includes(drawSearch.toLowerCase()));

			return (
				<div className="flex flex-col justify-around h-full">
					{m && (
						<MatchCard
							key={m.id}
							match={m}
							isPlate={isPlate}
							isHighlighted={!!isHighlighted}
							onStartMatch={onStartMatch}
							onEdit={openEditModal}
							onQuickScore={setQuickScoreMatch}
							onPreview={handlePreviewMatch}
							onPlayerClick={setSelectedPlayerId}
						/>
					)}
				</div>
			);
		}

		// Group into pairs
		const pairs: Match[][] = [];
		for (let i = 0; i < sorted.length; i += 2) {
			pairs.push([sorted[i], sorted[i + 1]].filter(Boolean));
		}

		return (
			<div className="flex flex-col justify-around h-full">
				{pairs.map((pair, pIdx) => (
					<div
						key={pIdx}
						className="flex flex-col justify-around relative h-full flex-1 max-h-[400px]"
					>
						{/* Connector Line using SVG for cleaner look */}
						<div className="absolute top-0 bottom-0 -right-4 w-4 pointer-events-none print:hidden z-0">
							<svg className="w-full h-full" preserveAspectRatio="none">
								<path
									d="M0,25% C10,25% 10,25% 10,50% C10,75% 10,75% 0,75%"
									fill="none"
									stroke={isPlate ? "#fdba74" : "#cbd5e1"}
									strokeWidth="1.5"
									vectorEffect="non-scaling-stroke"
								/>
								<line
									x1="10"
									y1="50%"
									x2="100%"
									y2="50%"
									stroke={isPlate ? "#fdba74" : "#cbd5e1"}
									strokeWidth="1.5"
								/>
							</svg>
						</div>

						{pair.map((m) => {
							const isHighlighted =
								drawSearch &&
								(m.player1?.name
									.toLowerCase()
									.includes(drawSearch.toLowerCase()) ||
									m.player2?.name
										.toLowerCase()
										.includes(drawSearch.toLowerCase()));
							return (
								<MatchCard
									key={m.id}
									match={m}
									isPlate={isPlate}
									isHighlighted={!!isHighlighted}
									onStartMatch={onStartMatch}
									onEdit={openEditModal}
									onQuickScore={setQuickScoreMatch}
									onPreview={handlePreviewMatch}
									onPlayerClick={setSelectedPlayerId}
								/>
							);
						})}
					</div>
				))}
			</div>
		);
	};

	// Calculate rounds present for main draw
	const mainRounds = useMemo(() => {
		const rounds = new Set<number>(
			globalMatches
				.filter((m) => !m.id.includes("PLATE"))
				.map((m) => m.roundIndex || 0)
		);
		return Array.from(rounds)
			.sort((a: number, b: number) => b - a)
			.filter((r: number) => r > 0);
	}, [globalMatches]);

	const plateRounds = useMemo(() => {
		const rounds = new Set<number>(
			globalMatches
				.filter((m) => m.id.includes("PLATE"))
				.map((m) => m.roundIndex || 0)
		);
		return Array.from(rounds)
			.sort((a: number, b: number) => b - a)
			.filter((r: number) => r > 0);
	}, [globalMatches]);

	// Filter entries
	const filteredEntries = useMemo(() => {
		return players.filter(
			(p) =>
				p.name.toLowerCase().includes(entrySearch.toLowerCase()) ||
				p.club.toLowerCase().includes(entrySearch.toLowerCase())
		);
	}, [players, entrySearch]);

	const unscheduledMatches = useMemo(() => {
		return globalMatches.filter((m) => !m.startTime || !m.court);
	}, [globalMatches]);

	return (
		<div className="h-full flex flex-col relative">
			{/* ... (Modals omitted, same as before) ... */}
			{selectedPlayerId && (
				<PlayerProfileModal
					playerId={selectedPlayerId}
					onClose={() => setSelectedPlayerId(null)}
				/>
			)}

			{quickScoreMatch && (
				<QuickScoreModal
					match={quickScoreMatch}
					onClose={() => setQuickScoreMatch(null)}
					onSave={updateMatch}
				/>
			)}

			{showSettings && (
				<div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Settings size={18} /> {t.settings}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									{t.groupCount}
								</label>
								<input
									type="number"
									min="2"
									max="16"
									className="w-full border p-2 rounded"
									value={groupCount}
									onChange={(e) => setGroupCount(parseInt(e.target.value))}
								/>
							</div>
						</div>
						<button
							onClick={() => setShowSettings(false)}
							className="mt-6 w-full py-2 bg-slate-900 text-white rounded font-medium"
						>
							Close
						</button>
					</div>
				</div>
			)}
			{previewMatch && (
				<div
					className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
					onClick={() => setPreviewMatch(null)}
				>
					<div
						className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="bg-slate-900 text-white p-6 relative">
							<div className="text-xs text-slate-400 uppercase font-bold tracking-widest text-center mb-2">
								{previewMatch.roundName}
							</div>
							<div className="flex justify-between items-center">
								<div
									className="text-center w-1/3 cursor-pointer hover:opacity-80 transition-opacity"
									onClick={() =>
										previewMatch.player1 &&
										setSelectedPlayerId(previewMatch.player1.id)
									}
								>
									<div className="text-2xl font-black truncate">
										{previewMatch.player1?.name}
									</div>
									<div className="text-sm text-slate-400">
										Rank {previewMatch.player1?.rank}
									</div>
								</div>
								<div className="text-xl font-mono font-bold text-slate-500">
									VS
								</div>
								<div
									className="text-center w-1/3 cursor-pointer hover:opacity-80 transition-opacity"
									onClick={() =>
										previewMatch.player2 &&
										setSelectedPlayerId(previewMatch.player2.id)
									}
								>
									<div className="text-2xl font-black truncate">
										{previewMatch.player2?.name}
									</div>
									<div className="text-sm text-slate-400">
										Rank {previewMatch.player2?.rank}
									</div>
								</div>
							</div>
							<button
								onClick={() => setPreviewMatch(null)}
								className="absolute top-4 right-4 text-slate-400 hover:text-white"
							>
								<X size={20} />
							</button>
						</div>
						<div className="p-6 space-y-6">
							<div>
								<h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
									<Activity size={16} /> {t.h2h}
								</h4>
								<div className="bg-slate-50 p-4 rounded-lg text-center font-bold text-slate-800 border border-slate-200">
									{previewStats.h2h}
								</div>
							</div>
							<div>
								<h4 className="text-sm font-bold text-purple-600 uppercase flex items-center gap-2 mb-2">
									<BrainCircuit size={16} /> {t.prediction}
								</h4>
								<div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-900 border border-purple-100 min-h-[80px]">
									{previewStats.prediction ? (
										previewStats.prediction
									) : (
										<span className="flex items-center gap-2 text-purple-400 animate-pulse">
											Analyzing stats...
										</span>
									)}
								</div>
							</div>
							{permissions.canScore && (
								<button
									onClick={() => {
										onStartMatch(previewMatch);
										setPreviewMatch(null);
									}}
									className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm"
								>
									Start Match
								</button>
							)}
						</div>
					</div>
				</div>
			)}
			{editingMatch && (
				<div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Edit size={18} /> {t.editSchedule}
						</h3>
						<div className="mb-4 text-sm text-slate-500">
							{editingMatch.roundName} • {editingMatch.player1?.name} vs{" "}
							{editingMatch.player2?.name}
						</div>
						{conflictWarning && (
							<div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 animate-pulse">
								<AlertTriangle size={16} /> {conflictWarning}
							</div>
						)}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									{t.startTime}
								</label>
								<input
									type="time"
									className="w-full border p-2 rounded"
									value={editForm.startTime}
									onChange={(e) =>
										setEditForm({ ...editForm, startTime: e.target.value })
									}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									{t.court}
								</label>
								<select
									className="w-full border p-2 rounded"
									value={editForm.court}
									onChange={(e) =>
										setEditForm({ ...editForm, court: e.target.value })
									}
								>
									<option value="">Select Court</option>
									<option value="Center">Center Court</option>
									<option value="Court 1">Court 1</option>
									<option value="Court 2">Court 2</option>
									<option value="Court 3">Court 3</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									{t.referee}
								</label>
								<select
									className="w-full border p-2 rounded"
									value={editForm.referee}
									onChange={(e) =>
										setEditForm({ ...editForm, referee: e.target.value })
									}
								>
									<option value="">{t.assignRef}</option>
									{officials.map((o) => (
										<option key={o.id} value={o.name}>
											{o.name}
										</option>
									))}
								</select>
							</div>
							{tournamentMeta.format === "Doubles" && (
								<>
									<div>
										<label className="block text-sm font-medium mb-1">
											P1 {t.partner}
										</label>
										<input
											type="text"
											className="w-full border p-2 rounded"
											value={editForm.partner1}
											onChange={(e) =>
												setEditForm({ ...editForm, partner1: e.target.value })
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											P2 {t.partner}
										</label>
										<input
											type="text"
											className="w-full border p-2 rounded"
											value={editForm.partner2}
											onChange={(e) =>
												setEditForm({ ...editForm, partner2: e.target.value })
											}
										/>
									</div>
								</>
							)}
						</div>
						<div className="flex gap-2 mt-6">
							<button
								onClick={() => setEditingMatch(null)}
								className="flex-1 py-2 border rounded font-medium"
							>
								{t.cancel}
							</button>
							<button
								onClick={handleUpdateMatch}
								className="flex-1 py-2 bg-blue-600 text-white rounded font-bold"
							>
								{t.save}
							</button>
						</div>
					</div>
				</div>
			)}
			{showAddEntry && (
				<div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Plus size={18} /> {t.add}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Name</label>
								<input
									className="w-full border p-2 rounded"
									value={newEntry.name}
									onChange={(e) =>
										setNewEntry({ ...newEntry, name: e.target.value })
									}
								/>
							</div>
							{tournamentMeta.format === "Doubles" && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{t.partner} Name
									</label>
									<input
										type="text"
										className="w-full border p-2 rounded"
										value={newEntry.partnerName}
										onChange={(e) =>
											setNewEntry({ ...newEntry, partnerName: e.target.value })
										}
									/>
								</div>
							)}
							<div>
								<label className="block text-sm font-medium mb-1">Club</label>
								<input
									type="text"
									className="w-full border p-2 rounded"
									value={newEntry.club}
									onChange={(e) =>
										setNewEntry({ ...newEntry, club: e.target.value })
									}
								/>
							</div>
							<div className="flex gap-2">
								<div className="flex-1">
									<label className="block text-sm font-medium mb-1">Rank</label>
									<input
										type="number"
										className="w-full border p-2 rounded"
										value={newEntry.rank}
										onChange={(e) =>
											setNewEntry({
												...newEntry,
												rank: parseInt(e.target.value),
											})
										}
									/>
								</div>
								<div className="flex-1">
									<label className="block text-sm font-medium mb-1">
										Points
									</label>
									<input
										type="number"
										className="w-full border p-2 rounded"
										value={newEntry.points}
										onChange={(e) =>
											setNewEntry({
												...newEntry,
												points: parseInt(e.target.value),
											})
										}
									/>
								</div>
							</div>
						</div>
						<div className="flex gap-2 mt-6">
							<button
								onClick={() => setShowAddEntry(false)}
								className="flex-1 py-2 border rounded font-medium"
							>
								{t.cancel}
							</button>
							<button
								onClick={handleAddEntry}
								className="flex-1 py-2 bg-blue-600 text-white rounded font-bold"
							>
								{t.save}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Main Header */}
			<div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
				<div>
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-bold text-slate-900">
							{tournamentMeta.name}
						</h1>
						<div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
							<span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
								{t.format}:
							</span>
							<button
								onClick={() =>
									setTournamentMeta({ ...tournamentMeta, format: "Singles" })
								}
								className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
									tournamentMeta.format === "Singles"
										? "bg-white text-blue-600 shadow-sm border border-slate-200"
										: "text-slate-500 hover:text-slate-700"
								}`}
							>
								{t.singles}
							</button>
							<button
								onClick={() =>
									setTournamentMeta({ ...tournamentMeta, format: "Doubles" })
								}
								className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
									tournamentMeta.format === "Doubles"
										? "bg-purple-600 text-white shadow-sm"
										: "text-slate-500 hover:text-slate-700"
								}`}
							>
								{tournamentMeta.format === "Doubles" && <Users size={10} />}
								{t.doubles}
							</button>
						</div>
					</div>
					<p className="text-sm text-slate-500 mt-1">
						{tournamentMeta.subtitle}
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={handlePrint}
						className="flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm font-medium hover:bg-slate-50"
					>
						<Printer size={16} /> {t.print}
					</button>
					<button
						onClick={handleExportData}
						className="flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm font-medium hover:bg-slate-50"
					>
						<Download size={16} /> {t.export}
					</button>
				</div>
			</div>

			<div className="bg-white px-4 border-b border-slate-200 print:hidden overflow-x-auto">
				<div className="flex gap-6">
					<button
						onClick={() => setActiveTab("DRAW")}
						className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 ${
							activeTab === "DRAW"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-slate-500"
						}`}
					>
						<ListTree size={16} /> {t.draw}
					</button>
					<button
						onClick={() => setActiveTab("PLATE")}
						className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 ${
							activeTab === "PLATE"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-slate-500"
						}`}
					>
						<Shield size={16} /> {t.plate}
					</button>
					<button
						onClick={() => setActiveTab("SCHEDULE")}
						className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 ${
							activeTab === "SCHEDULE"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-slate-500"
						}`}
					>
						<LayoutList size={16} /> {t.schedule}
					</button>
					<button
						onClick={() => setActiveTab("GROUPS")}
						className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 ${
							activeTab === "GROUPS"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-slate-500"
						}`}
					>
						<Grid size={16} /> {t.groups}
					</button>
					<button
						onClick={() => setActiveTab("ENTRIES")}
						className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 ${
							activeTab === "ENTRIES"
								? "border-blue-500 text-blue-600"
								: "border-transparent text-slate-500"
						}`}
					>
						<Trophy size={16} /> {t.entries}
					</button>
				</div>
			</div>

			<div className="flex-1 bg-slate-50 p-6 overflow-auto print:bg-white print:p-0">
				{activeTab === "ENTRIES" && (
					<div className="max-w-4xl mx-auto space-y-6 print:hidden">
						{/* ... Entries content omitted, unchanged ... */}
						{tournamentMeta.format === "Doubles" && (
							<div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-center gap-4">
								<span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
									<Users size={14} /> Doubles Management
								</span>
								<button
									onClick={handlePairUp}
									disabled={selectedEntryIds.length !== 2}
									className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
										selectedEntryIds.length === 2
											? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
											: "bg-purple-200 text-purple-400 cursor-not-allowed"
									}`}
								>
									<Link2 size={14} /> {t.pairUp} ({selectedEntryIds.length}/2)
								</button>
								<button
									onClick={handleUnpair}
									disabled={selectedEntryIds.length === 0}
									className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
										selectedEntryIds.length > 0
											? "bg-white text-red-600 border border-red-200 hover:bg-red-50"
											: "bg-white text-slate-300 border border-slate-100 cursor-not-allowed"
									}`}
								>
									<Unlink size={14} /> {t.unpair}
								</button>
							</div>
						)}
						<div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
							<div className="flex justify-between items-center mb-4">
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-lg">
										{t.entries} ({filteredEntries.length})
									</h3>
									{filteredEntries.length !== players.length && (
										<span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
											Filtered
										</span>
									)}
								</div>
								<div className="flex gap-2">
									<div className="relative">
										<Search
											className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
											size={14}
										/>
										<input
											type="text"
											placeholder="Search entries..."
											className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={entrySearch}
											onChange={(e) => setEntrySearch(e.target.value)}
										/>
									</div>
									<button
										onClick={() => setShowAddEntry(true)}
										className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-200"
									>
										<Plus size={14} /> {t.add}
									</button>
									<button
										onClick={handleSmartSeeding}
										disabled={loadingAI}
										className="flex items-center gap-2 text-purple-600 text-sm font-bold bg-purple-50 px-3 py-1.5 rounded hover:bg-purple-100 border border-purple-100"
									>
										<Wand2 size={14} /> {loadingAI ? t.analyzing : t.aiSeeding}
									</button>
								</div>
							</div>
							<table className="w-full text-sm text-left">
								<thead className="bg-slate-50 text-slate-500 uppercase text-xs">
									<tr>
										{tournamentMeta.format === "Doubles" && (
											<th className="px-4 py-2 w-10 text-center">Select</th>
										)}
										<th className="px-4 py-2">Rank</th>
										<th className="px-4 py-2">Name</th>
										{tournamentMeta.format === "Doubles" && (
											<th className="px-4 py-2 text-purple-700">Partner</th>
										)}
										<th className="px-4 py-2">Club</th>
										<th className="px-4 py-2">Points</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredEntries
										.sort((a, b) => a.rank - b.rank)
										.map((p) => (
											<tr
												key={p.id}
												className={`${
													selectedEntryIds.includes(p.id) ? "bg-purple-50" : ""
												} cursor-pointer hover:bg-slate-50`}
												onClick={() => setSelectedPlayerId(p.id)}
											>
												{tournamentMeta.format === "Doubles" && (
													<td
														className="px-4 py-3 text-center"
														onClick={(e) => e.stopPropagation()}
													>
														<input
															type="checkbox"
															checked={selectedEntryIds.includes(p.id)}
															onChange={() => handleCheckboxChange(p.id)}
															className="rounded text-purple-600 focus:ring-purple-500"
														/>
													</td>
												)}
												<td
													className="px-4 py-3 text-center w-16 font-bold"
													onClick={(e) => e.stopPropagation()}
												>
													<input
														type="number"
														value={p.rank}
														onChange={(e) =>
															handleUpdateRank(p, parseInt(e.target.value))
														}
														className="w-12 text-center border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent"
													/>
												</td>
												<td className="px-4 py-3 font-medium text-blue-600 hover:underline">
													{p.name}
												</td>
												{tournamentMeta.format === "Doubles" && (
													<td className="px-4 py-3 text-purple-700 font-medium">
														{p.partnerName ? (
															<div className="flex items-center gap-2 bg-purple-100 w-fit px-2 py-1 rounded text-xs">
																<Link2 size={12} /> {p.partnerName}
															</div>
														) : (
															<span className="text-slate-300 italic text-xs">
																No Partner
															</span>
														)}
													</td>
												)}
												<td className="px-4 py-3 text-slate-500">{p.club}</td>
												<td className="px-4 py-3 text-slate-500">{p.points}</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
						<div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-end gap-2">
							<button
								onClick={handleGenerateGroups}
								className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50"
							>
								{t.generateGroups}
							</button>
							<button
								onClick={() => handleGenerateDraw(players)}
								className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-900"
							>
								{t.generateDraw}
							</button>
						</div>
					</div>
				)}

				{/* MAIN DRAW */}
				{activeTab === "DRAW" && (
					<div className="flex flex-col h-full">
						{/* ... (Toolbar omitted, same as before) ... */}
						{globalMatches.length > 0 && (
							<div className="mb-4 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm print:hidden">
								<div className="text-sm text-slate-500 font-medium flex items-center gap-2">
									<span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
										Knockout
									</span>
									{globalMatches.filter((m) => !m.id.includes("PLATE")).length}{" "}
									Matches
								</div>
								<div className="flex gap-4 items-center">
									{/* NEW: Draw Search Bar */}
									<div className="relative">
										<Search
											className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
											size={14}
										/>
										<input
											type="text"
											placeholder={t.searchDraw}
											value={drawSearch}
											onChange={(e) => setDrawSearch(e.target.value)}
											className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										/>
									</div>
									<div className="h-4 w-px bg-slate-200 mx-2"></div>
									<div className="flex gap-2">
										<button
											onClick={handleGeneratePlate}
											className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-100 border border-orange-200 transition-colors"
										>
											<Shield size={16} /> {t.generatePlate}
										</button>
										<button
											onClick={handleAutoAssignReferees}
											className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-100 border border-teal-200 transition-colors"
										>
											<UserCheck size={16} /> {t.autoAssignRef}
										</button>
										<button
											onClick={handleAutoSchedule}
											className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200 transition-colors"
										>
											<CalendarClock size={16} /> {t.autoSchedule}
										</button>
									</div>
								</div>
							</div>
						)}

						<div className="flex flex-row overflow-x-auto min-w-full pb-4 items-start flex-1 print:overflow-visible print:flex-wrap">
							{mainRounds.length === 0 ? (
								<div className="w-full text-center py-20 text-slate-400">
									<Shuffle size={48} className="mx-auto mb-4 opacity-50" />
									<p>No draw generated.</p>
								</div>
							) : (
								mainRounds.map((roundIdx) => {
									const roundMatches = globalMatches.filter(
										(m) => m.roundIndex === roundIdx && !m.id.includes("PLATE")
									);
									if (roundMatches.length === 0) return null;
									const roundName =
										roundIdx === 4
											? "Quarter Finals"
											: roundIdx === 2
											? "Semi Finals"
											: roundIdx === 1
											? "Final"
											: `Round of ${roundIdx * 2}`;
									return (
										<div
											key={roundIdx}
											className="flex flex-col min-w-[320px] px-4 gap-0 h-full print:min-w-[30%] print:h-auto"
										>
											<h3 className="text-center text-xs font-bold uppercase text-slate-400 mb-2">
												{roundName}
											</h3>
											{renderRound(roundIdx, roundMatches, false)}
										</div>
									);
								})
							)}
						</div>
					</div>
				)}

				{/* PLATE DRAW */}
				{activeTab === "PLATE" && (
					<div className="flex flex-col h-full">
						<div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200 shadow-sm print:hidden">
							<div className="text-sm text-orange-700 font-medium flex items-center gap-2">
								<Shield size={16} /> Plate Event (Consolation)
							</div>
						</div>

						<div className="flex flex-row overflow-x-auto min-w-full pb-4 items-start flex-1 print:overflow-visible print:flex-wrap">
							{plateRounds.length === 0 ? (
								<div className="w-full text-center py-20 text-slate-400">
									<Shield size={48} className="mx-auto mb-4 opacity-50" />
									<p>No plate draw generated yet.</p>
								</div>
							) : (
								plateRounds.map((roundIdx) => {
									const roundMatches = globalMatches.filter(
										(m) => m.roundIndex === roundIdx && m.id.includes("PLATE")
									);
									if (roundMatches.length === 0) return null;
									const roundName =
										roundIdx === 4
											? "Plate QF"
											: roundIdx === 2
											? "Plate SF"
											: roundIdx === 1
											? "Plate Final"
											: `Plate R${roundIdx * 2}`;
									return (
										<div
											key={roundIdx}
											className="flex flex-col min-w-[320px] px-4 gap-0 h-full print:min-w-[30%] print:h-auto"
										>
											<h3 className="text-center text-xs font-bold uppercase text-orange-400 mb-2">
												{roundName}
											</h3>
											{renderRound(roundIdx, roundMatches, true)}
										</div>
									);
								})
							)}
						</div>
					</div>
				)}

				{/* SCHEDULE */}
				{activeTab === "SCHEDULE" && (
					<div className="h-full flex gap-4">
						<div className="flex-1 flex flex-col min-w-0">
							<div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 print:hidden flex justify-between items-center">
								<div>
									<h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
										<LayoutList size={18} /> Court Schedule
									</h3>
									<p className="text-sm text-slate-500">
										{movingMatch ? (
											<span className="text-blue-600 font-bold flex items-center gap-2 animate-pulse">
												<Move size={14} /> Moving: {movingMatch.player1?.name}{" "}
												vs {movingMatch.player2?.name} (Click a slot to place)
											</span>
										) : (
											"Click a scheduled match to move it, or a match on the right to schedule."
										)}
									</p>
								</div>
								{movingMatch && (
									<button
										onClick={() => setMovingMatch(null)}
										className="text-sm text-red-500 font-bold border border-red-200 px-3 py-1 rounded bg-red-50 hover:bg-red-100"
									>
										Cancel Move
									</button>
								)}
							</div>
							<CourtScheduler
								matches={globalMatches}
								onEdit={handleScheduleClick}
								onPlaceMatch={handlePlaceMatch}
								movingMatch={movingMatch}
							/>
						</div>

						{/* Unscheduled Sidebar */}
						<div className="w-72 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden print:hidden">
							<div className="p-4 border-b border-slate-100 bg-slate-50">
								<h3 className="font-bold text-sm text-slate-700 flex items-center justify-between">
									Unscheduled
									<span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
										{unscheduledMatches.length}
									</span>
								</h3>
							</div>
							<div className="flex-1 overflow-y-auto p-2 space-y-2">
								{unscheduledMatches.length === 0 ? (
									<div className="text-center py-10 text-slate-400 text-xs italic">
										All matches scheduled
									</div>
								) : (
									unscheduledMatches.map((m) => (
										<button
											key={m.id}
											onClick={() => handleScheduleClick(m)}
											className={`w-full text-left p-3 border rounded-lg hover:shadow-sm transition-all group relative ${
												movingMatch?.id === m.id
													? "bg-blue-50 border-blue-400 ring-2 ring-blue-200"
													: "bg-white border-slate-200 hover:border-blue-400"
											}`}
										>
											{movingMatch?.id === m.id && (
												<div className="absolute right-2 top-2">
													<MousePointerClick
														size={16}
														className="text-blue-500 animate-bounce"
													/>
												</div>
											)}
											<div className="flex justify-between items-start mb-1">
												<span className="text-top font-bold uppercase text-slate-400 bg-slate-100 px-1.5 rounded">
													{m.roundName}
												</span>
											</div>
											<div className="text-sm font-bold text-slate-800 truncate">
												{m.player1?.name || "TBD"}
											</div>
											<div className="text-xs text-slate-500 truncate">
												vs {m.player2?.name || "TBD"}
											</div>
										</button>
									))
								)}
							</div>
						</div>
					</div>
				)}

				{/* GROUPS */}
				{activeTab === "GROUPS" && (
					<div className="space-y-8">
						{generatedGroups.length === 0 ? (
							<div className="text-center py-20 text-slate-400">
								<Grid size={48} className="mx-auto mb-4 opacity-50" />
								<p>No groups generated. Go to "Entries" to generate groups.</p>
							</div>
						) : (
							generatedGroups.map((group) => (
								<div
									key={group.name}
									className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
								>
									<div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
										<h3 className="font-bold text-lg text-slate-800">
											Group {group.name}
										</h3>
										<span className="text-sm text-slate-500">
											{group.players.length} Players
										</span>
									</div>
									<div className="p-6">
										<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
											Standings
										</h4>
										<GroupStandings
											matches={group.matches}
											players={group.players}
										/>

										<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">
											Matches
										</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{group.matches.map((m) => (
												<MatchCard
													key={m.id}
													match={m}
													onStartMatch={onStartMatch}
													onEdit={openEditModal}
													onQuickScore={setQuickScoreMatch}
													onPreview={handlePreviewMatch}
													onPlayerClick={setSelectedPlayerId}
												/>
											))}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TournamentPage;
