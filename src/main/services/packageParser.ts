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
   * 展開されたファイルを解析（UnityPackageのGUID構造に対応）
   */
  private async analyzeExtractedFiles(extractDir: string): Promise<ExtractedFile[]> {
    const files: ExtractedFile[] = [];
    
    try {
      // GUIDディレクトリを探索
      const guidDirs = await fs.readdir(extractDir);
      
      for (const guidDir of guidDirs) {
        const guidPath = path.join(extractDir, guidDir);
        const stats = await fs.stat(guidPath);
        
        if (!stats.isDirectory()) continue;
        
        // GUID形式かチェック（32文字の16進数）
        if (!/^[a-fA-F0-9]{32}$/.test(guidDir)) continue;
        
        // GUIDディレクトリ内のファイルをチェック
        const assetPath = path.join(guidPath, 'asset');
        const pathnamePath = path.join(guidPath, 'pathname');
        
        let originalPath: string | undefined;
        let assetContent: string | undefined;
        
        // pathname ファイルから元のパスを取得
        if (await this.fileExists(pathnamePath)) {
          try {
            originalPath = (await fs.readFile(pathnamePath, 'utf-8')).trim();
          } catch {
            // pathname読み込みエラー
          }
        }
        
        // asset ファイルの解析
        if (await this.fileExists(assetPath)) {
          const assetStats = await fs.stat(assetPath);
          const ext = originalPath ? path.extname(originalPath).toLowerCase() : '';
          
          let type: ExtractedFile['type'];
          
          // 元のファイル拡張子でタイプを判定
          if (ext === '.cs') {
            type = 'script';
            // C#ファイルの内容を読み込み（サイズ制限あり）
            if (assetStats.size < 1024 * 1024) { // 1MB未満のファイルのみ
              try {
                assetContent = await fs.readFile(assetPath, 'utf-8');
              } catch {
                // 読み込みエラーは無視
              }
            }
          } else if (ext === '.dll') {
            type = 'dll';
          } else if (['.prefab', '.asset', '.mat', '.unity', '.controller', '.anim'].includes(ext)) {
            type = 'asset';
          } else if (['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp'].includes(ext)) {
            type = 'texture';
          } else if (['.fbx', '.obj', '.dae', '.3ds', '.blend'].includes(ext)) {
            type = 'model';
          } else if (['.wav', '.mp3', '.ogg', '.aiff'].includes(ext)) {
            type = 'audio';
          } else if (['.json', '.xml', '.txt', '.yaml', '.yml'].includes(ext)) {
            type = 'other';
          } else {
            type = 'other';
          }

          const file: ExtractedFile = {
            path: originalPath || `[GUID:${guidDir}]`,
            type,
            size: assetStats.size,
            guid: guidDir
          };

          if (assetContent !== undefined) {
            file.content = assetContent;
          }

          files.push(file);
        }
      }

      return files;

    } catch (error) {
      throw new Error(`ファイル解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * ファイルの存在確認
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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