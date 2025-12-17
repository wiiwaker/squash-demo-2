import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./views/Dashboard";
import ScoringPage from "./views/ScoringPage";
import TournamentPage from "./views/TournamentPage";
import RankingsPage from "./views/RankingsPage";
import MembersPage from "./views/MembersPage";
import RepositoryPage from "./views/RepositoryPage";
import { Language, Match } from "./types";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider, useData } from "./contexts/DataContext";

const AppContent: React.FC = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [language, setLanguage] = useState<Language>("CN");
	const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

	const { updateMatch } = useData();

	const handleStartMatch = (match: Match) => {
		setCurrentMatch(match);
		setActiveTab("scoring");
	};

	const handleMatchUpdate = (updatedMatch: Match) => {
		setCurrentMatch(updatedMatch);
		updateMatch(updatedMatch); // Sync with global state
	};

	const renderContent = () => {
		switch (activeTab) {
			case "dashboard":
				return <Dashboard language={language} />;
			case "tournaments":
				return (
					<TournamentPage language={language} onStartMatch={handleStartMatch} />
				);
			case "scoring":
				return (
					<ScoringPage
						language={language}
						initialMatch={currentMatch}
						onMatchUpdate={handleMatchUpdate}
					/>
				);
			case "rankings":
				return <RankingsPage language={language} />;
			case "members":
				return <MembersPage language={language} />;
			case "repository":
				return <RepositoryPage language={language} />;
			default:
				return <Dashboard language={language} />;
		}
	};

	return (
		<Layout
			activeTab={activeTab}
			onTabChange={setActiveTab}
			language={language}
			setLanguage={setLanguage}
		>
			{renderContent()}
		</Layout>
	);
};

const App: React.FC = () => {
	return (
		<AuthProvider>
			<DataProvider>
				<AppContent />
			</DataProvider>
		</AuthProvider>
	);
};

export default App;
