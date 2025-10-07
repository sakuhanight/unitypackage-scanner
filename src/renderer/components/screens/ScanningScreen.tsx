import React, { useState, useEffect } from 'react';
import { ScanProgress } from '@/shared/types';

interface ScanningScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ScanningScreen: React.FC<ScanningScreenProps> = ({ onComplete, onCancel }) => {
  const [progress, setProgress] = useState<ScanProgress>({
    stage: 'parsing',
    percentage: 0,
    currentFile: undefined,
    message: 'スキャンを開始しています...'
  });

  // モックスキャンプロセス
  useEffect(() => {
    let timeoutId: number;
    
    const simulateScan = () => {
      const stages = [
        { stage: 'parsing' as const, duration: 2000, message: 'パッケージを展開しています...' },
        { stage: 'analyzing' as const, duration: 4000, message: 'ファイルを分析中...' },
        { stage: 'complete' as const, duration: 1000, message: 'AIによる検証中...' }
      ];

      let currentStageIndex = 0;
      let currentProgress = 0;

      const updateProgress = () => {
        const currentStage = stages[currentStageIndex];
        
        if (currentStageIndex < stages.length) {
          const stageProgress = Math.min(100, currentProgress + (100 / (currentStage.duration / 100)));
          const overallProgress = ((currentStageIndex * 100) + stageProgress) / stages.length;
          
          setProgress({
            stage: currentStage.stage,
            percentage: Math.round(overallProgress),
            currentFile: currentStage.stage === 'analyzing' ? getRandomFile() : undefined,
            message: currentStage.message
          });

          currentProgress = stageProgress;
          
          if (stageProgress >= 100) {
            currentStageIndex++;
            currentProgress = 0;
          }

          if (currentStageIndex >= stages.length) {
            setTimeout(onComplete, 500);
          } else {
            timeoutId = window.setTimeout(updateProgress, 100);
          }
        }
      };

      updateProgress();
    };

    simulateScan();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [onComplete]);

  const getRandomFile = () => {
    const files = [
      'Scripts/PlayerController.cs',
      'Scripts/EnemySpawner.cs',
      'Scripts/UIManager.cs',
      'Scripts/GameManager.cs',
      'Scripts/NetworkManager.cs',
      'Prefabs/Player.prefab',
      'Materials/Ground.mat',
      'Textures/UI_Background.png'
    ];
    return files[Math.floor(Math.random() * files.length)];
  };

  const getStatusIcon = () => {
    switch (progress.stage) {
      case 'parsing': return '📦';
      case 'analyzing': return '🔍';
      case 'complete': return '🤖';
      default: return '⏳';
    }
  };

  const getStatusText = () => {
    switch (progress.stage) {
      case 'parsing': return 'パッケージを展開しました';
      case 'analyzing': return `ファイルを分析中... (${Math.floor(progress.percentage / 2)}/45)`;
      case 'complete': return 'AIによる検証中...';
      default: return 'スキャン中...';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900 m-0">ゆにぱけスキャナー</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖 Claude</span>
            <button className="inline-flex items-center justify-center px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1">
              変更
            </button>
          </div>
          <button className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1">
            ⚙️ 設定
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-center max-w-lg w-full">
          {/* File Info */}
          <div className="mb-8">
            <div className="text-3xl mb-2">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 m-0 mb-2">MyAwesomePackage.unitypackage</h2>
          </div>

          {/* Status */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 m-0 mb-4">スキャン中...</h3>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-primary-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {progress.percentage}%
            </div>
          </div>

          {/* Status Details */}
          <div className="bg-gray-50 p-6 rounded-lg text-left mb-8">
            <div className="flex items-center mb-2">
              {progress.stage === 'parsing' && (
                <>
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-900">パッケージを展開しました</span>
                </>
              )}
              {progress.stage !== 'parsing' && (
                <>
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-900">パッケージを展開しました</span>
                </>
              )}
            </div>

            <div className="flex items-center mb-2">
              {progress.stage === 'analyzing' && (
                <>
                  <span className="mr-2">⏳</span>
                  <span className="text-gray-900">{getStatusText()}</span>
                </>
              )}
              {progress.stage === 'complete' && (
                <>
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-900">ファイルを分析中... (45/45)</span>
                </>
              )}
              {progress.stage === 'parsing' && (
                <>
                  <span className="mr-2">⏳</span>
                  <span className="text-gray-900">ファイルを分析中... (0/45)</span>
                </>
              )}
            </div>

            <div className="flex items-center">
              {progress.stage === 'complete' ? (
                <>
                  <span className="mr-2">⏳</span>
                  <span className="text-gray-900">AIによる検証中...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">○</span>
                  <span className="text-gray-500">AIによる検証中...</span>
                </>
              )}
            </div>

            {progress.currentFile && (
              <div className="mt-4 p-2 bg-white rounded border text-sm">
                <strong className="text-gray-900">現在の分析ファイル:</strong> <span className="text-gray-700">{progress.currentFile}</span>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <button className="inline-flex items-center justify-center px-6 py-2 bg-gray-600 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanningScreen;