import React, { useState, useCallback } from 'react';
import AppHeader from '../layout/AppHeader';
import Button from '../ui/Button';

interface MainScreenProps {
  onStartScan: (filePath: string) => void;
  onOpenSettings: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onStartScan, onOpenSettings }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const unityPackageFile = files.find(file => file.name.endsWith('.unitypackage'));
    
    if (unityPackageFile) {
      setSelectedFile(unityPackageFile.name);
      // モック用: ファイルパスの代わりにファイル名を使用
      onStartScan(unityPackageFile.name);
    } else {
      alert('.unitypackageファイルを選択してください');
    }
  }, [onStartScan]);

  const handleFileSelect = useCallback(() => {
    // モック用: ダミーファイル選択
    const mockFileName = 'MyAwesomePackage.unitypackage';
    setSelectedFile(mockFileName);
    onStartScan(mockFileName);
  }, [onStartScan]);

  return (
    <div className="h-screen flex flex-col">
      <AppHeader title="ゆにぱけスキャナー">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖 Claude</span>
          <Button variant="secondary" size="sm">
            変更
          </Button>
        </div>
        <Button variant="secondary" size="md" onClick={onOpenSettings}>
          ⚙️ 設定
        </Button>
      </AppHeader>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        {/* Drop Zone */}
        <div
          className={`w-full max-w-lg h-72 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-300 ${
            isDragOver 
              ? 'border-2 border-dashed border-primary-500 bg-primary-50' 
              : 'border-2 border-dashed border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
            .unitypackageファイルを<br />ここにドロップ
          </h3>
          <p className="text-gray-500 text-center m-0">
            またはクリックして選択
          </p>
        </div>

        {/* Tip */}
        <div className="bg-gray-50 p-4 rounded-lg text-center max-w-lg">
          <p className="m-0 text-sm text-gray-600">
            💡 Tip: アプリのショートカットにドロップしても起動できます
          </p>
        </div>

        {/* Recent Files (モック) */}
        <div className="w-full max-w-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">最近のスキャン</h3>
          <div className="flex flex-col gap-2">
            {[
              { name: 'DoTweenPro.unitypackage', date: '2025/10/07 14:30', status: '問題なし' },
              { name: 'TextMeshPro.unitypackage', date: '2025/10/07 12:15', status: '注意' }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.date}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  item.status === '問題なし' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status === '問題なし' ? '✅' : '⚠️'} {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;