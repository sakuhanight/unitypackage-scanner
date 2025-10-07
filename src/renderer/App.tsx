import React, { useState } from 'react';
import { Screen } from '@/shared/types';
import WelcomeScreen from './components/screens/WelcomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import MainScreen from './components/screens/MainScreen';
import ScanningScreen from './components/screens/ScanningScreen';
import ResultsScreen from './components/screens/ResultsScreen';
import SettingsScreen from './components/screens/SettingsScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleStartScan = (filePath: string) => {
    setSelectedFile(filePath);
    setCurrentScreen('scanning');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('setup')} />;
      case 'setup':
        return (
          <SetupScreen
            onBack={() => setCurrentScreen('welcome')}
            onComplete={() => setCurrentScreen('main')}
          />
        );
      case 'main':
        return (
          <MainScreen
            onStartScan={handleStartScan}
            onOpenSettings={() => setCurrentScreen('settings')}
          />
        );
      case 'scanning':
        return (
          <ScanningScreen
            onComplete={() => setCurrentScreen('results')}
            onCancel={() => setCurrentScreen('main')}
          />
        );
      case 'results':
        return (
          <ResultsScreen
            onNewScan={() => setCurrentScreen('main')}
            onBack={() => setCurrentScreen('main')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen('main')}
            onSave={() => setCurrentScreen('main')}
          />
        );
      default:
        return <WelcomeScreen onNext={() => setCurrentScreen('setup')} />;
    }
  };

  return (
    <div className="app bg-gray-50">
      {renderScreen()}
    </div>
  );
};

export default App;