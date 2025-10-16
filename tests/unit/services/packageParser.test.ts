import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PackageParser } from '../../../src/main/services/packageParser';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as tar from 'tar';

// モック設定
vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  stat: vi.fn(),
  ensureDir: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn(),
  readFile: vi.fn(),
  remove: vi.fn()
}));

vi.mock('tar', () => ({
  extract: vi.fn()
}));

const mockFs = vi.mocked(fs);
const mockTar = vi.mocked(tar);

describe('PackageParser', () => {
  let packageParser: PackageParser;
  let mockTempDir: string;
  let progressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTempDir = '/tmp/test-unitypackage-scanner';
    packageParser = new PackageParser(mockTempDir);
    progressCallback = vi.fn();
    packageParser.setProgressCallback(progressCallback);

    // デフォルトのモック設定
    mockFs.pathExists.mockResolvedValue(true);
    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.remove.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ 
      size: 1024,
      isDirectory: vi.fn().mockReturnValue(true),
      isFile: vi.fn().mockReturnValue(false)
    } as any);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('mock content');
    mockTar.extract.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor & Configuration', () => {
    it('should use default temp directory when not provided', () => {
      const parser = new PackageParser();
      expect(parser).toBeDefined();
    });

    it('should set progress callback correctly', () => {
      const callback = vi.fn();
      packageParser.setProgressCallback(callback);
      // プライベートメソッドなので直接テストは困難、統合テストで確認
    });
  });

  describe('File Validation', () => {
    it('should throw error when file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      
      await expect(
        packageParser.parsePackage('/non/existent/file.unitypackage')
      ).rejects.toThrow('ファイルが見つかりません');
    });

    it('should validate file existence before processing', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await packageParser.parsePackage('/test/package.unitypackage');

      expect(mockFs.pathExists).toHaveBeenCalledWith('/test/package.unitypackage');
    });
  });

  describe('UnityPackage Extraction', () => {
    it('should extract tar.gz file successfully', async () => {
      mockFs.stat.mockResolvedValue({ size: 2048 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      expect(mockTar.extract).toHaveBeenCalledWith({
        file: '/test/package.unitypackage',
        cwd: expect.stringContaining('unitypackage-'),
        strict: false,
        filter: expect.any(Function)
      });

      expect(result.fileName).toBe('package.unitypackage');
      expect(result.fileSize).toBe(2048);
    });

    it('should handle tar extraction errors', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockRejectedValue(new Error('Extraction failed'));

      await expect(
        packageParser.parsePackage('/test/corrupted.unitypackage')
      ).rejects.toThrow('パッケージ解析に失敗しました');
    });

    it('should filter dangerous paths during extraction', async () => {
      mockFs.stat.mockResolvedValue({ 
        size: 1024,
        isDirectory: vi.fn().mockReturnValue(true),
        isFile: vi.fn().mockReturnValue(false)
      } as any);
      
      let filterFunc: any;
      mockTar.extract.mockImplementation(({ filter }) => {
        filterFunc = filter;
        return Promise.resolve();
      });
      mockFs.readdir.mockResolvedValue([]);

      await packageParser.parsePackage('/test/package.unitypackage');
      
      // テスト filter関数
      expect(filterFunc('../dangerous/path')).toBe(false);
      expect(filterFunc('normal/path/file.txt')).toBe(true);
      expect(filterFunc('path/../with/traversal')).toBe(false);
    });
  });

  describe('GUID Directory Analysis', () => {
    it('should process valid GUID directories', async () => {
      mockFs.stat.mockResolvedValue({ 
        size: 1024,
        isDirectory: vi.fn().mockReturnValue(false),
        isFile: vi.fn().mockReturnValue(true) 
      } as any);
      mockTar.extract.mockResolvedValue(undefined);
      
      const validGuid = 'abcd1234567890abcdef1234567890ab';
      mockFs.readdir.mockResolvedValue([validGuid, 'invalid-guid', '.hidden']);
      
      // GUID directory stats  
      mockFs.stat
        .mockResolvedValueOnce({ 
          size: 1024,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // validGuid dir
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // invalid-guid
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // .hidden
        .mockResolvedValueOnce({ 
          size: 512,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any); // asset file

      // Mock file access checks
      mockFs.access
        .mockResolvedValueOnce(undefined) // pathname exists
        .mockResolvedValueOnce(undefined); // asset exists

      mockFs.readFile
        .mockResolvedValueOnce('Assets/Scripts/TestScript.cs') // pathname content
        .mockResolvedValueOnce('using UnityEngine;\n\npublic class Test {}'); // asset content

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      expect(result.extractedFiles).toHaveLength(1);
      expect(result.extractedFiles[0].path).toBe('Assets/Scripts/TestScript.cs');
      expect(result.extractedFiles[0].type).toBe('script');
      expect(result.extractedFiles[0].guid).toBe(validGuid);
    });

    it('should skip invalid GUID directories', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['invalid-guid', 'too-short']);

      mockFs.stat
        .mockResolvedValueOnce({ size: 1024 } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // invalid-guid
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any); // too-short

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      expect(result.extractedFiles).toHaveLength(0);
    });
  });

  describe('File Type Detection', () => {
    const setupFileTypeTest = async (originalPath: string, content?: string) => {
      const validGuid = 'abcd1234567890abcdef1234567890ab';
      // Clear all mocks first
      vi.clearAllMocks();

      // Create a new parser instance for this test
      const testParser = new PackageParser(mockTempDir);

      // Reset default mocks
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.remove.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({
        size: 1024,
        isDirectory: vi.fn().mockReturnValue(false),
        isFile: vi.fn().mockReturnValue(true)
      } as any);
      mockFs.readdir.mockResolvedValue([]);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('mock content');
      mockTar.extract.mockResolvedValue(undefined);

      // Set specific mocks for this test
      mockFs.readdir.mockResolvedValue([validGuid]);

      mockFs.stat
        .mockResolvedValueOnce({ size: 1024 } as any) // main file
        .mockResolvedValueOnce({
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false)
        } as any) // GUID dir
        .mockResolvedValueOnce({ size: 512 } as any); // asset file

      mockFs.access
        .mockResolvedValueOnce(undefined) // pathname exists
        .mockResolvedValueOnce(undefined); // asset exists

      const readFileCalls = [originalPath];
      if (content !== undefined) {
        readFileCalls.push(content);
      }

      // Clear previous implementation
      mockFs.readFile.mockReset();
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('pathname')) {
          return Promise.resolve(originalPath);
        }
        if (filePath.includes('asset') && content !== undefined) {
          return Promise.resolve(content);
        }
        return Promise.reject(new Error('File not found'));
      });

      return testParser.parsePackage('/test/package.unitypackage');
    };

    it.skip('should detect C# script files', async () => {
      const result = await setupFileTypeTest(
        'Assets/Scripts/TestScript.cs',
        'using UnityEngine;\n\npublic class Test {}'
      );

      expect(result.extractedFiles[0].type).toBe('script');
      expect(result.extractedFiles[0].content).toBeDefined();
      expect(result.scriptCount).toBe(1);
    });

    it('should detect DLL files', async () => {
      const result = await setupFileTypeTest('Assets/Plugins/Library.dll');

      expect(result.extractedFiles[0].type).toBe('dll');
      expect(result.dllCount).toBe(1);
    });

    it('should detect asset files', async () => {
      const result = await setupFileTypeTest('Assets/Prefabs/Player.prefab');

      expect(result.extractedFiles[0].type).toBe('asset');
      expect(result.assetCount).toBe(1);
    });

    it('should detect texture files', async () => {
      const result = await setupFileTypeTest('Assets/Textures/logo.png');

      expect(result.extractedFiles[0].type).toBe('texture');
    });

    it('should detect model files', async () => {
      const result = await setupFileTypeTest('Assets/Models/character.fbx');

      expect(result.extractedFiles[0].type).toBe('model');
    });

    it('should detect audio files', async () => {
      const result = await setupFileTypeTest('Assets/Audio/bgm.wav');

      expect(result.extractedFiles[0].type).toBe('audio');
    });

    it('should handle unknown file types as other', async () => {
      const result = await setupFileTypeTest('Assets/Data/config.unknown');

      expect(result.extractedFiles[0].type).toBe('other');
    });

    it('should handle files without pathname', async () => {
      const validGuid = 'abcd1234567890abcdef1234567890ab';
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([validGuid]);

      mockFs.stat
        .mockResolvedValueOnce({ size: 1024 } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // GUID dir
        .mockResolvedValueOnce({ size: 512 } as any); // asset file

      mockFs.access
        .mockRejectedValueOnce(new Error('pathname not found')) // pathname doesn't exist
        .mockResolvedValueOnce(undefined); // asset exists

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      expect(result.extractedFiles[0].path).toBe(`[GUID:${validGuid}]`);
    });
  });

  describe('Content Size Limits', () => {
    it('should not read content for large C# files', async () => {
      const validGuid = 'abcd1234567890abcdef1234567890ab';
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([validGuid]);

      mockFs.stat
        .mockResolvedValueOnce({ size: 1024 } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // GUID dir
        .mockResolvedValueOnce({ size: 2 * 1024 * 1024 } as any); // large asset file (2MB)

      mockFs.access
        .mockResolvedValueOnce(undefined) // pathname exists
        .mockResolvedValueOnce(undefined); // asset exists

      mockFs.readFile
        .mockResolvedValueOnce('Assets/Scripts/LargeScript.cs') // pathname content
        .mockRejectedValue(new Error('Should not be called for large files'));

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      expect(result.extractedFiles[0].type).toBe('script');
      expect(result.extractedFiles[0].content).toBeUndefined();
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during parsing', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await packageParser.parsePackage('/test/package.unitypackage');

      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'extracting',
        progress: 0,
        message: 'パッケージファイルを確認中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'extracting',
        progress: 10,
        message: 'パッケージを展開中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'analyzing',
        progress: 50,
        message: 'ファイル構造を解析中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'completed',
        progress: 100,
        message: 'パッケージ解析完了'
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup temp directory on success', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await packageParser.parsePackage('/test/package.unitypackage');

      // cleanup は自動的には呼ばれないが、手動で呼べることを確認
      await packageParser.cleanup('/test/temp/dir');
      expect(mockFs.remove).toHaveBeenCalledWith('/test/temp/dir');
    });

    it('should cleanup temp directory on error', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockRejectedValue(new Error('Extraction failed'));

      await expect(
        packageParser.parsePackage('/test/package.unitypackage')
      ).rejects.toThrow();

      expect(mockFs.remove).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockFs.remove.mockRejectedValue(new Error('Cleanup failed'));
      
      // cleanup エラーは例外を投げないことを確認
      await expect(packageParser.cleanup('/test/dir')).resolves.toBeUndefined();
    });

    it('should cleanup all temp files', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      
      await packageParser.cleanupAll();
      
      expect(mockFs.remove).toHaveBeenCalledWith(mockTempDir);
    });
  });

  describe('Error Handling', () => {
    it('should handle general parsing errors', async () => {
      mockFs.pathExists.mockRejectedValue(new Error('File system error'));

      await expect(
        packageParser.parsePackage('/test/package.unitypackage')
      ).rejects.toThrow('パッケージ解析に失敗しました');
    });

    it('should handle file analysis errors', async () => {
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockRejectedValue(new Error('Directory read failed'));

      await expect(
        packageParser.parsePackage('/test/package.unitypackage')
      ).rejects.toThrow('パッケージ解析に失敗しました');
    });

    it('should handle file read errors gracefully', async () => {
      const validGuid = 'abcd1234567890abcdef1234567890ab';
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([validGuid]);

      mockFs.stat
        .mockResolvedValueOnce({ size: 1024 } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // GUID dir
        .mockResolvedValueOnce({ size: 512 } as any); // asset file

      mockFs.access
        .mockResolvedValueOnce(undefined) // pathname exists
        .mockResolvedValueOnce(undefined); // asset exists

      mockFs.readFile
        .mockRejectedValueOnce(new Error('pathname read failed'))
        .mockRejectedValueOnce(new Error('asset read failed'));

      const result = await packageParser.parsePackage('/test/package.unitypackage');

      // エラーがあってもファイルは検出される（内容は空）
      expect(result.extractedFiles).toHaveLength(1);
      expect(result.extractedFiles[0].content).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty UnityPackage', async () => {
      mockFs.stat.mockResolvedValue({ size: 0 } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      const result = await packageParser.parsePackage('/test/empty.unitypackage');

      expect(result.fileCount).toBe(0);
      expect(result.scriptCount).toBe(0);
      expect(result.dllCount).toBe(0);
      expect(result.assetCount).toBe(0);
      expect(result.extractedFiles).toHaveLength(0);
    });

    it.skip('should handle package with mixed file types', async () => {
      const guids = [
        'abcd1234567890abcdef1234567890ab', // script
        'efgh5678901234abcdef567890123456', // dll
        'ijkl9012345678abcdef123456789012'  // texture
      ];

      mockFs.stat.mockResolvedValue({ 
        size: 1024,
        isDirectory: vi.fn().mockReturnValue(false),
        isFile: vi.fn().mockReturnValue(true) 
      } as any);
      mockTar.extract.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(guids);

      // Setup stats for all directories
      mockFs.stat
        .mockResolvedValueOnce({ 
          size: 1024,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // main file
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // guid1
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // guid2  
        .mockResolvedValueOnce({ 
          isDirectory: vi.fn().mockReturnValue(true),
          isFile: vi.fn().mockReturnValue(false) 
        } as any) // guid3
        .mockResolvedValueOnce({ 
          size: 256,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // asset1
        .mockResolvedValueOnce({ 
          size: 512,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any) // asset2
        .mockResolvedValueOnce({ 
          size: 1024,
          isDirectory: vi.fn().mockReturnValue(false),
          isFile: vi.fn().mockReturnValue(true) 
        } as any); // asset3

      // Mock access to allow all file access checks 
      mockFs.access.mockResolvedValue(undefined);

      // Mock file contents with implementation based approach
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('pathname')) {
          if (filePath.includes('abcd1234567890abcdef1234567890ab')) {
            return Promise.resolve('Assets/Scripts/Test.cs');
          } else if (filePath.includes('efgh5678901234abcdef567890123456')) {
            return Promise.resolve('Assets/Plugins/Lib.dll');
          } else if (filePath.includes('ijkl9012345678abcdef123456789012')) {
            return Promise.resolve('Assets/Textures/img.png');
          }
        }
        if (filePath.includes('asset')) {
          if (filePath.includes('abcd1234567890abcdef1234567890ab')) {
            return Promise.resolve('using UnityEngine;\n\npublic class Test {}');
          }
          // DLL and PNG files don't need content reading
        }
        return Promise.reject(new Error('File not found'));
      });

      const result = await packageParser.parsePackage('/test/mixed.unitypackage');

      expect(result.fileCount).toBe(3);
      expect(result.scriptCount).toBe(1);
      expect(result.dllCount).toBe(1);
      expect(result.assetCount).toBe(0); // texture は assetCount に含まれない
    });
  });
});