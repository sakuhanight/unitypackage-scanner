import React from 'react';

interface DisclaimerDialogProps {
  onAccept: () => void;
}

export const DisclaimerDialog: React.FC<DisclaimerDialogProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
              ご利用にあたって
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
            <p>
              <strong>ゆにぱけスキャナー</strong>をご利用いただき、ありがとうございます。
              本ツールを使用する前に、以下の重要な注意事項をお読みください。
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ 免責事項
              </h4>
              <ul className="space-y-2 text-yellow-700 dark:text-yellow-300">
                <li>• この分析結果はパターンマッチングによるものです</li>
                <li>• 製作者（朔日工房/鴇峰朔華）は分析結果の正確性・完全性について一切の責任を負いません</li>
                <li>• すべての脅威を検出できるわけではありません</li>
                <li>• 安全なコードが危険として検出される場合があります（誤検出）</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                ℹ️ 重要な制限事項
              </h4>
              <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                <li>• 意図的に難読化されたコードは検出が困難です</li>
                <li>• 最終的な安全性の判断はご自身で行ってください</li>
                <li>• 本ツールの結果のみに依存せず、総合的な判断を行ってください</li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ 安全性について
              </h4>
              <ul className="space-y-2 text-green-700 dark:text-green-300">
                <li>• 本ツールは完全にオフラインで動作します</li>
                <li>• スキャンしたファイルの内容が外部に送信されることはありません</li>
                <li>• AIを使用せず、パターンマッチングのみで分析を行います</li>
              </ul>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              本ソフトウェアはMITライセンスの下で提供されています。
              詳細は同梱のLICENSEファイルをご確認ください。
            </p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors focus-ring"
            >
              理解して続行
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};