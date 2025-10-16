import * as fs from 'fs-extra';
import * as path from 'path';
import { ScanFinding, ExtractedFile } from '@/shared/types';
import { ExtensionConstants } from '../../constants';

export interface ExtensionRule {
  severity: ScanFinding['severity'];
  category: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  checkContent: boolean;
  metadata: {
    fileType: string;
    platform: string[];
    commonUses: string[];
  };
}

export interface ExtensionCategory {
  name: string;
  description: string;
  defaultSeverity: ScanFinding['severity'];
}

export interface ExtensionPreset {
  name: string;
  description: string;
  enabledExtensions: string[];
}

export interface ExtensionDefinitionFile {
  version: string;
  name: string;
  description: string;
  extensions: Record<string, ExtensionRule>;
  categories: Record<string, ExtensionCategory>;
  presets: Record<string, ExtensionPreset>;
}

export interface ExtensionFinding extends ScanFinding {
  fileType: string;
  riskLevel: string;
  platform: string[];
  extensionCategory: string;
}

/**
 * ファイル拡張子に基づく検出エンジン
 */
export class ExtensionDetector {
  private extensionRules: Record<string, ExtensionRule> = {};
  private categories: Record<string, ExtensionCategory> = {};
  private currentDefinitionFile: ExtensionDefinitionFile | null = null;
  private enabledExtensions: Set<string> = new Set();

  /**
   * デフォルト拡張子定義を読み込む
   */
  async initialize(): Promise<void> {
    await this.loadExtensionDefinitions(ExtensionConstants.getDefaultExtensionPath());
  }

