import React, { useState } from 'react';
import { sampleScanResult } from '../../utils/mockData';

interface ResultsScreenProps {
  onNewScan: () => void;
  onBack: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ onNewScan, onBack }) => {
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const scanResult = sampleScanResult;
  const hasCriticalIssues = scanResult.summary.critical > 0;
  const hasWarnings = scanResult.summary.warning > 0;
  const hasAnyIssues = hasCriticalIssues || hasWarnings;

  const getOverallStatus = () => {
    if (hasCriticalIssues) {
      return {
        icon: '🚨',
        title: '重大な問題',
        message: '重要な問題が検出されました',
        bgColor: '#fee',
        borderColor: '#f5c6cb'
      };
    } else if (hasWarnings) {
      return {
        icon: '⚠️',
        title: '注意が必要',
        message: 'いくつかの問題が検出されました',
        bgColor: '#fff3cd',
        borderColor: '#ffeaa7'
      };
    } else {
      return {
        icon: '✅',
        title: '問題なし',
        message: '重大な問題は検出されませんでした',
        bgColor: '#d4edda',
        borderColor: '#c3e6cb'
      };
    }
  };

  const status = getOverallStatus();

  const handleExport = (format: 'json' | 'markdown') => {
    // モック実装
    const data = format === 'json' 
      ? JSON.stringify(scanResult, null, 2)
      : generateMarkdownReport();
    
    console.log(`Exporting as ${format}:`, data);
    alert(`${format.toUpperCase()}形式でエクスポートしました（モック）`);
    setShowExportMenu(false);
  };

  const generateMarkdownReport = () => {
    return `# スキャン結果レポート

## ファイル情報
- **ファイル名**: ${scanResult.fileName}
- **スキャン日時**: ${scanResult.scanDate.toLocaleString('ja-JP')}
- **AIプロバイダー**: ${scanResult.provider}

## 問題の概要
- 🚨 Critical: ${scanResult.summary.critical}件
- ⚠️ Warning: ${scanResult.summary.warning}件
- ℹ️ Info: ${scanResult.summary.info}件

## 検出された問題
${scanResult.results.map(result => `
### ${result.title}
- **重要度**: ${result.severity}
- **カテゴリ**: ${result.category}
- **ファイル**: ${result.filePath || 'N/A'}
- **詳細**: ${result.message}
- **推奨対応**: ${result.recommendation || 'N/A'}
`).join('\n')}
`;
  };

  if (showDetailedResults) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-semibold text-gray-900 m-0">スキャン結果 - {scanResult.fileName}</h1>
          <button className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1" onClick={() => setShowDetailedResults(false)}>
            ×
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-100 px-8 py-4 border-b border-gray-200 text-sm">
          <strong>【免責事項】</strong> この分析結果はAI(Claude)によるものです。
          製作者（朔日工房 (tsuitachi-studio) / 鴇峰朔華）は分析結果の正確性・完全性について一切の責任を負いません。
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Scan Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 スキャン概要</h3>
            <hr className="border-gray-200 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <strong className="text-gray-900">スキャン日時:</strong> <span className="text-gray-700">{scanResult.scanDate.toLocaleString('ja-JP')}</span>
              </div>
              <div>
                <strong className="text-gray-900">AIプロバイダー:</strong> <span className="text-gray-700">Claude Sonnet 4</span>
              </div>
              <div>
                <strong className="text-gray-900">ファイル数:</strong> <span className="text-gray-700">45個</span>
              </div>
              <div>
                <strong className="text-gray-900">パッケージサイズ:</strong> <span className="text-gray-700">{(scanResult.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="card mb-4">
            <h3>🔍 検出された問題</h3>
            <hr style={{ margin: '1rem 0' }} />
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '1.5rem' }}>⛔</span>
                <strong> Critical ({scanResult.summary.critical})</strong>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <strong> Warning ({scanResult.summary.warning})</strong>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                <strong> Info ({scanResult.summary.info})</strong>
              </div>
            </div>

            {/* Issue List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {scanResult.results
                .filter(result => result.severity === 'warning')
                .map(result => (
                <div key={result.id} className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{result.title}</h4>
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📄 {result.filePath}
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0' }}>{result.message}</p>
                      {result.recommendation && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <strong>推奨対応:</strong> {result.recommendation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {scanResult.summary.info > 0 && (
                <details>
                  <summary style={{ cursor: 'pointer', padding: '0.5rem 0' }}>
                    <strong>ℹ️ Info ({scanResult.summary.info}) - すべて表示</strong>
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {scanResult.results
                      .filter(result => result.severity === 'info')
                      .map(result => (
                      <div key={result.id} style={{ padding: '0.5rem', backgroundColor: 'var(--background-light)', borderRadius: '0.25rem' }}>
                        <strong>{result.title}</strong> - {result.filePath}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* No Issues */}
            <div className="card" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>✅ 問題なし</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>セキュリティリスク: 検出されませんでした</li>
                <li>外部通信: 検出されませんでした</li>
                <li>悪意のあるコード: 検出されませんでした</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                エクスポート
              </button>
              {showExportMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  boxShadow: 'var(--shadow)',
                  zIndex: 10,
                  minWidth: '150px'
                }}>
                  <button 
                    className="btn" 
                    style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: 0 }}
                    onClick={() => handleExport('json')}
                  >
                    JSON形式
                  </button>
                  <button 
                    className="btn" 
                    style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: 0 }}
                    onClick={() => handleExport('markdown')}
                  >
                    Markdown形式
                  </button>
                </div>
              )}
            </div>
            <button className="btn btn-secondary" onClick={() => setShowDetailedResults(false)}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold text-gray-900 m-0 mb-2">{scanResult.fileName}</h2>
          </div>

          {/* Status Card */}
          <div className="p-8 rounded-lg border mb-8" style={{
            backgroundColor: status.bgColor,
            borderColor: status.borderColor
          }}>
            <div className="text-6xl mb-4">{status.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 m-0 mb-2">{status.title}</h3>
            <p className="text-lg text-gray-800 m-0">{status.message}</p>
          </div>

          {/* Summary Stats */}
          {hasAnyIssues && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 text-left">
              <h4 className="font-medium text-gray-900 mb-4">検出された問題</h4>
              <div className="flex gap-4">
                {scanResult.summary.critical > 0 && (
                  <div>
                    <span className="text-red-600">⛔ {scanResult.summary.critical}</span>
                  </div>
                )}
                {scanResult.summary.warning > 0 && (
                  <div>
                    <span className="text-yellow-600">⚠️ {scanResult.summary.warning}</span>
                  </div>
                )}
                {scanResult.summary.info > 0 && (
                  <div>
                    <span className="text-gray-500">ℹ️ {scanResult.summary.info}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <button 
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => setShowDetailedResults(true)}
            >
              詳細を見る
            </button>
            <button 
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={onNewScan}
            >
              新しくスキャン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;