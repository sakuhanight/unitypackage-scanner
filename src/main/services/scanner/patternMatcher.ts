import { ScanFinding, ExtractedFile } from '@/shared/types';
import { PatternLoader, CompiledPattern } from './patternLoader';
import { ExtensionDetector } from './extensionDetector';

/**
 * パターンマッチングによる検出エンジン
 */
export class PatternMatcher {
  private patterns: CompiledPattern[] = [];
  private patternLoader: PatternLoader;
  private extensionDetector: ExtensionDetector;

  constructor() {
    this.patternLoader = new PatternLoader();
    this.extensionDetector = new ExtensionDetector();
  }

  /**
   * デフォルトパターンを初期化
   */
  async initialize(): Promise<void> {
    this.patterns = await this.patternLoader.loadDefaultPatterns();
    await this.extensionDetector.initialize();
  }

  /**
   * 指定されたパターンファイルを読み込む
   */
  async loadPatterns(filePath: string, presetName?: string): Promise<void> {
    if (presetName) {
      this.patterns = await this.patternLoader.loadPatternsWithPreset(filePath, presetName);
    } else {
      this.patterns = await this.patternLoader.loadPatternsFromFile(filePath);
    }
  }

  /**
   * カスタムパターンを追加
   */
  addCustomPatterns(customPatterns: CompiledPattern[]): void {
    this.patterns.push(...customPatterns);
  }

  /**
   * 現在のパターン情報を取得
   */
  getPatternInfo(): { name: string; description: string; version: string; patternCount: number } | null {
    const info = this.patternLoader.getPatternFileInfo();
    if (!info) return null;
    
    return {
      ...info,
      patternCount: this.patterns.length
    };
  }

  /**
   * 利用可能なプリセット一覧を取得
   */
  getAvailablePresets() {
    return this.patternLoader.getAvailablePresets();
  }

  /**
   * 拡張子検出器を取得
   */
  getExtensionDetector(): ExtensionDetector {
    return this.extensionDetector;
  }

  /**
   * 拡張子検出設定を更新
   */
  async loadExtensionDefinitions(filePath: string, presetName?: string): Promise<void> {
    await this.extensionDetector.loadExtensionDefinitions(filePath, presetName);
  }

  /**
   * 抽出されたファイルからパターンマッチングを実行
   */
  scanFiles(extractedFiles: ExtractedFile[]): ScanFinding[] {
    const findings: ScanFinding[] = [];
    let findingIdCounter = 1;

    // 拡張子ベースの検出を実行
    const extensionFindings = this.extensionDetector.scanFiles(extractedFiles);
    
    // 拡張子検出結果をマージ（IDを調整）
    for (const extensionFinding of extensionFindings) {
      const standardFinding: ScanFinding = {
        id: findingIdCounter.toString(),
        severity: extensionFinding.severity,
        category: extensionFinding.category,
        pattern: extensionFinding.pattern,
        filePath: extensionFinding.filePath,
        lineNumber: extensionFinding.lineNumber,
        context: extensionFinding.context,
        description: extensionFinding.description
      };
      findings.push(standardFinding);
      findingIdCounter++;
    }

    // C#ファイルのみを対象にパターンマッチングスキャン
    const scriptFiles = extractedFiles.filter(file => 
      file.type === 'script' && file.content
    );

    for (const file of scriptFiles) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // コメント行はスキップ
        if (this.isCommentLine(line)) continue;

        for (const pattern of this.patterns) {
          const matches = Array.from(line.matchAll(pattern.regex));
          
          for (const _ of matches) {
            findings.push({
              id: findingIdCounter.toString(),
              severity: pattern.severity,
              category: pattern.category,
              pattern: pattern.name,
              filePath: file.path,
              lineNumber,
              context: line.trim(),
              description: pattern.description
            });
            findingIdCounter++;
          }
        }
      }
    }

    return findings;
  }

  /**
   * コメント行かどうかを判定
   */
  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*');
  }
}

// DetectionPatternインターフェースは削除（CompiledPatternを使用）