  /**
   * 拡張子定義ファイルを読み込む
   */
  async loadExtensionDefinitions(filePath: string, presetName?: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const definitionFile: ExtensionDefinitionFile = JSON.parse(fileContent);
      
      this.currentDefinitionFile = definitionFile;
      this.extensionRules = definitionFile.extensions;
      this.categories = definitionFile.categories;
      
      // プリセットが指定されている場合は適用
      if (presetName) {
        if (!definitionFile.presets[presetName]) {
          throw new Error(`プリセット '${presetName}' が見つかりません`);
        }
        this.applyPreset(presetName);
      } else {
        // デフォルトでは全ての拡張子を有効化
        this.enabledExtensions = new Set(Object.keys(this.extensionRules));
      }
    } catch (error) {
      throw new Error(`拡張子定義ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * プリセットを適用
   */
  applyPreset(presetName: string): void {
    if (!this.currentDefinitionFile?.presets[presetName]) {
      throw new Error(`プリセット '${presetName}' が見つかりません`);
    }

    const preset = this.currentDefinitionFile.presets[presetName];
    this.enabledExtensions = new Set(preset.enabledExtensions);
  }

  /**
   * 特定の拡張子を有効/無効化
   */
  setExtensionEnabled(extension: string, enabled: boolean): void {
    if (enabled) {
      this.enabledExtensions.add(extension.toLowerCase());
    } else {
      this.enabledExtensions.delete(extension.toLowerCase());
    }
  }

  /**
   * 抽出されたファイルから拡張子ベースの検出を実行
   */
  scanFiles(extractedFiles: ExtractedFile[]): ExtensionFinding[] {
    const findings: ExtensionFinding[] = [];
    let findingIdCounter = 1;

    for (const file of extractedFiles) {
      const extension = this.getFileExtension(file.path);
      
      if (!extension || !this.enabledExtensions.has(extension)) {
        continue;
      }

      const rule = this.extensionRules[extension];
      if (!rule) {
        continue;
      }

      // ファイル内容チェックが必要な場合
      let additionalContext = '';
      if (rule.checkContent && file.content) {
        additionalContext = this.analyzeFileContent(file.content, extension);
      }

      const finding: ExtensionFinding = {
        id: findingIdCounter.toString(),
        severity: rule.severity,
        category: rule.category as ScanFinding['category'],
        pattern: `${extension.toUpperCase()} File`,
        filePath: file.path,
        lineNumber: 0,
        context: additionalContext || `${rule.metadata.fileType}: ${file.path}`,
        description: rule.description,
        fileType: rule.metadata.fileType,
        riskLevel: rule.riskLevel,
        platform: rule.metadata.platform,
        extensionCategory: rule.category
      };

      findings.push(finding);
      findingIdCounter++;
    }

    return findings;
  }

  /**
   * ファイル拡張子を取得
   */
  private getFileExtension(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase().substring(1);
    return ext || null;
  }

  /**
   * ファイル内容を分析（スクリプトファイルなど）
   */
  private analyzeFileContent(content: string, extension: string): string {
    const lines = content.split('\n');
    const firstFewLines = lines.slice(0, 5).join('\\n');
    
    // 基本的な内容サマリーを作成
    let summary = `${extension.toUpperCase()} スクリプト (${lines.length} 行)`;
    
    // 危険なキーワードをチェック
    const dangerousKeywords = [
      'delete', 'remove', 'format', 'registry', 'regedit',
      'powershell', 'cmd', 'eval', 'exec', 'system',
      'download', 'wget', 'curl', 'invoke-webrequest',
      'del' // 'del' コマンドも追加
    ];

    const foundKeywords = dangerousKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length > 0) {
      summary += ` [疑わしいキーワード: ${foundKeywords.join(', ')}]`;
    }

    return `${summary}\\n\\n先頭部分:\\n${firstFewLines}`;
  }

  /**
   * 利用可能なプリセット一覧を取得
   */
  getAvailablePresets(): Record<string, ExtensionPreset> | undefined {
    return this.currentDefinitionFile?.presets;
  }

  /**
   * 現在の拡張子定義情報を取得
   */
  getDefinitionInfo(): { name: string; description: string; version: string; ruleCount: number } | null {
    if (!this.currentDefinitionFile) return null;
    
    return {
      name: this.currentDefinitionFile.name,
      description: this.currentDefinitionFile.description,
      version: this.currentDefinitionFile.version,
      ruleCount: Object.keys(this.extensionRules).length
    };
  }

  /**
   * 有効な拡張子一覧を取得
   */
  getEnabledExtensions(): string[] {
    return Array.from(this.enabledExtensions);
  }

  /**
   * 拡張子ルール詳細を取得
   */
  getExtensionRule(extension: string): ExtensionRule | undefined {
    return this.extensionRules[extension.toLowerCase()];
  }

  /**
   * カテゴリ情報を取得
   */
  getCategories(): Record<string, ExtensionCategory> {
    return { ...this.categories };
  }

  /**
   * リスクレベル別統計を取得
   */
  getRiskStatistics(findings: ExtensionFinding[]): Record<string, number> {
    const stats = { low: 0, medium: 0, high: 0 };
    
    for (const finding of findings) {
      stats[finding.riskLevel as keyof typeof stats]++;
    }
    
    return stats;
  }

  /**
   * プラットフォーム別統計を取得
   */
  getPlatformStatistics(findings: ExtensionFinding[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const finding of findings) {
      for (const platform of finding.platform) {
        stats[platform] = (stats[platform] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * 利用可能な拡張子定義ファイルを検索
   */
  static async findAvailableDefinitionFiles(baseDir?: string): Promise<string[]> {
    const searchDir = baseDir || path.join(__dirname, '../../resources/patterns');
    
    try {
      const files = await fs.readdir(searchDir);
      const definitionFiles = files
        .filter(file => file.includes('extension') && file.endsWith('.json'))
        .map(file => path.join(searchDir, file));
      
      // ファイルの有効性を確認
      const validFiles: string[] = [];
      for (const filePath of definitionFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(content) as ExtensionDefinitionFile;
          
          // 必須フィールドの存在確認
          if (parsed.version && parsed.name && parsed.extensions) {
            validFiles.push(filePath);
          }
        } catch {
          // 無効なファイルはスキップ
        }
      }
      
      return validFiles;
    } catch {
      return [];
    }
  }
}