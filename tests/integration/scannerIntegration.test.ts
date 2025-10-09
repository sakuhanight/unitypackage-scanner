import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatternMatcher } from '../../src/main/services/scanner/patternMatcher';
import { PackageParser } from '../../src/main/services/packageParser';
import { ExtractedFile, ScanFinding } from '../../src/shared/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as tar from 'tar';

describe('Scanner Integration Tests', () => {
  let patternMatcher: PatternMatcher;
  let packageParser: PackageParser;
  let tempDir: string;

  beforeEach(async () => {
    patternMatcher = new PatternMatcher();
    await patternMatcher.initialize();

    tempDir = path.join(os.tmpdir(), `scanner-integration-test-${Date.now()}`);
    packageParser = new PackageParser(tempDir);
  });

  afterEach(async () => {
    await packageParser.cleanup();
  });

  describe('Pattern Detection Integration', () => {
    it('should detect patterns in C# scripts with extension detection', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/NetworkScript.cs',
          type: 'script',
          size: 1024,
          content: `using UnityEngine;
using UnityEngine.Networking;
using System.Diagnostics;

public class SuspiciousScript : MonoBehaviour
{
    void Start()
    {
        // ネットワーク通信
        UnityWebRequest.Get("https://malicious-site.com/data");
        
        // プロセス実行
        Process.Start("cmd.exe", "/c format c:");
        
        // ファイル削除
        System.IO.File.Delete("C:\\\\Windows\\\\System32\\\\important.dll");
    }
}`,
          guid: 'abcd1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Plugins/Malware.dll',
          type: 'dll',
          size: 2048,
          guid: 'efgh5678901234abcdef567890123456'
        },
        {
          path: 'Assets/Scripts/malicious.bat',
          type: 'other',
          size: 256,
          content: '@echo off\\nformat c: /y\\ndel /f /q c:\\\\*.*',
          guid: 'ijkl9012345678abcdef123456789012'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // パターンマッチング検出を確認
      const networkFindings = findings.filter(f => f.category === 'network');
      expect(networkFindings.length).toBeGreaterThanOrEqual(1);

      const processFindings = findings.filter(f => f.category === 'process');
      expect(processFindings.length).toBeGreaterThanOrEqual(1);

      const fileSystemFindings = findings.filter(f => f.category === 'fileSystem');
      expect(fileSystemFindings.length).toBeGreaterThanOrEqual(1);

      // 拡張子検出を確認
      const dllFindings = findings.filter(f => f.category === 'dll');
      expect(dllFindings).toHaveLength(1);
      expect(dllFindings[0].filePath).toBe('Assets/Plugins/Malware.dll');

      const scriptFindings = findings.filter(f => f.category === 'script');
      expect(scriptFindings.length).toBeGreaterThanOrEqual(1); // .bat file

      // 全体のファインディング数を確認
      expect(findings.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle files with no suspicious content', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/CleanScript.cs',
          type: 'script',
          size: 512,
          content: `using UnityEngine;

public class CleanScript : MonoBehaviour
{
    void Start()
    {
        Debug.Log("Hello World!");
    }
    
    void Update()
    {
        transform.Rotate(0, 90 * Time.deltaTime, 0);
    }
}`,
          guid: 'clean1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Textures/logo.png',
          type: 'texture',
          size: 4096,
          guid: 'texture1234567890abcdef123456789ab'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // 悪意のあるパターンは検出されないはず
      expect(findings).toHaveLength(0);
    });

    it('should properly categorize findings by severity', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/MixedScript.cs',
          type: 'script',
          size: 1024,
          content: `using UnityEngine;
using UnityEngine.Networking;
using System.Diagnostics;

public class MixedScript : MonoBehaviour
{
    void NetworkStuff()
    {
        // Warning level
        UnityWebRequest.Get("https://api.example.com");
    }
    
    void DangerousStuff()
    {
        // Critical level
        Process.Start("malware.exe");
    }
}`,
          guid: 'mixed1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Plugins/suspicious.exe',
          type: 'other',
          size: 1024,
          guid: 'exe123456789abcdef1234567890abcd'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      const criticalFindings = findings.filter(f => f.severity === 'critical');
      const warningFindings = findings.filter(f => f.severity === 'warning');

      expect(criticalFindings.length).toBeGreaterThan(0);
      expect(warningFindings.length).toBeGreaterThan(0);

      // EXE files should be critical
      const exeFindings = criticalFindings.filter(f => f.filePath.includes('.exe'));
      expect(exeFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Extension Detection Integration', () => {
    it('should detect multiple file extensions correctly', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/native.dll',
          type: 'dll',
          size: 1024,
          guid: 'dll123456789abcdef1234567890abcd'
        },
        {
          path: 'Assets/Scripts/automation.ps1',
          type: 'other',
          size: 512,
          content: 'Get-Process | Stop-Process -Force',
          guid: 'ps1123456789abcdef1234567890abcd'
        },
        {
          path: 'Assets/Tools/installer.exe',
          type: 'other',
          size: 2048,
          guid: 'exe123456789abcdef1234567890abcd'
        },
        {
          path: 'Assets/Archive/data.zip',
          type: 'other',
          size: 4096,
          guid: 'zip123456789abcdef1234567890abcd'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // 各拡張子が検出されることを確認
      expect(findings.some(f => f.filePath.includes('.dll'))).toBe(true);
      expect(findings.some(f => f.filePath.includes('.ps1'))).toBe(true);
      expect(findings.some(f => f.filePath.includes('.exe'))).toBe(true);
      expect(findings.some(f => f.filePath.includes('.zip'))).toBe(true);

      // 適切なカテゴリが設定されていることを確認
      expect(findings.some(f => f.category === 'dll')).toBe(true);
      expect(findings.some(f => f.category === 'script')).toBe(true);
      expect(findings.some(f => f.category === 'executable')).toBe(true);
      expect(findings.some(f => f.category === 'archive')).toBe(true);
    });

    it('should analyze script content for dangerous keywords', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/malicious.bat',
          type: 'other',
          size: 256,
          content: '@echo off\\nformat c: /y\\ndel /f /q c:\\\\*.*\\nregedit /s malicious.reg',
          guid: 'bat123456789abcdef1234567890abcd'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      const scriptFindings = findings.filter(f => f.category === 'script');
      expect(scriptFindings).toHaveLength(1);

      const finding = scriptFindings[0];
      expect(finding.context).toContain('疑わしいキーワード');
      expect(finding.context).toContain('format');
      expect(finding.context).toContain('del');
      expect(finding.context).toContain('regedit');
    });
  });

  describe('Preset Integration', () => {
    it('should apply security_focused preset correctly', async () => {
      // Security focused preset should detect DLL and executable files but not archives
      const extensionDetector = patternMatcher.getExtensionDetector();
      
      const extensionDefinitionPath = path.join(
        __dirname,
        '../../src/main/resources/patterns/file-extensions.json'
      );
      
      await extensionDetector.loadExtensionDefinitions(extensionDefinitionPath, 'security_focused');

      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/lib.dll',
          type: 'dll',
          size: 1024,
          guid: 'dll123456789abcdef1234567890abcd'
        },
        {
          path: 'Assets/Tools/tool.exe',
          type: 'other',
          size: 2048,
          guid: 'exe123456789abcdef1234567890abcd'
        },
        {
          path: 'Assets/Data/archive.zip',
          type: 'other',
          size: 1024,
          guid: 'zip123456789abcdef1234567890abcd'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // DLL and EXE should be detected
      expect(findings.some(f => f.filePath.includes('.dll'))).toBe(true);
      expect(findings.some(f => f.filePath.includes('.exe'))).toBe(true);

      // ZIP should not be detected in security_focused preset
      expect(findings.some(f => f.filePath.includes('.zip'))).toBe(false);
    });

    it('should apply strict preset correctly', async () => {
      const extensionDetector = patternMatcher.getExtensionDetector();
      
      const extensionDefinitionPath = path.join(
        __dirname,
        '../../src/main/resources/patterns/file-extensions.json'
      );
      
      await extensionDetector.loadExtensionDefinitions(extensionDefinitionPath, 'strict');

      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Data/archive.zip',
          type: 'other',
          size: 1024,
          guid: 'zip123456789abcdef1234567890abcd'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // Strict mode should detect even ZIP files
      expect(findings.some(f => f.filePath.includes('.zip'))).toBe(true);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large number of files efficiently', () => {
      const extractedFiles: ExtractedFile[] = [];

      // Generate 1000 test files
      for (let i = 0; i < 1000; i++) {
        extractedFiles.push({
          path: `Assets/Scripts/Script${i}.cs`,
          type: 'script',
          size: 512,
          content: `using UnityEngine;
public class Script${i} : MonoBehaviour
{
    void Start() { Debug.Log("Script ${i}"); }
}`,
          guid: `${i.toString().padStart(32, '0')}`
        });
      }

      const startTime = Date.now();
      const findings = patternMatcher.scanFiles(extractedFiles);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should process 1000 files in reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      
      // Should not find any suspicious patterns in clean scripts
      expect(findings).toHaveLength(0);
    });

    it('should handle files with very long content', () => {
      const longContent = 'using UnityEngine;\\n'.repeat(10000) + 
                         'public class LongScript : MonoBehaviour {}';

      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/VeryLongScript.cs',
          type: 'script',
          size: longContent.length,
          content: longContent,
          guid: 'long1234567890abcdef1234567890ab'
        }
      ];

      const startTime = Date.now();
      const findings = patternMatcher.scanFiles(extractedFiles);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should handle long files efficiently
      expect(processingTime).toBeLessThan(1000);
      expect(findings).toHaveLength(0);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should continue processing when some files have errors', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/GoodScript.cs',
          type: 'script',
          size: 256,
          content: 'using UnityEngine; public class Good {}',
          guid: 'good1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Scripts/BadScript.cs',
          type: 'script',
          size: 256,
          content: undefined, // Simulating missing content
          guid: 'bad12345678901234567890abcdef12'
        },
        {
          path: 'Assets/Plugins/malicious.dll',
          type: 'dll',
          size: 1024,
          guid: 'mal12345678901234567890abcdef12'
        }
      ];

      // Should not throw error and should still process valid files
      expect(() => {
        const findings = patternMatcher.scanFiles(extractedFiles);
        
        // Should detect DLL even if script content is missing
        expect(findings.some(f => f.filePath.includes('.dll'))).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should load custom pattern definitions', async () => {
      // Test loading pattern definitions from file
      const patternInfo = patternMatcher.getPatternInfo();
      expect(patternInfo).toBeTruthy();
      expect(patternInfo?.name).toBe('Default Security Patterns');
      expect(patternInfo?.patternCount).toBeGreaterThan(0);
    });

    it('should provide extension detector information', () => {
      const extensionDetector = patternMatcher.getExtensionDetector();
      const definitionInfo = extensionDetector.getDefinitionInfo();
      
      expect(definitionInfo).toBeTruthy();
      expect(definitionInfo?.name).toBe('File Extension Detection Rules');
      expect(definitionInfo?.ruleCount).toBeGreaterThan(0);
    });

    it('should list available presets', () => {
      const patternPresets = patternMatcher.getAvailablePresets();
      const extensionPresets = patternMatcher.getExtensionDetector().getAvailablePresets();

      expect(patternPresets).toBeTruthy();
      expect(extensionPresets).toBeTruthy();

      expect(patternPresets).toHaveProperty('strict');
      expect(patternPresets).toHaveProperty('standard');
      expect(patternPresets).toHaveProperty('relaxed');

      expect(extensionPresets).toHaveProperty('strict');
      expect(extensionPresets).toHaveProperty('security_focused');
      expect(extensionPresets).toHaveProperty('executables_only');
      expect(extensionPresets).toHaveProperty('native_libraries');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should detect common Unity plugin patterns', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/x86_64/NativePlugin.dll',
          type: 'dll',
          size: 1024,
          guid: 'native123456789abcdef123456789ab'
        },
        {
          path: 'Assets/Plugins/NativeWrapper.cs',
          type: 'script',
          size: 512,
          content: `using System.Runtime.InteropServices;

public static class NativeWrapper
{
    [DllImport("NativePlugin")]
    public static extern void Initialize();
    
    [DllImport("kernel32.dll")]
    public static extern void ExitProcess(int exitCode);
}`,
          guid: 'wrapper123456789abcdef123456789ab'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // Should detect DLL file
      expect(findings.some(f => f.category === 'dll')).toBe(true);
      
      // Should detect DllImport usage
      expect(findings.some(f => f.category === 'native')).toBe(true);
    });

    it('should handle Unity asset metadata correctly', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/PlayerController.cs.meta',
          type: 'meta',
          size: 256,
          content: 'fileFormatVersion: 2\\nguid: 12345678901234567890123456789012',
          guid: 'meta1234567890abcdef1234567890ab'
        },
        {
          path: 'Assets/Scripts/PlayerController.cs',
          type: 'script',
          size: 1024,
          content: `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        transform.Translate(h * Time.deltaTime, 0, 0);
    }
}`,
          guid: 'player123456789abcdef123456789ab'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // Meta files should not trigger pattern detection
      // Clean script should not trigger pattern detection
      expect(findings).toHaveLength(0);
    });
  });
});