import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/scan/FileUploader';
import { ScanProgress } from './components/scan/ScanProgress';
import { ScanResults } from './components/scan/ScanResults';
import { DisclaimerDialog } from './components/common/DisclaimerDialog';
import { ScanProgress as ScanProgressType, ScanResult } from '../shared/types';

type AppState = 'idle' | 'scanning' | 'completed' | 'error';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const handleFileSelect = useCallback(async (filePath: string) => {
    setAppState('scanning');
    setError(null);
    setProgress(0);
    setCurrentFile(filePath);

    let unsubscribeProgress: (() => void) | null = null;

    try {
      if (!window.electronAPI || !window.electronAPI.scanPackage) {
        throw new Error('Electron APIが利用できません。Electronアプリケーションとして実行してください。');
      }

      // 進行状況の監視を設定
      unsubscribeProgress = window.electronAPI.onScanProgress((progressData: ScanProgressType) => {
        setProgress(progressData.progress);
        setCurrentFile(progressData.message || progressData.currentFile || '');
      });

      const result = await window.electronAPI.scanPackage(filePath);
      
      setProgress(100);

      if (result.success && result.data) {
        setScanResult(result.data);
        setAppState('completed');
      } else {
        throw new Error(result.error?.message || 'スキャンに失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setAppState('error');
    } finally {
      // 進行状況の監視を解除
      if (unsubscribeProgress) {
        unsubscribeProgress();
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState('idle');
    setScanResult(null);
    setError(null);
    setProgress(0);
    setCurrentFile('');
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {showDisclaimer && (
        <DisclaimerDialog onAccept={handleDisclaimerAccept} />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            ゆにぱけスキャナー
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            UnityPackageファイルのセキュリティ分析ツール
          </p>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-4xl mx-auto">
          {appState === 'idle' && (
            <FileUploader onFileSelect={handleFileSelect} />
          )}

          {appState === 'scanning' && (
            <ScanProgress
              progress={progress}
              currentFile={currentFile}
              onCancel={handleReset}
            />
          )}

          {appState === 'completed' && scanResult && (
            <ScanResults
              result={scanResult}
              onReset={handleReset}
            />
          )}

          {appState === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    エラーが発生しました
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleReset}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      もう一度試す
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* フッター */}
        <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 朔日工房 (tsuitachi-studio) / 鴇峰朔華</p>
          <p className="mt-1">
            <a href="mailto:sakuha@tsuitachi.net" className="hover:text-gray-700 dark:hover:text-gray-200">
              sakuha@tsuitachi.net
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};