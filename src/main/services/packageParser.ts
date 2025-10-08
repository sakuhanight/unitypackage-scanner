import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as tar from 'tar';
import { PackageInfo, ExtractedFile, ScanProgress } from '../../shared/types';

/**
 * UnityPackage (.unitypackage) ファイルの解析を行うサービス
 */
export class PackageParser {
  private tempDir: string;
  private progressCallback?: (progress: ScanProgress) => void;

  constructor(tempDir?: string) {
    this.tempDir = tempDir || path.join(os.tmpdir(), 'unitypackage-scanner');
  }

  /**
   * 進行状況コールバックを設定
   */
  setProgressCallback(callback: (progress: ScanProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * UnityPackageファイルを解析
   */
  async parsePackage(filePath: string): Promise<PackageInfo> {
    try {
      this.reportProgress('extracting', 0, 'パッケージファイルを確認中...');

      // ファイルの存在確認
      if (!await fs.pathExists(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      // ファイルサイズを取得
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      this.reportProgress('extracting', 10, 'パッケージを展開中...');

      // 一意な一時ディレクトリを作成
      const extractDir = await this.createTempDirectory();
      
      try {
        // tar.gz形式で展開
        await this.extractTarGz(filePath, extractDir);

        this.reportProgress('analyzing', 50, 'ファイル構造を解析中...');

        // 展開されたファイルを解析
        const extractedFiles = await this.analyzeExtractedFiles(extractDir);

        this.reportProgress('analyzing', 90, 'パッケージ情報をまとめ中...');

        const packageInfo: PackageInfo = {
          fileName: path.basename(filePath),
          fileSize,
          extractedPath: extractDir,
          fileCount: extractedFiles.length,
          scriptCount: extractedFiles.filter(f => f.type === 'script').length,
          dllCount: extractedFiles.filter(f => f.type === 'dll').length,
          assetCount: extractedFiles.filter(f => f.type === 'asset').length,
          extractedFiles
        };

        this.reportProgress('completed', 100, 'パッケージ解析完了');

        return packageInfo;

      } catch (error) {
        // エラー時は一時ディレクトリをクリーンアップ
        await this.cleanup(extractDir);
        throw error;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`パッケージ解析に失敗しました: ${message}`);
    }
  }

  /**
   * tar.gzファイルを展開
   */
  private async extractTarGz(filePath: string, extractDir: string): Promise<void> {
    try {
      await tar.extract({
        file: filePath,
        cwd: extractDir,
        strict: false, // 一部の不正なエントリを無視
        filter: (entryPath) => {
          // セキュリティ: パストラバーサル攻撃を防ぐ
          const normalizedPath = path.normalize(entryPath);
          return !normalizedPath.startsWith('../') && !normalizedPath.includes('/../');
        }
      });
    } catch (error) {
      throw new Error(`tar.gz展開に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 展開されたファイルを解析
   */
  private async analyzeExtractedFiles(extractDir: string): Promise<ExtractedFile[]> {
    const files: ExtractedFile[] = [];
    
    try {
      await this.walkDirectory(extractDir, async (filePath: string, stats: fs.Stats) => {
        const relativePath = path.relative(extractDir, filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        let type: ExtractedFile['type'];
        let content: string | undefined;

        // ファイルタイプを判定
        if (ext === '.cs') {
          type = 'script';
          // C#ファイルの内容を読み込み（サイズ制限あり）
          if (stats.size < 1024 * 1024) { // 1MB未満のファイルのみ
            try {
              content = await fs.readFile(filePath, 'utf-8');
            } catch {
              // 読み込みエラーは無視
            }
          }
        } else if (ext === '.dll') {
          type = 'dll';
        } else if (ext === '.meta') {
          type = 'meta';
        } else if (['.prefab', '.asset', '.mat', '.unity', '.controller', '.anim'].includes(ext)) {
          type = 'asset';
        } else {
          type = 'other';
        }

        const file: ExtractedFile = {
          path: relativePath,
          type,
          size: stats.size
        };

        if (content !== undefined) {
          file.content = content;
        }

        files.push(file);
      });

      return files;

    } catch (error) {
      throw new Error(`ファイル解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * ディレクトリを再帰的に走査
   */
  private async walkDirectory(
    dir: string,
    callback: (filePath: string, stats: fs.Stats) => Promise<void>
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, callback);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        await callback(fullPath, stats);
      }
    }
  }

  /**
   * 一時ディレクトリを作成
   */
  private async createTempDirectory(): Promise<string> {
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const tempPath = path.join(this.tempDir, `unitypackage-${uniqueId}`);
    
    await fs.ensureDir(tempPath);
    return tempPath;
  }

  /**
   * 進行状況を報告
   */
  private reportProgress(stage: ScanProgress['stage'], progress: number, message?: string): void {
    if (this.progressCallback) {
      const progressData: ScanProgress = { stage, progress };
      if (message !== undefined) {
        progressData.message = message;
      }
      this.progressCallback(progressData);
    }
  }

  /**
   * 一時ファイルをクリーンアップ
   */
  async cleanup(extractDir?: string): Promise<void> {
    try {
      const targetDir = extractDir || this.tempDir;
      if (await fs.pathExists(targetDir)) {
        await fs.remove(targetDir);
      }
    } catch (error) {
      console.warn('クリーンアップに失敗しました:', error);
    }
  }

  /**
   * すべての一時ファイルをクリーンアップ
   */
  async cleanupAll(): Promise<void> {
    await this.cleanup();
  }
}