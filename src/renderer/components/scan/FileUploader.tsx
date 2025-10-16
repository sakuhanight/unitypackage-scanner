import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (filePath: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);


  const handleButtonClick = useCallback(async () => {
    // Electron APIのファイルダイアログを使用
    if (window.electronAPI && window.electronAPI.openFileDialog) {
      try {
        const filePath = await window.electronAPI.openFileDialog();
        if (filePath) {
          onFileSelect(filePath);
        }
      } catch (error) {
        console.error('File dialog error:', error);
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const unityPackageFile = files.find(file => 
      file.name.toLowerCase().endsWith('.unitypackage')
    );
    
    if (unityPackageFile && window.electronAPI?.processDroppedFile) {
      try {
        const tempFilePath = await window.electronAPI.processDroppedFile(unityPackageFile);
        if (tempFilePath) {
          onFileSelect(tempFilePath);
        } else {
          console.error('Failed to process dropped file');
          // フォールバック: ファイルダイアログを開く
          handleButtonClick();
        }
      } catch (error) {
        console.error('Error processing dropped file:', error);
        // フォールバック: ファイルダイアログを開く
        handleButtonClick();
      }
    }
  }, [onFileSelect, handleButtonClick]);

  return (
    <div className="fade-in">
      <div
        className={`drop-area border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <svg
              className={`h-16 w-16 transition-colors ${
                isDragOver
                  ? 'text-blue-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              UnityPackageファイルを選択
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              .unitypackageファイルをドラッグ&ドロップするか、<br />
              下のボタンからファイルを選択してください
            </p>
          </div>
          
          <div>
            <button
              onClick={handleButtonClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors focus-ring"
            >
              ファイルを選択
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          📋 対応形式
        </h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• ファイル形式: .unitypackage</li>
          <li>• 最大ファイルサイズ: 100MB</li>
          <li>• Unity 2022.3.22f1 対応</li>
          <li>• 各種Unityアセット・パッケージファイル</li>
        </ul>
      </div>
    </div>
  );
};