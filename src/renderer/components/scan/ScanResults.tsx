import React, { useState } from 'react';
import { ScanResult, ScanFinding, ExtractedFile } from '../../../shared/types';

interface ScanResultsProps {
  result: ScanResult;
  onReset: () => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ result, onReset }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'files'>('findings');

  const getSeverityColor = (severity: ScanFinding['severity']) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'warning':
        return 'severity-warning';
      case 'info':
        return 'severity-info';
      default:
        return 'severity-info';
    }
  };

  const getSeverityIcon = (severity: ScanFinding['severity']) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getOverallStatus = () => {
    if (result.summary.critical > 0) {
      return { icon: '🚨', text: '重大な問題を検出', color: 'text-red-600' };
    }
    if (result.summary.warning > 0) {
      return { icon: '⚠️', text: '注意が必要', color: 'text-yellow-600' };
    }
    if (result.summary.info > 0) {
      return { icon: 'ℹ️', text: '情報あり', color: 'text-blue-600' };
    }
    return { icon: '✅', text: '問題なし', color: 'text-green-600' };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: ExtractedFile['type']): string => {
    switch (type) {
      case 'script': return '📄';
      case 'dll': return '⚙️';
      case 'asset': return '🎨';
      case 'meta': return '📝';
      case 'other': return '📁';
      default: return '📄';
    }
  };

  const getFileTypeDisplayName = (type: ExtractedFile['type']): string => {
    switch (type) {
      case 'script': return 'スクリプト';
      case 'dll': return 'DLLファイル';
      case 'asset': return 'アセット';
      case 'meta': return 'メタファイル';
      case 'other': return 'その他';
      default: return type;
    }
  };

  const status = getOverallStatus();
  const categorizedFindings = result.findings.reduce((acc: Record<string, ScanFinding[]>, finding: ScanFinding) => {
    if (!acc[finding.category]) acc[finding.category] = [];
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, ScanFinding[]>);

  // パッケージ情報があるかチェック
  const packageInfo = result.packageInfo;
  
  // ファイルタイプごとにグループ化
  const groupedFiles = packageInfo?.extractedFiles.reduce((acc: Record<string, ExtractedFile[]>, file: ExtractedFile) => {
    if (!acc[file.type]) acc[file.type] = [];
    acc[file.type].push(file);
    return acc;
  }, {} as Record<string, ExtractedFile[]>) || {};

  return (
    <div className="fade-in space-y-6">
      {/* 概要カード */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{status.icon}</div>
            <div>
              <h2 className={`text-2xl font-bold ${status.color}`}>
                {status.text}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                スキャン完了: {new Date(result.scanDate).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{result.summary.critical}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{result.summary.warning}</div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Warning</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{result.summary.info}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Info</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{result.summary.total}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Total</div>
          </div>
        </div>

        {/* パッケージ情報 */}
        {packageInfo && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">📦 パッケージ情報</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">ファイル名</div>
                <div className="font-medium text-gray-900 dark:text-white truncate">{packageInfo.fileName}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">サイズ</div>
                <div className="font-medium text-gray-900 dark:text-white">{formatFileSize(packageInfo.fileSize)}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">総ファイル数</div>
                <div className="font-medium text-gray-900 dark:text-white">{packageInfo.fileCount}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">スクリプト</div>
                <div className="font-medium text-gray-900 dark:text-white">{packageInfo.scriptCount}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">DLL</div>
                <div className="font-medium text-gray-900 dark:text-white">{packageInfo.dllCount}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus-ring"
          >
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </button>
          <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors focus-ring">
            レポートをエクスポート
          </button>
        </div>
      </div>

      {/* 詳細結果 */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            詳細情報
          </h3>

          {/* タブナビゲーション */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'findings'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔍 検出結果 ({result.findings.length})
            </button>
            {packageInfo && (
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'files'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📁 ファイル一覧 ({packageInfo.fileCount})
              </button>
            )}
          </div>

          {/* 検出結果タブ */}
          {activeTab === 'findings' && (
            <div>
              {result.findings.length > 0 ? (
                <>
                  {/* カテゴリフィルター */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      すべて ({result.findings.length})
                    </button>
                    {Object.entries(categorizedFindings).map(([category, findings]: [string, ScanFinding[]]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category} ({findings.length})
                      </button>
                    ))}
                  </div>

                  {/* 検出項目一覧 */}
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {result.findings
                      .filter((finding: ScanFinding) => !selectedCategory || finding.category === selectedCategory)
                      .map((finding: ScanFinding) => (
                        <div
                          key={finding.id}
                          className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getSeverityIcon(finding.severity)}</span>
                              <span className="font-medium">{finding.severity.toUpperCase()}</span>
                              <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                {finding.category}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {finding.filePath}:{finding.lineNumber}
                            </span>
                          </div>
                          
                          <h4 className="font-medium mb-2">{finding.pattern}</h4>
                          <p className="text-sm mb-3">{finding.description}</p>
                          
                          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
                            <pre className="text-xs font-mono overflow-x-auto">
                              {finding.context}
                            </pre>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    検出された問題はありません
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    このパッケージからは危険なパターンは検出されませんでした
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ファイル一覧タブ */}
          {activeTab === 'files' && packageInfo && (
            <div>
              {/* ファイルタイプ統計 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(groupedFiles).map(([type, files]) => (
                  <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-xl">{getFileTypeIcon(type as ExtractedFile['type'])}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{files.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{getFileTypeDisplayName(type as ExtractedFile['type'])}</div>
                  </div>
                ))}
              </div>

              {/* ファイルタイプフィルター */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedFileType(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFileType === null
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  すべて ({packageInfo.fileCount})
                </button>
                {Object.entries(groupedFiles).map(([type, files]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFileType(type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedFileType === type
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getFileTypeIcon(type as ExtractedFile['type'])} {getFileTypeDisplayName(type as ExtractedFile['type'])} ({files.length})
                  </button>
                ))}
              </div>

              {/* ファイル一覧 */}
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {packageInfo.extractedFiles
                  .filter((file: ExtractedFile) => !selectedFileType || file.type === selectedFileType)
                  .sort((a, b) => a.path.localeCompare(b.path))
                  .map((file: ExtractedFile, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-lg">{getFileTypeIcon(file.type)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {file.path}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getFileTypeDisplayName(file.type)} • {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      {file.type === 'script' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            分析対象
                          </span>
                        </div>
                      )}
                      {file.type === 'dll' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            バイナリ
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* ファイル統計サマリー */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  表示中: {packageInfo.extractedFiles.filter((file: ExtractedFile) => !selectedFileType || file.type === selectedFileType).length} / {packageInfo.fileCount} ファイル
                  {selectedFileType && (
                    <span className="ml-2">
                      ({getFileTypeDisplayName(selectedFileType as ExtractedFile['type'])}のみ)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* アクション */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          新しいファイルをスキャン
        </button>
      </div>
    </div>
  );
};