import React, { useState } from 'react';
import { AIProvider, AppSettings } from '@/shared/types';
import AppHeader from '../layout/AppHeader';
import Card from '../layout/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Input from '../ui/Input';

interface SettingsScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'ja',
    maxFileSize: 100,
    analysisDepth: 'standard',
    showWelcomeDialog: true
  });

  const [providers] = useState([
    { id: 'claude' as AIProvider, name: 'Claude', connected: true, account: 'user@example.com' },
    { id: 'openai' as AIProvider, name: 'OpenAI', connected: false, account: null },
    { id: 'gemini' as AIProvider, name: 'Google Gemini', connected: false, account: null }
  ]);

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // TODO: Save settings to electron-store
    console.log('Saving settings:', settings);
    onSave();
  };

  const handleProviderAction = (providerId: AIProvider, action: 'connect' | 'reconnect' | 'disconnect') => {
    // TODO: Implement provider connection logic
    console.log(`${action} ${providerId}`);
    alert(`${action} ${providerId} (モック)`);
  };

  return (
    <div className="h-screen flex flex-col">
      <AppHeader title="設定" onBack={onBack} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Card title="【AIプロバイダー】">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {providers.map(provider => (
              <div key={provider.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--background-light)',
                borderRadius: '0.375rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="radio"
                    name="provider"
                    defaultChecked={provider.id === 'claude'}
                    disabled={!provider.connected}
                  />
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {provider.name} {provider.connected && '(連携済み)'}
                    </div>
                    {provider.account && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        アカウント: {provider.account}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {provider.connected ? (
                    <>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleProviderAction(provider.id, 'reconnect')}
                      >
                        再連携
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleProviderAction(provider.id, 'disconnect')}
                      >
                        連携解除
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => handleProviderAction(provider.id, 'connect')}
                    >
                      連携する
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="【分析オプション】">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="form-label">分析の深さ:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {(['quick', 'standard', 'deep'] as const).map(depth => (
                  <label key={depth} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="analysisDepth"
                      value={depth}
                      checked={settings.analysisDepth === depth}
                      onChange={() => handleSettingsChange('analysisDepth', depth)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {depth === 'quick' && '簡易'}
                    {depth === 'standard' && '標準'}
                    {depth === 'deep' && '詳細'}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                label="最大ファイルサイズ"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingsChange('maxFileSize', parseInt(e.target.value))}
                min={1}
                max={1000}
                className="w-24"
              />
              <span className="text-sm text-gray-600 mt-6">MB</span>
            </div>
          </div>
        </Card>

        <Card title="【アプリケーション】">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="form-label">テーマ:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {(['light', 'dark'] as const).map(theme => (
                  <label key={theme} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      checked={settings.theme === theme}
                      onChange={() => handleSettingsChange('theme', theme)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {theme === 'light' ? 'ライト' : 'ダーク'}
                  </label>
                ))}
              </div>
            </div>

            <Select
              label="言語"
              value={settings.language}
              onChange={(e) => handleSettingsChange('language', e.target.value)}
              options={[
                { value: 'ja', label: '日本語' },
                { value: 'en', label: 'English' }
              ]}
              className="w-48"
            />

            <Checkbox
              label="起動時に注意事項を表示する"
              checked={settings.showWelcomeDialog}
              onChange={(e) => handleSettingsChange('showWelcomeDialog', e.target.checked)}
            />
          </div>
        </Card>

        <Card title="【情報】">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>バージョン:</strong> 1.0.0
            </div>
            <div>
              <strong>製作:</strong> 朔日工房 (tsuitachi-studio) / 鴇峰朔華
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="https://tsuitachi.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>公式サイト</a>
              <a href="#" style={{ color: 'var(--primary-color)' }}>利用規約</a>
              <a href="#" style={{ color: 'var(--primary-color)' }}>ライセンス</a>
              <a href="https://github.com/sakuhanight/unitypackage-scanner" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>GitHub</a>
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="primary" onClick={handleSave}>
            保存
          </Button>
          <Button variant="secondary" onClick={onBack}>
            キャンセル
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;