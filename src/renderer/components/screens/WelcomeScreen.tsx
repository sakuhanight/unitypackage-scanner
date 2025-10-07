import React, { useState } from 'react';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';

interface WelcomeScreenProps {
  onNext: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [skipNextTime, setSkipNextTime] = useState(false);

  const handleContinue = () => {
    if (agreedToTerms) {
      // TODO: Save skipNextTime preference
      onNext();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">ゆにぱけスキャナー - ご利用にあたって</h1>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">【重要な注意事項】</h3>
            <ul className="space-y-2 pl-6 list-disc text-gray-700">
              <li>このアプリはAI APIを利用します</li>
              <li>APIキーは各自で取得・管理してください</li>
              <li>API使用料金はユーザー様負担です</li>
              <li>分析結果はAIによるものであり、完全性を保証するものではありません</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">【製作者情報】</h3>
            <div className="space-y-1 text-gray-700">
              <p><span className="font-medium">サークル名:</span> 朔日工房 (tsuitachi-studio)</p>
              <p><span className="font-medium">製作者:</span> 鴇峰朔華</p>
              <p><span className="font-medium">ウェブサイト:</span> https://tsuitachi.net</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-warning-100 border border-warning-200 rounded-md">
            <p className="text-sm text-warning-800 m-0">
              ※本ツールの分析結果について、製作者は一切の責任を負いません
            </p>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">ご利用前に必ず <a href="#" className="text-primary-600 hover:text-primary-700 underline">利用規約</a> をお読みください</p>
          </div>

          <div className="mb-6 space-y-3">
            <Checkbox
              label="利用規約に同意する（必須）"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            
            <Checkbox
              label="次回から表示しない"
              checked={skipNextTime}
              onChange={(e) => setSkipNextTime(e.target.checked)}
            />
          </div>

          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={!agreedToTerms}
            >
              同意して続ける
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;