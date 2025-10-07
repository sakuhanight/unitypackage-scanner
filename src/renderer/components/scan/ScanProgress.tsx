import React from 'react';

interface ScanProgressProps {
  progress: number;
  currentFile: string;
  onCancel: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  progress,
  currentFile,
  onCancel
}) => {
  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            スキャン中...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            パッケージの内容を分析しています
          </p>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>進行状況</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="scan-progress-bar h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 現在のファイル */}
        <div className="mb-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            現在の処理:
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
              {currentFile}
            </p>
          </div>
        </div>

        {/* スキャン手順 */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            実行中の処理:
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center ${progress > 10 ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">パッケージファイルの展開</span>
            </div>
            <div className={`flex items-center ${progress > 30 ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">C#スクリプトファイルの抽出</span>
            </div>
            <div className={`flex items-center ${progress > 50 ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">セキュリティパターンの検索</span>
            </div>
            <div className={`flex items-center ${progress > 80 ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">結果の集計とレポート生成</span>
            </div>
          </div>
        </div>

        {/* キャンセルボタン */}
        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};