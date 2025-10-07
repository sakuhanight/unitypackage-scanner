import { AnalysisResult, ScanResult, MockData } from '@/shared/types';

export const sampleAnalysisResults: AnalysisResult[] = [
  {
    id: '1',
    severity: 'warning',
    category: 'best_practice',
    title: '古いUnity APIの使用',
    message: 'WWWクラスが使用されています。UnityWebRequestへの移行を推奨します。',
    filePath: 'Scripts/PlayerController.cs',
    recommendation: 'WWWクラスをUnityWebRequestに置き換えてください。',
  },
  {
    id: '2',
    severity: 'warning',
    category: 'performance',
    title: 'パフォーマンスの懸念',
    message: 'Update内でGameObject.Findが使用されています。キャッシュの使用を検討してください。',
    filePath: 'Scripts/EnemySpawner.cs',
    recommendation: 'GameObject.Findの結果をキャッシュして、Update内での呼び出しを避けてください。',
  },
  {
    id: '3',
    severity: 'info',
    category: 'dependencies',
    title: '外部依存関係の検出',
    message: 'DOTweenライブラリが使用されています。',
    filePath: 'Scripts/UIAnimator.cs',
    recommendation: '依存関係が適切に管理されていることを確認してください。',
  },
  {
    id: '4',
    severity: 'info',
    category: 'best_practice',
    title: 'ネームスペースの使用',
    message: 'グローバルネームスペースでクラスが定義されています。',
    filePath: 'Scripts/GameManager.cs',
    recommendation: '適切なネームスペースを使用することを推奨します。',
  },
  {
    id: '5',
    severity: 'info',
    category: 'security',
    title: 'ハードコードされた設定値',
    message: 'ハードコードされたURLが見つかりました。',
    filePath: 'Scripts/NetworkManager.cs',
    recommendation: '設定値は外部ファイルまたはScriptableObjectで管理してください。',
  },
];

export const sampleScanResult: ScanResult = {
  id: 'scan-1',
  fileName: 'MyAwesomePackage.unitypackage',
  fileSize: 12582912, // 12MB
  scanDate: new Date(),
  provider: 'claude',
  results: sampleAnalysisResults,
  summary: {
    critical: 0,
    warning: 2,
    info: 3,
  },
};

export const mockData: MockData = {
  scanResults: [sampleScanResult],
  sampleAnalysisResults,
};

export default mockData;