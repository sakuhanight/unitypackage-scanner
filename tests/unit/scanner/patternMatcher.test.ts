import { describe, it, expect, beforeEach } from 'vitest';
import { PatternMatcher } from '../../../src/main/services/scanner/patternMatcher';
import { ExtractedFile } from '../../../src/shared/types';

describe('PatternMatcher', () => {
  let patternMatcher: PatternMatcher;

  beforeEach(async () => {
    patternMatcher = new PatternMatcher();
    await patternMatcher.initialize();
  });

  describe('DLL File Detection', () => {
    it('should detect DLL files and create warning findings', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/MyLibrary.dll',
          type: 'dll',
          size: 1024,
          guid: 'abcd1234efgh5678ijkl9012mnop3456'
        },
        {
          path: 'Assets/Scripts/MyScript.cs',
          type: 'script',
          size: 512,
          content: 'using UnityEngine;\n\npublic class MyScript : MonoBehaviour\n{\n    void Start()\n    {\n        Debug.Log("Hello World");\n    }\n}',
          guid: 'efgh5678ijkl9012mnop3456abcd1234'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);

      // DLL関連のファインディングを確認
      const dllFindings = findings.filter(f => f.category === 'dll');
      expect(dllFindings).toHaveLength(1);
      
      const dllFinding = dllFindings[0];
      expect(dllFinding.severity).toBe('warning');
      expect(dllFinding.pattern).toBe('DLL File');
      expect(dllFinding.filePath).toBe('Assets/Plugins/MyLibrary.dll');
      expect(dllFinding.description).toBe('DLLファイルが含まれています。内容を確認してください。');
      expect(dllFinding.context).toBe('Dynamic Link Library: Assets/Plugins/MyLibrary.dll');
    });

    it('should detect multiple DLL files', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/Library1.dll',
          type: 'dll',
          size: 1024,
          guid: 'abcd1234efgh5678ijkl9012mnop3456'
        },
        {
          path: 'Assets/Plugins/Library2.dll',
          type: 'dll',
          size: 2048,
          guid: 'efgh5678ijkl9012mnop3456abcd1234'
        },
        {
          path: 'Assets/Scripts/Test.cs',
          type: 'script',
          size: 256,
          content: 'public class Test {}',
          guid: 'ijkl9012mnop3456abcd1234efgh5678'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);
      const dllFindings = findings.filter(f => f.category === 'dll');
      
      expect(dllFindings).toHaveLength(2);
      expect(dllFindings[0].filePath).toBe('Assets/Plugins/Library1.dll');
      expect(dllFindings[1].filePath).toBe('Assets/Plugins/Library2.dll');
    });

    it('should not create DLL findings when no DLL files are present', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/MyScript.cs',
          type: 'script',
          size: 512,
          content: 'using UnityEngine;\n\npublic class MyScript : MonoBehaviour {}',
          guid: 'abcd1234efgh5678ijkl9012mnop3456'
        },
        {
          path: 'Assets/Textures/image.png',
          type: 'texture',
          size: 4096,
          guid: 'efgh5678ijkl9012mnop3456abcd1234'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);
      const dllFindings = findings.filter(f => f.category === 'dll');
      
      expect(dllFindings).toHaveLength(0);
    });
  });

  describe('Script Pattern Detection', () => {
    it('should detect dangerous patterns in C# files', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/NetworkScript.cs',
          type: 'script',
          size: 512,
          content: `using UnityEngine;
using UnityEngine.Networking;

public class NetworkScript : MonoBehaviour
{
    void Start()
    {
        UnityWebRequest.Get("https://example.com/data");
    }
}`,
          guid: 'abcd1234efgh5678ijkl9012mnop3456'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);
      const networkFindings = findings.filter(f => f.category === 'network');
      
      // UnityWebRequestパターンとURLパターンの両方が検出される
      expect(networkFindings.length).toBeGreaterThanOrEqual(1);
      
      const unityWebRequestFindings = networkFindings.filter(f => f.pattern === 'UnityWebRequest');
      expect(unityWebRequestFindings).toHaveLength(1);
      expect(unityWebRequestFindings[0].severity).toBe('warning');
    });

    it('should ignore patterns in comment lines', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Scripts/CommentedScript.cs',
          type: 'script',
          size: 256,
          content: `using UnityEngine;

public class CommentedScript : MonoBehaviour
{
    void Start()
    {
        // UnityWebRequest.Get("https://example.com");
        Debug.Log("Normal code");
    }
}`,
          guid: 'abcd1234efgh5678ijkl9012mnop3456'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);
      const networkFindings = findings.filter(f => f.category === 'network');
      
      expect(networkFindings).toHaveLength(0);
    });
  });

  describe('Integration Test', () => {
    it('should detect both DLL files and script patterns in the same scan', () => {
      const extractedFiles: ExtractedFile[] = [
        {
          path: 'Assets/Plugins/NetworkLib.dll',
          type: 'dll',
          size: 1024,
          guid: 'dll1234567890abcdef1234567890abcd'
        },
        {
          path: 'Assets/Scripts/ProcessScript.cs',
          type: 'script',
          size: 512,
          content: `using System.Diagnostics;

public class ProcessScript
{
    void Execute()
    {
        Process.Start("notepad.exe");
    }
}`,
          guid: 'script1234567890abcdef1234567890ab'
        }
      ];

      const findings = patternMatcher.scanFiles(extractedFiles);
      
      // DLLファインディングを確認
      const dllFindings = findings.filter(f => f.category === 'dll');
      expect(dllFindings).toHaveLength(1);
      expect(dllFindings[0].severity).toBe('warning');
      
      // プロセス実行ファインディングを確認
      const processFindings = findings.filter(f => f.category === 'process');
      expect(processFindings).toHaveLength(1);
      expect(processFindings[0].severity).toBe('critical');
      expect(processFindings[0].pattern).toBe('Process.Start');
      
      // 合計ファインディング数を確認
      expect(findings).toHaveLength(2);
    });
  });
});