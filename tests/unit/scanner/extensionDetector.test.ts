import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionDetector } from '../../../src/main/services/scanner/extensionDetector';
import { ExtractedFile } from '../../../src/shared/types';
import * as path from 'path';

describe('ExtensionDetector', () => {
  let extensionDetector: ExtensionDetector;

  beforeEach(async () => {
    extensionDetector = new ExtensionDetector();
    await extensionDetector.initialize();
  });

  describe('Default Extension Loading', () => {
    it('should load default extension definitions successfully', async () => {
      const definitionInfo = extensionDetector.getDefinitionInfo();
      
      expect(definitionInfo).toBeDefined();
      expect(definitionInfo?.name).toBe('File Extension Detection Rules');
      expect(definitionInfo?.ruleCount).toBeGreaterThan(0);
    });

    it('should have enabled extensions after initialization', () => {
      const enabledExtensions = extensionDetector.getEnabledExtensions();
      
      expect(enabledExtensions).toBeDefined();
      expect(enabledExtensions.length).toBeGreaterThan(0);
      expect(enabledExtensions).toContain('dll');
      expect(enabledExtensions).toContain('exe');
    });
  });

  describe('Extension Detection', () => {
    it('should detect DLL files and create warning findings', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/MyLibrary.dll',
          type: 'dll',
          size: 1024,
          guid: 'abcd1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Scripts/MyScript.cs',
          type: 'script',
          size: 512,
          content: 'using UnityEngine;\n\npublic class MyScript : MonoBehaviour {}',
          guid: 'efgh5678901234abcdef567890123456'
        }
      ];

      const findings = extensionDetector.scanFiles(extractedFiles);
      
      // DLL関連のファインディングを確認
      const dllFindings = findings.filter(f => f.extensionCategory === 'dll');
      expect(dllFindings).toHaveLength(1);
      
      const dllFinding = dllFindings[0];
      expect(dllFinding.severity).toBe('warning');
      expect(dllFinding.pattern).toBe('DLL File');
      expect(dllFinding.filePath).toBe('Assets/Plugins/MyLibrary.dll');
      expect(dllFinding.fileType).toBe('Dynamic Link Library');
      expect(dllFinding.riskLevel).toBe('medium');
    });

    it('should detect executable files with critical severity', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Malware/suspicious.exe',
          type: 'other',
          size: 2048,
          guid: 'malware123456789abcdef123456789ab'
        }
      ];

      const findings = extensionDetector.scanFiles(extractedFiles);
      
      const exeFindings = findings.filter(f => f.extensionCategory === 'executable');
      expect(exeFindings).toHaveLength(1);
      
      const exeFinding = exeFindings[0];
      expect(exeFinding.severity).toBe('critical');
      expect(exeFinding.pattern).toBe('EXE File');
      expect(exeFinding.riskLevel).toBe('high');
    });

    it('should detect script files with content analysis', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/malicious.bat',
          type: 'other',
          size: 256,
          content: '@echo off\\nformat c: /y\\ndel /f /q c:\\\\*.*',
          guid: 'script123456789abcdef123456789abc'
        }
      ];

      const findings = extensionDetector.scanFiles(extractedFiles);
      
      const scriptFindings = findings.filter(f => f.extensionCategory === 'script');
      expect(scriptFindings).toHaveLength(1);
      
      const scriptFinding = scriptFindings[0];
      expect(scriptFinding.severity).toBe('critical');
      expect(scriptFinding.pattern).toBe('BAT File');
      expect(scriptFinding.context).toContain('疑わしいキーワード');
      expect(scriptFinding.context).toContain('format');
      expect(scriptFinding.context).toContain('del');
    });

    it('should not detect files with disabled extensions', () => {
      // zipファイル検出を無効化
      extensionDetector.setExtensionEnabled('zip', false);
      
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Archive/data.zip',
          type: 'other',
          size: 1024,
          guid: 'archive123456789abcdef123456789ab'
        }
      ];

      const findings = extensionDetector.scanFiles(extractedFiles);
      expect(findings).toHaveLength(0);
    });
  });

  describe('Preset Management', () => {
    it('should apply preset successfully', async () => {
      const definitionPath = path.join(__dirname, '../../../src/main/resources/patterns/file-extensions.json');
      
      // security_focusedプリセットを適用
      await extensionDetector.loadExtensionDefinitions(definitionPath, 'security_focused');
      
      const enabledExtensions = extensionDetector.getEnabledExtensions();
      expect(enabledExtensions).toContain('dll');
      expect(enabledExtensions).toContain('exe');
      expect(enabledExtensions).not.toContain('zip'); // セキュリティ重視では除外
    });

    it('should get available presets', () => {
      const presets = extensionDetector.getAvailablePresets();
      
      expect(presets).toBeDefined();
      expect(presets).toHaveProperty('strict');
      expect(presets).toHaveProperty('security_focused');
      expect(presets).toHaveProperty('executables_only');
      expect(presets).toHaveProperty('native_libraries');
    });

    it('should throw error for invalid preset', async () => {
      const definitionPath = path.join(__dirname, '../../../src/main/resources/patterns/file-extensions.json');
      
      await expect(
        extensionDetector.loadExtensionDefinitions(definitionPath, 'invalid_preset')
      ).rejects.toThrow('プリセット \'invalid_preset\' が見つかりません');
    });
  });

  describe('Extension Rule Management', () => {
    it('should get extension rule details', () => {
      const dllRule = extensionDetector.getExtensionRule('dll');
      
      expect(dllRule).toBeDefined();
      expect(dllRule?.severity).toBe('warning');
      expect(dllRule?.category).toBe('dll');
      expect(dllRule?.riskLevel).toBe('medium');
      expect(dllRule?.metadata.fileType).toBe('Dynamic Link Library');
    });

    it('should get categories information', () => {
      const categories = extensionDetector.getCategories();
      
      expect(categories).toBeDefined();
      expect(categories).toHaveProperty('dll');
      expect(categories).toHaveProperty('executable');
      expect(categories).toHaveProperty('script');
      
      expect(categories.dll.name).toBe('DLLファイル');
      expect(categories.executable.defaultSeverity).toBe('critical');
    });
  });

  describe('Statistics', () => {
    it('should provide risk level statistics', () => {
      const mockFindings = [
        { riskLevel: 'high' },
        { riskLevel: 'medium' },
        { riskLevel: 'medium' },
        { riskLevel: 'low' }
      ] as any[];

      const stats = extensionDetector.getRiskStatistics(mockFindings);
      
      expect(stats.high).toBe(1);
      expect(stats.medium).toBe(2);
      expect(stats.low).toBe(1);
    });

    it('should provide platform statistics', () => {
      const mockFindings = [
        { platform: ['windows'] },
        { platform: ['windows', 'linux'] },
        { platform: ['macos'] }
      ] as any[];

      const stats = extensionDetector.getPlatformStatistics(mockFindings);
      
      expect(stats.windows).toBe(2);
      expect(stats.linux).toBe(1);
      expect(stats.macos).toBe(1);
    });
  });

  describe('File Discovery', () => {
    it('should find available extension definition files', async () => {
      const definitionFiles = await ExtensionDetector.findAvailableDefinitionFiles();
      
      expect(definitionFiles).toBeDefined();
      expect(Array.isArray(definitionFiles)).toBe(true);
      expect(definitionFiles.length).toBeGreaterThan(0);
      
      // file-extensions.jsonが含まれていることを確認
      const hasExtensionFile = definitionFiles.some(file => file.includes('file-extensions.json'));
      expect(hasExtensionFile).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid definition file gracefully', async () => {
      const invalidPath = '/non/existent/path/invalid.json';
      
      await expect(
        extensionDetector.loadExtensionDefinitions(invalidPath)
      ).rejects.toThrow('拡張子定義ファイルの読み込みに失敗しました');
    });

    it('should handle files without extensions gracefully', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/NoExtension',
          type: 'other',
          size: 100,
          guid: 'noext123456789abcdef123456789abc'
        }
      ];

      const findings = extensionDetector.scanFiles(extractedFiles);
      expect(findings).toHaveLength(0);
    });
  });
});