import React, { useState } from 'react';
import { AIProvider } from '@/shared/types';

interface SetupScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('claude');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handleProviderSelect = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setApiKey('');
    setConnectionResult(null);
  };

  const handleConnectionTest = async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      // モック接続テスト
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (apiKey.length > 10) {
        setConnectionResult({ success: true });
      } else {
        setConnectionResult({ 
          success: false, 
          error: 'APIキーが短すぎます。正しいAPIキーを入力してください。' 
        });
      }
    } catch (error) {
      setConnectionResult({ 
        success: false, 
        error: '接続テストに失敗しました。' 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case 'claude':
        return {
          name: 'Claude API',
          description: 'Anthropic Claude APIと連携',
          authType: 'apikey' as const,
          placeholder: 'sk-ant-********************************',
          helpUrl: 'https://console.anthropic.com',
          helpText: '1. console.anthropic.com にアクセス\n2. API Keys > Create Key\n3. 生成されたキーをコピー'
        };
      case 'openai':
        return {
          name: 'OpenAI API',
          description: 'OpenAI APIと連携',
          authType: 'oauth' as const,
          placeholder: '',
          helpUrl: 'https://platform.openai.com',
          helpText: 'ブラウザでOpenAIの認証画面が開きます'
        };
      case 'gemini':
        return {
          name: 'Google Gemini API',
          description: 'Google Gemini APIと連携',
          authType: 'hybrid' as const,
          placeholder: '********************************',
          helpUrl: 'https://makersuite.google.com',
          helpText: 'ブラウザ連携またはAPIキー手動入力'
        };
    }
  };

  const renderStep1 = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Step 1/3: AIプロバイダー選択</h2>
      <p className="text-gray-600 mb-6">使用するAIサービスを選択してください</p>
      
      <div className="flex flex-col gap-4">
        {(['claude', 'openai', 'gemini'] as AIProvider[]).map((provider) => {
          const info = getProviderInfo(provider);
          return (
            <div
              key={provider}
              className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all duration-200 ${
                selectedProvider === provider 
                  ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleProviderSelect(provider)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedProvider === provider}
                  onChange={() => handleProviderSelect(provider)}
                  className="mr-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 m-0">{info.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-0">
                    {info.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
        <button 
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          onClick={onBack}
        >
          戻る
        </button>
        <button 
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => setCurrentStep(2)}
          disabled={!selectedProvider}
        >
          次へ
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const info = getProviderInfo(selectedProvider);
    
    if (info.authType === 'oauth') {
      return (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Step 2/3: API連携</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{info.name}</h3>
            <p className="text-gray-600 mb-4">💡 {info.helpText}</p>
            
            <div className="text-center mb-4">
              <button className="inline-flex items-center justify-center px-8 py-3 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                ブラウザで連携する
              </button>
            </div>

            <div className="text-center">
              <a href={info.helpUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline">
                APIキー取得方法を見る
              </a>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" onClick={() => setCurrentStep(1)}>
              戻る
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" onClick={() => setCurrentStep(3)}>
              次へ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Step 2/3: API連携</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{info.name}</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">APIキー:</label>
            <input
              type="password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder={info.placeholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              💡 APIキーの取得方法:
            </p>
            <pre className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap text-gray-700">
              {info.helpText}
            </pre>
          </div>

          <div className="mb-4">
            <a href={info.helpUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline text-sm">
              APIキー取得方法を見る
            </a>
          </div>

          <div className="text-center mb-4">
            <button
              className="inline-flex items-center justify-center px-6 py-2 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleConnectionTest}
              disabled={!apiKey || isConnecting}
            >
              {isConnecting ? '接続テスト中...' : '接続テスト'}
            </button>
          </div>

          {connectionResult && (
            <div className={`p-3 rounded-md border mb-4 ${
              connectionResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {connectionResult.success ? (
                <p className="text-green-800 text-sm m-0">✅ 接続に成功しました</p>
              ) : (
                <p className="text-red-800 text-sm m-0">❌ {connectionResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <button className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" onClick={() => setCurrentStep(1)}>
            戻る
          </button>
          <button 
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setCurrentStep(3)}
            disabled={!connectionResult?.success}
          >
            次へ
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Step 3/3: セットアップ完了！</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">セットアップが完了しました</h3>
        
        <p className="text-gray-600 mb-4">
          ✓ {getProviderInfo(selectedProvider).name}と連携しました
        </p>

        <p className="text-gray-600 mb-6">
          これで.unitypackageファイルをスキャンできます
        </p>

        <div className="text-left bg-gray-50 p-4 rounded-md border">
          <p className="font-semibold text-gray-900 m-0 mb-2">使い方:</p>
          <ul className="text-gray-700 ml-6 mt-2">
            <li>ウィンドウにファイルをドロップ</li>
            <li>またはショートカットにドロップ</li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-8">
        <button className="inline-flex items-center justify-center px-8 py-3 bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" onClick={onComplete}>
          始める
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col p-8 max-w-2xl mx-auto w-full">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default SetupScreen;