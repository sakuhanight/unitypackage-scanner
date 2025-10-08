import { ScanFinding, ExtractedFile } from '../../../shared/types';

/**
 * パターンマッチングによる検出エンジン
 */
export class PatternMatcher {
  private patterns: DetectionPattern[] = [
    // ネットワーク通信パターン
    {
      name: 'UnityWebRequest',
      category: 'network',
      severity: 'warning',
      regex: /UnityWebRequest\s*\.\s*(Get|Post|Put|Delete|Head)/gi,
      description: 'ネットワーク通信が検出されました'
    },
    {
      name: 'WWW',
      category: 'network', 
      severity: 'warning',
      regex: /new\s+WWW\s*\(/gi,
      description: 'HTTP通信（旧API）が検出されました'
    },
    {
      name: 'HttpClient',
      category: 'network',
      severity: 'warning', 
      regex: /(HttpClient|WebClient)\s*\(/gi,
      description: 'HTTP通信ライブラリの使用が検出されました'
    },
    {
      name: 'Socket',
      category: 'network',
      severity: 'warning',
      regex: /(Socket|TcpClient|UdpClient)\s*\(/gi,
      description: 'ソケット通信が検出されました'
    },
    {
      name: 'URL',
      category: 'network',
      severity: 'info',
      regex: /(https?:\/\/[^\s"']+)/gi,
      description: 'URL文字列が検出されました'
    },

    // ファイルシステムアクセス
    {
      name: 'File.Delete',
      category: 'fileSystem',
      severity: 'warning',
      regex: /File\s*\.\s*Delete/gi,
      description: 'ファイル削除処理が検出されました'
    },
    {
      name: 'File.WriteAllBytes',
      category: 'fileSystem',
      severity: 'warning',
      regex: /File\s*\.\s*WriteAll(Bytes|Text)/gi,
      description: 'ファイル書き込み処理が検出されました'
    },
    {
      name: 'Directory.Delete',
      category: 'fileSystem',
      severity: 'warning',
      regex: /Directory\s*\.\s*Delete/gi,
      description: 'ディレクトリ削除処理が検出されました'
    },
    {
      name: 'FileStream',
      category: 'fileSystem',
      severity: 'info',
      regex: /(FileStream|StreamWriter)\s*\(/gi,
      description: 'ファイルストリーム操作が検出されました'
    },

    // プロセス実行
    {
      name: 'Process.Start',
      category: 'process',
      severity: 'critical',
      regex: /Process\s*\.\s*Start/gi,
      description: '外部プロセス実行が検出されました'
    },
    {
      name: 'ProcessStartInfo',
      category: 'process',
      severity: 'critical',
      regex: /ProcessStartInfo\s*\(/gi,
      description: 'プロセス起動設定が検出されました'
    },

    // ネイティブコード
    {
      name: 'DllImport',
      category: 'native',
      severity: 'warning',
      regex: /\[DllImport\s*\(/gi,
      description: 'ネイティブライブラリの呼び出しが検出されました'
    },
    {
      name: 'Marshal',
      category: 'native',
      severity: 'warning',
      regex: /Marshal\s*\.\s*(GetDelegateForFunctionPointer|PtrToStringAnsi)/gi,
      description: 'メモリマーシャリング操作が検出されました'
    },

    // リフレクション
    {
      name: 'Assembly.Load',
      category: 'reflection',
      severity: 'info',
      regex: /Assembly\s*\.\s*Load(From)?/gi,
      description: 'アセンブリの動的ロードが検出されました'
    },
    {
      name: 'Type.GetType',
      category: 'reflection',
      severity: 'info',
      regex: /Type\s*\.\s*GetType/gi,
      description: '型の動的取得が検出されました'
    },
    {
      name: 'Activator.CreateInstance',
      category: 'reflection',
      severity: 'info',
      regex: /Activator\s*\.\s*CreateInstance/gi,
      description: 'オブジェクトの動的生成が検出されました'
    },
    {
      name: 'MethodInfo.Invoke',
      category: 'reflection',
      severity: 'warning',
      regex: /MethodInfo\s*\.\s*Invoke/gi,
      description: 'メソッドの動的実行が検出されました'
    },

    // レジストリアクセス
    {
      name: 'Registry.SetValue',
      category: 'registry',
      severity: 'critical',
      regex: /Registry(Key)?\s*\.\s*SetValue/gi,
      description: 'レジストリ書き込みが検出されました'
    }
  ];

  /**
   * 抽出されたファイルからパターンマッチングを実行
   */
  scanFiles(extractedFiles: ExtractedFile[]): ScanFinding[] {
    const findings: ScanFinding[] = [];
    let findingIdCounter = 1;

    // C#ファイルのみを対象にスキャン
    const scriptFiles = extractedFiles.filter(file => 
      file.type === 'script' && file.content
    );

    for (const file of scriptFiles) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // コメント行はスキップ
        if (this.isCommentLine(line)) continue;

        for (const pattern of this.patterns) {
          const matches = Array.from(line.matchAll(pattern.regex));
          
          for (const _ of matches) {
            findings.push({
              id: findingIdCounter.toString(),
              severity: pattern.severity,
              category: pattern.category,
              pattern: pattern.name,
              filePath: file.path,
              lineNumber,
              context: line.trim(),
              description: pattern.description
            });
            findingIdCounter++;
          }
        }
      }
    }

    return findings;
  }

  /**
   * コメント行かどうかを判定
   */
  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*');
  }
}

interface DetectionPattern {
  name: string;
  category: ScanFinding['category'];
  severity: ScanFinding['severity'];
  regex: RegExp;
  description: string;
}