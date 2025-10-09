import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtensionDetector } from '../../../src/main/services/scanner/extensionDetector';
import { ExtractedFile } from '../../../src/shared/types';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra for error testing
vi.mock('fs-extra', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn()
}));
const mockFs = vi.mocked(fs);

describe('ExtensionDetector Coverage Tests', () => {
  let extensionDetector: ExtensionDetector;

  beforeEach(async () => {
    vi.clearAllMocks();
    extensionDetector = new ExtensionDetector();
    
    // デフォルトのモック設定
    mockFs.readFile.mockResolvedValue(JSON.stringify({
      version: '1.0.0',
      name: 'Test Extension Rules',
      description: 'Test',
      extensions: {
        dll: {
          severity: 'warning',
          category: 'dll',
          description: 'DLL file',
          riskLevel: 'medium',
          checkContent: false,
          metadata: {
            fileType: 'Dynamic Link Library',
            platform: ['windows'],
            commonUses: ['library']
          }
        },
        exe: {
          severity: 'critical',
          category: 'executable',
          description: 'EXE file',
          riskLevel: 'high',
          checkContent: false,
          metadata: {
            fileType: 'Executable',
            platform: ['windows'],
            commonUses: ['application']
          }
        },
        bat: {
          severity: 'critical',
          category: 'script',
          description: 'BAT file',
          riskLevel: 'high',
          checkContent: true,
          metadata: {
            fileType: 'Batch Script',
            platform: ['windows'],
            commonUses: ['script']
          }
        },
        zip: {
          severity: 'info',
          category: 'archive',
          description: 'ZIP file',
          riskLevel: 'low',
          checkContent: false,
          metadata: {
            fileType: 'ZIP Archive',
            platform: ['cross-platform'],
            commonUses: ['archive']
          }
        },
        so: {
          severity: 'warning',
          category: 'native',
          description: 'SO file',
          riskLevel: 'medium',
          checkContent: false,
          metadata: {
            fileType: 'Shared Object',
            platform: ['linux'],
            commonUses: ['library']
          }
        },
        dylib: {
          severity: 'warning',
          category: 'native',
          description: 'DYLIB file',
          riskLevel: 'medium',
          checkContent: false,
          metadata: {
            fileType: 'Dynamic Library',
            platform: ['macos'],
            commonUses: ['library']
          }
        }
      },
      categories: {
        dll: {
          name: 'DLL Files',
          description: 'Dynamic Link Libraries',
          defaultSeverity: 'warning'
        },
        executable: {
          name: 'Executables',
          description: 'Executable files',
          defaultSeverity: 'critical'
        },
        script: {
          name: 'Scripts',
          description: 'Script files',
          defaultSeverity: 'critical'
        },
        archive: {
          name: 'Archives',
          description: 'Archive files',
          defaultSeverity: 'info'
        },
        native: {
          name: 'Native',
          description: 'Native library files',
          defaultSeverity: 'warning'
        }
      },
      presets: {
        test: {
          name: 'Test',
          description: 'Test preset',
          enabledExtensions: ['dll', 'exe', 'bat', 'zip', 'so', 'dylib']
        }
      }
    }));
    mockFs.readdir.mockResolvedValue(['test-extensions.json']);
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle file reading errors during initialization', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      await expect(extensionDetector.initialize()).rejects.toThrow(
        '拡張子定義ファイルの読み込みに失敗しました'
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockFs.readFile.mockResolvedValue('invalid json content');

      await expect(extensionDetector.initialize()).rejects.toThrow(
        '拡張子定義ファイルの読み込みに失敗しました'
      );
    });

    it('should handle missing preset gracefully', () => {
      expect(() => {
        extensionDetector.applyPreset('non_existent_preset');
      }).toThrow("プリセット 'non_existent_preset' が見つかりません");
    });

    it('should handle files with no extension', () => {
      const files: ExtractedFile[] = [
        {
          path: 'Assets/NoExtension',
          type: 'other',
          size: 100,
          guid: 'noext123456789abcdef123456789abc'
        },
        {
          path: 'Assets/JustADot.',
          type: 'other',
          size: 50,
          guid: 'dot1234567890abcdef123456789abc'
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      expect(findings).toHaveLength(0);
    });

    it('should handle empty file path', () => {
      const files: ExtractedFile[] = [
        {
          path: '',
          type: 'other',
          size: 100,
          guid: 'empty123456789abcdef123456789abc'
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      expect(findings).toHaveLength(0);
    });

    it('should handle case insensitive extensions', async () => {
      await extensionDetector.initialize();
      extensionDetector.applyPreset('test');

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Library.DLL', // Uppercase
          type: 'dll',
          size: 1024,
          guid: 'uppercase123456789abcdef123456789',
          content: 'binary dll content',
          isDirectory: false
        },
        {
          path: 'Assets/script.BAT', // Mixed case
          type: 'other',
          size: 512,
          content: 'echo "test"',
          guid: 'mixedcase123456789abcdef123456789',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      // Should detect both files regardless of case
      expect(findings).toHaveLength(2);
      expect(findings.some(f => f.filePath.includes('Library.DLL'))).toBe(true);
      expect(findings.some(f => f.filePath.includes('script.BAT'))).toBe(true);
    });

    it('should handle disabled extensions correctly', async () => {
      await extensionDetector.initialize();

      // Disable DLL detection
      extensionDetector.setExtensionEnabled('dll', false);

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/Library.dll',
          type: 'dll',
          size: 1024,
          guid: 'disabled123456789abcdef123456789ab'
        },
        {
          path: 'Assets/Tools/tool.exe',
          type: 'other',
          size: 2048,
          guid: 'enabled1234567890abcdef123456789ab'
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      // Should only detect EXE, not DLL
      expect(findings).toHaveLength(1);
      expect(findings[0].filePath).toBe('Assets/Tools/tool.exe');
    });

    it('should handle re-enabling disabled extensions', async () => {
      await extensionDetector.initialize();

      // Disable then re-enable
      extensionDetector.setExtensionEnabled('dll', false);
      extensionDetector.setExtensionEnabled('dll', true);

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/Library.dll',
          type: 'dll',
          size: 1024,
          guid: 'reenabled123456789abcdef123456789'
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      // Should detect DLL after re-enabling
      expect(findings).toHaveLength(1);
    });
  });

  describe('Content Analysis Edge Cases', () => {
    it('should handle empty content', async () => {
      await extensionDetector.initialize();
      extensionDetector.applyPreset('test');

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/empty.bat',
          type: 'other',
          size: 0,
          content: '',
          guid: 'empty123456789abcdef123456789abc',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      expect(findings).toHaveLength(1);
      expect(findings[0].context).toContain('Batch Script');
    });

    it('should handle very long content', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const longContent = 'echo "line"\n'.repeat(10000);
      
      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/long.bat',
          type: 'other',
          size: longContent.length,
          content: longContent,
          guid: 'long1234567890abcdef123456789abc',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      expect(findings).toHaveLength(1);
      expect(findings[0].context).toContain('BAT スクリプト (10001 行)');
    });

    it('should detect all dangerous keywords', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const allKeywords = [
        'delete', 'remove', 'format', 'registry', 'regedit',
        'powershell', 'cmd', 'eval', 'exec', 'system',
        'download', 'wget', 'curl', 'invoke-webrequest', 'del'
      ];

      const content = allKeywords.join(' ') + '\necho "test"';

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/all-keywords.bat',
          type: 'other',
          size: content.length,
          content: content,
          guid: 'keywords123456789abcdef123456789ab',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      expect(findings).toHaveLength(1);
      const context = findings[0].context;
      
      // Should detect all keywords
      allKeywords.forEach(keyword => {
        expect(context).toContain(keyword);
      });
    });

    it('should handle content without dangerous keywords', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const safeContent = `@echo off
echo Starting safe script
set VAR=value
if exist file.txt echo File exists
echo Script completed successfully`;

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/safe.bat',
          type: 'other',
          size: safeContent.length,
          content: safeContent,
          guid: 'safe1234567890abcdef123456789abc',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      expect(findings).toHaveLength(1);
      expect(findings[0].context).not.toContain('疑わしいキーワード');
      expect(findings[0].context).toContain('BAT スクリプト');
    });

    it('should handle partial keyword matches correctly', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const content = `@echo off
echo "The word 'delete' is in this string but not as a command"
echo "formatting text is different from format command"
echo "This is a regular script"`;

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/partial.bat',
          type: 'other',
          size: content.length,
          content: content,
          guid: 'partial123456789abcdef123456789ab',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      
      expect(findings).toHaveLength(1);
      // Should still detect keywords even in strings
      expect(findings[0].context).toContain('疑わしいキーワード');
      expect(findings[0].context).toContain('delete');
    });
  });

  describe('Preset Management Coverage', () => {
    it('should apply all available presets', async () => {
      await extensionDetector.initialize();

      const presets = extensionDetector.getAvailablePresets();
      expect(presets).toBeDefined();

      const presetNames = Object.keys(presets!);
      
      for (const presetName of presetNames) {
        extensionDetector.applyPreset(presetName);
        const enabledExtensions = extensionDetector.getEnabledExtensions();
        expect(enabledExtensions.length).toBeGreaterThan(0);
      }
    });

    it('should handle preset with empty enabled extensions', async () => {
      // Create a mock definition with empty preset
      const mockDefinition = {
        version: '1.0.0',
        name: 'Test',
        description: 'Test',
        extensions: {
          dll: {
            severity: 'warning' as const,
            category: 'dll',
            description: 'Test DLL',
            riskLevel: 'medium' as const,
            checkContent: false,
            metadata: {
              fileType: 'Test',
              platform: ['test'],
              commonUses: ['test']
            }
          }
        },
        categories: {},
        presets: {
          empty: {
            name: 'Empty',
            description: 'Empty preset',
            enabledExtensions: []
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockDefinition));
      
      await extensionDetector.loadExtensionDefinitions('/mock/path', 'empty');
      
      const enabledExtensions = extensionDetector.getEnabledExtensions();
      expect(enabledExtensions).toHaveLength(0);
    });
  });

  describe('Statistics Coverage', () => {
    it('should handle empty findings for statistics', async () => {
      await extensionDetector.initialize();

      const riskStats = extensionDetector.getRiskStatistics([]);
      expect(riskStats.low).toBe(0);
      expect(riskStats.medium).toBe(0);
      expect(riskStats.high).toBe(0);

      const platformStats = extensionDetector.getPlatformStatistics([]);
      expect(Object.keys(platformStats)).toHaveLength(0);
    });

    it('should calculate risk statistics correctly', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Data/archive.zip',
          type: 'other',
          size: 1024,
          guid: 'zip123456789abcdef1234567890abcd',
          content: 'binary content',
          isDirectory: false
        },
        {
          path: 'Assets/Plugins/lib.dll',
          type: 'dll',
          size: 2048,
          guid: 'dll123456789abcdef1234567890abcd',
          content: 'binary content',
          isDirectory: false
        },
        {
          path: 'Assets/Tools/app.exe',
          type: 'other',
          size: 4096,
          guid: 'exe123456789abcdef1234567890abcd',
          content: 'binary content',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      const riskStats = extensionDetector.getRiskStatistics(findings);

      expect(riskStats.low).toBeGreaterThan(0); // ZIP
      expect(riskStats.medium).toBeGreaterThan(0); // DLL
      expect(riskStats.high).toBeGreaterThan(0); // EXE
    });

    it('should calculate platform statistics correctly', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/win.dll',
          type: 'dll',
          size: 1024,
          guid: 'win123456789abcdef1234567890abcd',
          content: 'binary content',
          isDirectory: false
        },
        {
          path: 'Assets/Plugins/unix.so',
          type: 'other',
          size: 1024,
          guid: 'unix123456789abcdef123456789abcd',
          content: 'binary content',
          isDirectory: false
        },
        {
          path: 'Assets/Plugins/mac.dylib',
          type: 'other',
          size: 1024,
          guid: 'mac123456789abcdef1234567890abcd',
          content: 'binary content',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      const platformStats = extensionDetector.getPlatformStatistics(findings);

      expect(platformStats.windows).toBeGreaterThan(0);
      expect(platformStats.linux).toBeGreaterThan(0);
      expect(platformStats.macos).toBeGreaterThan(0);
    });

    it('should handle findings with multiple platforms', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Archive/data.zip',
          type: 'other',
          size: 1024,
          guid: 'multi123456789abcdef123456789abcd',
          content: 'binary content',
          isDirectory: false
        }
      ];

      const findings = extensionDetector.scanFiles(files);
      const platformStats = extensionDetector.getPlatformStatistics(findings);

      // ZIP files are cross-platform
      expect(platformStats['cross-platform']).toBeGreaterThan(0);
    });
  });

  describe('File Discovery Coverage', () => {
    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const files = await ExtensionDetector.findAvailableDefinitionFiles('/invalid/path');
      expect(files).toHaveLength(0);
    });

    it('should filter invalid definition files', async () => {
      mockFs.readdir.mockResolvedValue(['valid-extensions.json', 'invalid.json', 'not-extension.json']);
      
      // Mock file reading - only valid file should have proper structure
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('valid-extensions.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            name: 'Valid',
            extensions: {}
          }));
        } else if (filePath.includes('invalid.json')) {
          return Promise.resolve('invalid json');
        } else {
          return Promise.resolve(JSON.stringify({
            name: 'Missing required fields'
          }));
        }
      });

      const files = await ExtensionDetector.findAvailableDefinitionFiles('/test/path');
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('valid-extensions.json');
    });

    it('should handle file read errors during discovery', async () => {
      mockFs.readdir.mockResolvedValue(['test-extensions.json']);
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      const files = await ExtensionDetector.findAvailableDefinitionFiles('/test/path');
      expect(files).toHaveLength(0);
    });
  });

  describe('Extension Rule Management Coverage', () => {
    it('should return undefined for non-existent extension rule', async () => {
      await extensionDetector.initialize();

      const rule = extensionDetector.getExtensionRule('nonexistent');
      expect(rule).toBeUndefined();
    });

    it('should return extension rule for existing extension', async () => {
      await extensionDetector.initialize();

      const rule = extensionDetector.getExtensionRule('dll');
      expect(rule).toBeDefined();
      expect(rule?.category).toBe('dll');
      expect(rule?.severity).toBe('warning');
    });

    it('should return copy of categories to prevent mutation', async () => {
      await extensionDetector.initialize();

      const categories1 = extensionDetector.getCategories();
      const categories2 = extensionDetector.getCategories();

      // Should be different object instances
      expect(categories1).not.toBe(categories2);
      
      // But with same content
      expect(categories1).toEqual(categories2);
    });
  });

  describe('Definition Info Coverage', () => {
    it('should return null when no definition file is loaded', () => {
      const info = extensionDetector.getDefinitionInfo();
      expect(info).toBeNull();
    });

    it('should return correct definition info after loading', async () => {
      const extensionDetector = new ExtensionDetector();
      await extensionDetector.initialize();
      // Enable all extensions for tests
      ['bat', 'zip', 'so', 'dylib'].forEach(ext => {
        extensionDetector.setExtensionEnabled(ext, true);
      });

      const info = extensionDetector.getDefinitionInfo();
      expect(info).toBeDefined();
      expect(info?.name).toBe('Test Extension Rules');
      expect(info?.version).toBeDefined();
      expect(info?.ruleCount).toBeGreaterThan(0);
    });

    it('should return undefined for available presets when no file loaded', () => {
      const presets = extensionDetector.getAvailablePresets();
      expect(presets).toBeUndefined();
    });
  });

  describe('Initialization Edge Cases', () => {
    it('should handle loading custom definition file', async () => {
      const customDefinition = {
        version: '2.0.0',
        name: 'Custom Extension Rules',
        description: 'Custom rules for testing',
        extensions: {
          test: {
            severity: 'info' as const,
            category: 'other',
            description: 'Test extension',
            riskLevel: 'low' as const,
            checkContent: false,
            metadata: {
              fileType: 'Test File',
              platform: ['test'],
              commonUses: ['testing']
            }
          }
        },
        categories: {
          other: {
            name: 'Other Files',
            description: 'Other file types',
            defaultSeverity: 'info' as const
          }
        },
        presets: {
          test: {
            name: 'Test Preset',
            description: 'Test preset',
            enabledExtensions: ['test']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(customDefinition));

      await extensionDetector.loadExtensionDefinitions('/custom/path', 'test');

      const info = extensionDetector.getDefinitionInfo();
      expect(info?.name).toBe('Custom Extension Rules');
      expect(info?.version).toBe('2.0.0');

      const enabledExtensions = extensionDetector.getEnabledExtensions();
      expect(enabledExtensions).toContain('test');
    });

    it('should handle preset application during loading', async () => {
      const definitionWithPreset = {
        version: '1.0.0',
        name: 'Test',
        description: 'Test',
        extensions: {
          dll: {
            severity: 'warning' as const,
            category: 'dll',
            description: 'DLL file',
            riskLevel: 'medium' as const,
            checkContent: false,
            metadata: {
              fileType: 'DLL',
              platform: ['windows'],
              commonUses: ['library']
            }
          },
          exe: {
            severity: 'critical' as const,
            category: 'executable',
            description: 'EXE file',
            riskLevel: 'high' as const,
            checkContent: false,
            metadata: {
              fileType: 'EXE',
              platform: ['windows'],
              commonUses: ['application']
            }
          }
        },
        categories: {},
        presets: {
          dll_only: {
            name: 'DLL Only',
            description: 'Only DLL files',
            enabledExtensions: ['dll']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(definitionWithPreset));

      await extensionDetector.loadExtensionDefinitions('/test/path', 'dll_only');

      const enabledExtensions = extensionDetector.getEnabledExtensions();
      expect(enabledExtensions).toContain('dll');
      expect(enabledExtensions).not.toContain('exe');
    });
  });
});