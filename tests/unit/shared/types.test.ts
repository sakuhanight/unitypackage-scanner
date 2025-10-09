import { describe, it, expect } from 'vitest';
import { 
  ScanResult, 
  ScanFinding, 
  PackageInfo, 
  ExtractedFile, 
  ScanProgress, 
  ScanOptions, 
  AppSettings, 
  CustomPattern 
} from '../../../src/shared/types';

describe('Shared Types', () => {
  describe('ScanResult', () => {
    it('should have correct structure', () => {
      const scanResult: ScanResult = {
        id: 'scan-123',
        filePath: '/path/to/package.unitypackage',
        scanDate: '2023-12-07T10:00:00Z',
        status: 'completed',
        findings: [],
        summary: {
          critical: 0,
          warning: 0,
          info: 0,
          total: 0
        }
      };

      expect(scanResult.id).toBe('scan-123');
      expect(scanResult.status).toBe('completed');
      expect(scanResult.summary).toHaveProperty('critical');
      expect(scanResult.summary).toHaveProperty('warning');
      expect(scanResult.summary).toHaveProperty('info');
      expect(scanResult.summary).toHaveProperty('total');
    });

    it('should support optional packageInfo', () => {
      const scanResultWithPackage: ScanResult = {
        id: 'scan-123',
        filePath: '/path/to/package.unitypackage',
        scanDate: '2023-12-07T10:00:00Z',
        status: 'completed',
        findings: [],
        summary: {
          critical: 0,
          warning: 0,
          info: 0,
          total: 0
        },
        packageInfo: {
          fileName: 'package.unitypackage',
          fileSize: 1024,
          extractedPath: '/tmp/extracted',
          fileCount: 5,
          scriptCount: 2,
          dllCount: 1,
          assetCount: 2,
          extractedFiles: []
        }
      };

      expect(scanResultWithPackage.packageInfo).toBeDefined();
      expect(scanResultWithPackage.packageInfo?.fileName).toBe('package.unitypackage');
    });
  });

  describe('ScanFinding', () => {
    it('should have all required properties', () => {
      const finding: ScanFinding = {
        id: 'finding-1',
        severity: 'critical',
        category: 'process',
        pattern: 'Process.Start',
        filePath: 'Assets/Scripts/MaliciousScript.cs',
        lineNumber: 15,
        context: 'Process.Start("malware.exe");',
        description: 'Detected process execution'
      };

      expect(finding.id).toBe('finding-1');
      expect(finding.severity).toBe('critical');
      expect(finding.category).toBe('process');
      expect(finding.pattern).toBe('Process.Start');
      expect(finding.filePath).toBe('Assets/Scripts/MaliciousScript.cs');
      expect(finding.lineNumber).toBe(15);
      expect(finding.context).toBe('Process.Start("malware.exe");');
      expect(finding.description).toBe('Detected process execution');
    });

    it('should support all severity levels', () => {
      const severities: ScanFinding['severity'][] = ['critical', 'warning', 'info'];
      
      severities.forEach(severity => {
        const finding: ScanFinding = {
          id: `finding-${severity}`,
          severity,
          category: 'network',
          pattern: 'Test Pattern',
          filePath: 'test.cs',
          lineNumber: 1,
          context: 'test context',
          description: 'test description'
        };

        expect(finding.severity).toBe(severity);
      });
    });

    it('should support all category types', () => {
      const categories: ScanFinding['category'][] = [
        'network', 'fileSystem', 'process', 'native', 'reflection', 
        'registry', 'dll', 'executable', 'script', 'archive'
      ];

      categories.forEach(category => {
        const finding: ScanFinding = {
          id: `finding-${category}`,
          severity: 'warning',
          category,
          pattern: 'Test Pattern',
          filePath: 'test.cs',
          lineNumber: 1,
          context: 'test context',
          description: 'test description'
        };

        expect(finding.category).toBe(category);
      });
    });
  });

  describe('PackageInfo', () => {
    it('should have correct structure', () => {
      const packageInfo: PackageInfo = {
        fileName: 'test.unitypackage',
        fileSize: 2048,
        extractedPath: '/tmp/extracted/test',
        fileCount: 10,
        scriptCount: 3,
        dllCount: 2,
        assetCount: 5,
        extractedFiles: []
      };

      expect(packageInfo.fileName).toBe('test.unitypackage');
      expect(packageInfo.fileSize).toBe(2048);
      expect(packageInfo.extractedPath).toBe('/tmp/extracted/test');
      expect(packageInfo.fileCount).toBe(10);
      expect(packageInfo.scriptCount).toBe(3);
      expect(packageInfo.dllCount).toBe(2);
      expect(packageInfo.assetCount).toBe(5);
      expect(Array.isArray(packageInfo.extractedFiles)).toBe(true);
    });
  });

  describe('ExtractedFile', () => {
    it('should support all file types', () => {
      const fileTypes: ExtractedFile['type'][] = [
        'script', 'dll', 'asset', 'texture', 'model', 'audio', 'meta', 'other'
      ];

      fileTypes.forEach(type => {
        const file: ExtractedFile = {
          path: `test.${type}`,
          type,
          size: 1024,
          guid: 'abcd1234567890abcdef1234567890ab'
        };

        expect(file.type).toBe(type);
      });
    });

    it('should support optional content and guid', () => {
      const fileWithContent: ExtractedFile = {
        path: 'Assets/Scripts/Test.cs',
        type: 'script',
        size: 512,
        content: 'using UnityEngine; public class Test {}',
        guid: 'abcd1234567890abcdef1234567890ab'
      };

      expect(fileWithContent.content).toBeDefined();
      expect(fileWithContent.guid).toBeDefined();

      const fileWithoutOptionals: ExtractedFile = {
        path: 'Assets/Textures/image.png',
        type: 'texture',
        size: 2048
      };

      expect(fileWithoutOptionals.content).toBeUndefined();
      expect(fileWithoutOptionals.guid).toBeUndefined();
    });
  });

  describe('ScanProgress', () => {
    it('should support all stages', () => {
      const stages: ScanProgress['stage'][] = ['extracting', 'analyzing', 'scanning', 'completed'];

      stages.forEach(stage => {
        const progress: ScanProgress = {
          stage,
          progress: 50
        };

        expect(progress.stage).toBe(stage);
        expect(progress.progress).toBe(50);
      });
    });

    it('should support optional fields', () => {
      const progressWithOptionals: ScanProgress = {
        stage: 'scanning',
        progress: 75,
        currentFile: 'Assets/Scripts/Test.cs',
        message: 'Scanning script files...'
      };

      expect(progressWithOptionals.currentFile).toBe('Assets/Scripts/Test.cs');
      expect(progressWithOptionals.message).toBe('Scanning script files...');

      const progressWithoutOptionals: ScanProgress = {
        stage: 'extracting',
        progress: 25
      };

      expect(progressWithoutOptionals.currentFile).toBeUndefined();
      expect(progressWithoutOptionals.message).toBeUndefined();
    });

    it('should validate progress range', () => {
      // Progress should be between 0 and 100
      const validProgress: ScanProgress = {
        stage: 'analyzing',
        progress: 50
      };

      expect(validProgress.progress).toBeGreaterThanOrEqual(0);
      expect(validProgress.progress).toBeLessThanOrEqual(100);
    });
  });

  describe('ScanOptions', () => {
    it('should have all optional properties', () => {
      const options: ScanOptions = {
        maxFileSize: 1024 * 1024, // 1MB
        tempDir: '/tmp/custom',
        patternFile: '/path/to/patterns.json',
        patternPreset: 'strict'
      };

      expect(options.maxFileSize).toBe(1024 * 1024);
      expect(options.tempDir).toBe('/tmp/custom');
      expect(options.patternFile).toBe('/path/to/patterns.json');
      expect(options.patternPreset).toBe('strict');
    });

    it('should work with empty options', () => {
      const emptyOptions: ScanOptions = {};

      expect(emptyOptions.maxFileSize).toBeUndefined();
      expect(emptyOptions.tempDir).toBeUndefined();
      expect(emptyOptions.patternFile).toBeUndefined();
      expect(emptyOptions.patternPreset).toBeUndefined();
    });
  });

  describe('AppSettings', () => {
    it('should have correct structure', () => {
      const settings: AppSettings = {
        theme: 'dark',
        language: 'ja',
        patternFile: '/path/to/patterns.json',
        patternPreset: 'standard',
        customPatterns: [],
        excludePaths: ['node_modules/**', '*.tmp'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        showDisclaimerOnStartup: true
      };

      expect(settings.theme).toBe('dark');
      expect(settings.language).toBe('ja');
      expect(settings.patternFile).toBe('/path/to/patterns.json');
      expect(settings.patternPreset).toBe('standard');
      expect(Array.isArray(settings.customPatterns)).toBe(true);
      expect(Array.isArray(settings.excludePaths)).toBe(true);
      expect(settings.maxFileSize).toBe(10 * 1024 * 1024);
      expect(settings.showDisclaimerOnStartup).toBe(true);
    });

    it('should support theme options', () => {
      const lightTheme: AppSettings['theme'] = 'light';
      const darkTheme: AppSettings['theme'] = 'dark';

      expect(['light', 'dark']).toContain(lightTheme);
      expect(['light', 'dark']).toContain(darkTheme);
    });

    it('should support language options', () => {
      const japanese: AppSettings['language'] = 'ja';
      const english: AppSettings['language'] = 'en';

      expect(['ja', 'en']).toContain(japanese);
      expect(['ja', 'en']).toContain(english);
    });
  });

  describe('CustomPattern', () => {
    it('should have correct structure', () => {
      const customPattern: CustomPattern = {
        name: 'Custom Network Check',
        category: 'network',
        severity: 'warning',
        regex: 'fetch\\\\s*\\\\(',
        description: 'Detects fetch API usage',
        enabled: true
      };

      expect(customPattern.name).toBe('Custom Network Check');
      expect(customPattern.category).toBe('network');
      expect(customPattern.severity).toBe('warning');
      expect(customPattern.regex).toBe('fetch\\\\s*\\\\(');
      expect(customPattern.description).toBe('Detects fetch API usage');
      expect(customPattern.enabled).toBe(true);
    });

    it('should reference ScanFinding types correctly', () => {
      const customPattern: CustomPattern = {
        name: 'Test Pattern',
        category: 'process', // Should be valid ScanFinding['category']
        severity: 'critical', // Should be valid ScanFinding['severity']
        regex: 'test',
        description: 'test pattern',
        enabled: false
      };

      // These should be valid types from ScanFinding
      expect(customPattern.category).toBe('process');
      expect(customPattern.severity).toBe('critical');
    });

    it('should support disabled patterns', () => {
      const disabledPattern: CustomPattern = {
        name: 'Disabled Pattern',
        category: 'registry',
        severity: 'info',
        regex: 'disabled',
        description: 'This pattern is disabled',
        enabled: false
      };

      expect(disabledPattern.enabled).toBe(false);
    });
  });

  describe('Type Constraints', () => {
    it('should enforce severity constraints', () => {
      // This test ensures TypeScript compilation succeeds with valid values
      const validSeverities: ScanFinding['severity'][] = ['critical', 'warning', 'info'];
      
      validSeverities.forEach(severity => {
        const finding: ScanFinding = {
          id: '1',
          severity,
          category: 'network',
          pattern: 'test',
          filePath: 'test.cs',
          lineNumber: 1,
          context: 'test',
          description: 'test'
        };
        
        expect(finding.severity).toBe(severity);
      });
    });

    it('should enforce category constraints', () => {
      // This test ensures TypeScript compilation succeeds with valid values
      const validCategories: ScanFinding['category'][] = [
        'network', 'fileSystem', 'process', 'native', 'reflection',
        'registry', 'dll', 'executable', 'script', 'archive'
      ];
      
      validCategories.forEach(category => {
        const finding: ScanFinding = {
          id: '1',
          severity: 'warning',
          category,
          pattern: 'test',
          filePath: 'test.cs',
          lineNumber: 1,
          context: 'test',
          description: 'test'
        };
        
        expect(finding.category).toBe(category);
      });
    });

    it('should enforce file type constraints', () => {
      const validFileTypes: ExtractedFile['type'][] = [
        'script', 'dll', 'asset', 'texture', 'model', 'audio', 'meta', 'other'
      ];
      
      validFileTypes.forEach(type => {
        const file: ExtractedFile = {
          path: 'test',
          type,
          size: 100
        };
        
        expect(file.type).toBe(type);
      });
    });

    it('should enforce progress stage constraints', () => {
      const validStages: ScanProgress['stage'][] = [
        'extracting', 'analyzing', 'scanning', 'completed'
      ];
      
      validStages.forEach(stage => {
        const progress: ScanProgress = {
          stage,
          progress: 0
        };
        
        expect(progress.stage).toBe(stage);
      });
    });
  });
});