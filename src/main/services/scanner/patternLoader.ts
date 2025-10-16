import * as fs from 'fs-extra';
import * as path from 'path';
import { ScanFinding } from '../../../shared/types';
import { PatternConstants } from '../../constants';

export interface PatternDefinition {
  name: string;
  description: string;
  regex: string;
  flags: string;
  severity?: ScanFinding['severity'];
}

export interface CategoryDefinition {
  severity: ScanFinding['severity'];
  description: string;
  patterns?: PatternDefinition[];
  fileExtension?: string; // DLLなどファイル拡張子による検出用
}

export interface PresetDefinition {
  name: string;
  description: string;
  enabledCategories: string[];
  excludePatterns?: string[];
}

export interface PatternFile {
  version: string;
  name: string;
  description: string;
  categories: Record<string, CategoryDefinition>;
  presets?: Record<string, PresetDefinition>;
}

export interface CompiledPattern {
  name: string;
  category: ScanFinding['category'];
  severity: ScanFinding['severity'];
  regex: RegExp;
  description: string;
}

/**
 * パターンファイルの読み込みと管理を行うクラス
 */
export class PatternLoader {
  private loadedPatterns: CompiledPattern[] = [];
  private currentPatternFile: PatternFile | null = null;

  /**
   * デフォルトパターンを読み込む
   */
  async loadDefaultPatterns(): Promise<CompiledPattern[]> {
    return this.loadPatternsFromFile(PatternConstants.getDefaultPatternPath());
  }

  /**
   * 指定されたファイルからパターンを読み込む
   */
  async loadPatternsFromFile(filePath: string): Promise<CompiledPattern[]> {
    try {
      // ファイル名のみの場合は、resourcesディレクトリ内から探す
      let resolvedPath = filePath;
      if (!path.isAbsolute(filePath) && !filePath.includes('/') && !filePath.includes('\\')) {
        resolvedPath = PatternConstants.getPatternFilePath(filePath);
      }
      
      const fileContent = await fs.readFile(resolvedPath, 'utf-8');
      const patternFile: PatternFile = JSON.parse(fileContent);
      
      this.currentPatternFile = patternFile;
      this.loadedPatterns = this.compilePatterns(patternFile);
      
      return this.loadedPatterns;
    } catch (error) {
      throw new Error(`パターンファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * プリセットを適用してパターンを読み込む
   */
  async loadPatternsWithPreset(filePath: string, presetName: string): Promise<CompiledPattern[]> {
    await this.loadPatternsFromFile(filePath);
    
    if (!this.currentPatternFile?.presets?.[presetName]) {
      throw new Error(`プリセット '${presetName}' が見つかりません`);
    }

    const preset = this.currentPatternFile.presets[presetName];
    return this.applyPreset(preset);
  }

  /**
   * 利用可能なプリセット一覧を取得
   */
  getAvailablePresets(): Record<string, PresetDefinition> | undefined {
    return this.currentPatternFile?.presets;
  }

  /**
   * 現在読み込まれているパターンを取得
   */
  getLoadedPatterns(): CompiledPattern[] {
    return [...this.loadedPatterns];
  }

  /**
   * パターンファイル情報を取得
   */
  getPatternFileInfo(): { name: string; description: string; version: string } | null {
    if (!this.currentPatternFile) return null;
    
    return {
      name: this.currentPatternFile.name,
      description: this.currentPatternFile.description,
      version: this.currentPatternFile.version
    };
  }

  /**
   * パターンファイルをコンパイルして実行可能なパターンに変換
   */
  private compilePatterns(patternFile: PatternFile): CompiledPattern[] {
    const compiledPatterns: CompiledPattern[] = [];

    for (const [categoryName, category] of Object.entries(patternFile.categories)) {
      // ファイル拡張子による検出（DLLなど）
      if (category.fileExtension) {
        // DLLファイル検出用の特別なパターンを作成
        const fileExtensionPattern: CompiledPattern = {
          name: `${categoryName.toUpperCase()} File`,
          category: categoryName as ScanFinding['category'],
          severity: category.severity,
          regex: new RegExp(`\\${category.fileExtension}$`, 'gi'),
          description: category.description
        };
        compiledPatterns.push(fileExtensionPattern);
        continue;
      }

      // 正規表現パターンをコンパイル
      if (category.patterns) {
        for (const pattern of category.patterns) {
          try {
            const regexFlags = this.parseRegexFlags(pattern.flags);
            const compiledPattern: CompiledPattern = {
              name: pattern.name,
              category: categoryName as ScanFinding['category'],
              severity: pattern.severity || category.severity,
              regex: new RegExp(pattern.regex, regexFlags),
              description: pattern.description
            };
            
            compiledPatterns.push(compiledPattern);
          } catch (error) {
            console.warn(`パターン '${pattern.name}' のコンパイルに失敗: ${error}`);
          }
        }
      }
    }

    return compiledPatterns;
  }

  /**
   * プリセットを適用してパターンをフィルタリング
   */
  private applyPreset(preset: PresetDefinition): CompiledPattern[] {
    if (!this.currentPatternFile) {
      return [];
    }

    // 有効なカテゴリのみを含むパターンファイルを作成
    const filteredPatternFile: PatternFile = {
      ...this.currentPatternFile,
      categories: {}
    };

    for (const categoryName of preset.enabledCategories) {
      if (this.currentPatternFile.categories[categoryName]) {
        filteredPatternFile.categories[categoryName] = this.currentPatternFile.categories[categoryName];
      }
    }

    // パターンをコンパイル
    let patterns = this.compilePatterns(filteredPatternFile);

    // 除外パターンを適用
    if (preset.excludePatterns) {
      patterns = patterns.filter(pattern => 
        !preset.excludePatterns!.includes(pattern.name)
      );
    }

    this.loadedPatterns = patterns;
    return patterns;
  }

  /**
   * 正規表現フラグを解析
   */
  private parseRegexFlags(flags: string): string {
    // 基本的なフラグのみをサポート (g, i, m, s, u, y)
    const validFlags = ['g', 'i', 'm', 's', 'u', 'y'];
    let parsedFlags = flags.split('').filter(flag => validFlags.includes(flag)).join('');
    
    // matchAllを使用するためにglobalフラグが必要
    if (!parsedFlags.includes('g')) {
      parsedFlags += 'g';
    }
    
    return parsedFlags;
  }

  /**
   * 利用可能なパターンファイルを検索
   */
  static async findAvailablePatternFiles(baseDir?: string): Promise<string[]> {
    const searchDir = baseDir || PatternConstants.getPatternsPath();
    
    try {
      const files = await fs.readdir(searchDir);
      const patternFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(searchDir, file));
      
      // ファイルの有効性を確認
      const validFiles: string[] = [];
      for (const filePath of patternFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(content) as PatternFile;
          
          // 必須フィールドの存在確認
          if (parsed.version && parsed.name && parsed.categories) {
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