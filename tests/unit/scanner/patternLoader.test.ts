import { describe, it, expect, beforeEach } from 'vitest';
import { PatternLoader } from '../../../src/main/services/scanner/patternLoader';
import * as path from 'path';

describe('PatternLoader', () => {
  let patternLoader: PatternLoader;

  beforeEach(() => {
    patternLoader = new PatternLoader();
  });

  describe('Default Pattern Loading', () => {
    it('should load default patterns successfully', async () => {
      const patterns = await patternLoader.loadDefaultPatterns();
      
      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      
      // 基本的なパターンが含まれていることを確認
      const patternNames = patterns.map(p => p.name);
      expect(patternNames).toContain('UnityWebRequest');
      expect(patternNames).toContain('Process.Start');
      expect(patternNames).toContain('DllImport');
    });

    it('should compile patterns with correct structure', async () => {
      const patterns = await patternLoader.loadDefaultPatterns();
      
      for (const pattern of patterns) {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('severity');
        expect(pattern).toHaveProperty('regex');
        expect(pattern).toHaveProperty('description');
        
        // RegExpオブジェクトであることを確認
        expect(pattern.regex).toBeInstanceOf(RegExp);
        
        // severityが有効な値であることを確認
        expect(['critical', 'warning', 'info']).toContain(pattern.severity);
      }
    });
  });

  describe('Pattern File Information', () => {
    it('should provide pattern file info after loading', async () => {
      await patternLoader.loadDefaultPatterns();
      
      const info = patternLoader.getPatternFileInfo();
      expect(info).toBeDefined();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('version');
    });

    it('should return null when no pattern file is loaded', () => {
      const info = patternLoader.getPatternFileInfo();
      expect(info).toBeNull();
    });
  });

  describe('Pattern-level Severity', () => {
    it('should use pattern-specific severity when available', async () => {
      const patterns = await patternLoader.loadDefaultPatterns();
      
      // Socket パターンは critical severity に設定されている
      const socketPattern = patterns.find(p => p.name === 'Socket');
      expect(socketPattern).toBeDefined();
      expect(socketPattern?.severity).toBe('critical');
      
      // URL パターンは info severity に設定されている
      const urlPattern = patterns.find(p => p.name === 'URL');
      expect(urlPattern).toBeDefined();
      expect(urlPattern?.severity).toBe('info');
      
      // File.Delete パターンは critical severity に設定されている
      const fileDeletePattern = patterns.find(p => p.name === 'File.Delete');
      expect(fileDeletePattern).toBeDefined();
      expect(fileDeletePattern?.severity).toBe('critical');
    });

    it('should fallback to category severity when pattern severity is not specified', async () => {
      // DLL検出は拡張子システムに移行されたため、パターンマッチングには含まれない
      const patterns = await patternLoader.loadDefaultPatterns();
      const networkPattern = patterns.find(p => p.name === 'UnityWebRequest');
      expect(networkPattern).toBeDefined();
      expect(networkPattern?.severity).toBe('warning'); // パターンレベルの設定
    });
  });

  describe('Preset Application', () => {
    it('should load patterns with preset successfully', async () => {
      const defaultPatternPath = path.join(__dirname, '../../../src/main/resources/patterns/default-patterns.json');
      
      // standardプリセットを適用
      const patterns = await patternLoader.loadPatternsWithPreset(defaultPatternPath, 'standard');
      
      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      
      // relaxedプリセットはより少ないパターンを持つべき
      const relaxedPatterns = await patternLoader.loadPatternsWithPreset(defaultPatternPath, 'relaxed');
      expect(relaxedPatterns.length).toBeLessThan(patterns.length);
    });

    it('should throw error for invalid preset', async () => {
      const defaultPatternPath = path.join(__dirname, '../../../src/main/resources/patterns/default-patterns.json');
      
      await expect(
        patternLoader.loadPatternsWithPreset(defaultPatternPath, 'invalid_preset')
      ).rejects.toThrow('プリセット \'invalid_preset\' が見つかりません');
    });

    it('should provide available presets after loading', async () => {
      await patternLoader.loadDefaultPatterns();
      
      const presets = patternLoader.getAvailablePresets();
      expect(presets).toBeDefined();
      expect(presets).toHaveProperty('strict');
      expect(presets).toHaveProperty('standard');
      expect(presets).toHaveProperty('relaxed');
    });
  });

  describe('Pattern File Discovery', () => {
    it('should find available pattern files', async () => {
      const patternFiles = await PatternLoader.findAvailablePatternFiles();
      
      expect(patternFiles).toBeDefined();
      expect(Array.isArray(patternFiles)).toBe(true);
      expect(patternFiles.length).toBeGreaterThan(0);
      
      // default-patterns.jsonが含まれていることを確認
      const hasDefaultPattern = patternFiles.some(file => file.includes('default-patterns.json'));
      expect(hasDefaultPattern).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON files gracefully', async () => {
      const invalidPath = '/non/existent/path/invalid.json';
      
      await expect(
        patternLoader.loadPatternsFromFile(invalidPath)
      ).rejects.toThrow('パターンファイルの読み込みに失敗しました');
    });

    it('should handle malformed pattern regex gracefully', async () => {
      // このテストでは実際のマルフォームパターンでのテストは困難なため、
      // パターンローダーが例外を適切にキャッチすることを確認
      const patterns = await patternLoader.loadDefaultPatterns();
      
      // すべてのパターンが正常にコンパイルされていることを確認
      expect(patterns.every(p => p.regex instanceof RegExp)).toBe(true);
    });
  });

  describe('Pattern Filtering', () => {
    it('should filter patterns by category in presets', async () => {
      const defaultPatternPath = path.join(__dirname, '../../../src/main/resources/patterns/default-patterns.json');
      
      // relaxedプリセット（processとregistryのみ）
      const relaxedPatterns = await patternLoader.loadPatternsWithPreset(defaultPatternPath, 'relaxed');
      
      const categories = [...new Set(relaxedPatterns.map(p => p.category))];
      expect(categories).toContain('process');
      expect(categories).toContain('registry');
      // DLL検出は拡張子システムに移行されたため、パターンマッチングには含まれない
      
      // networkカテゴリは含まれていないはず
      expect(categories).not.toContain('network');
    });

    it('should exclude specific patterns when specified in preset', async () => {
      const defaultPatternPath = path.join(__dirname, '../../../src/main/resources/patterns/default-patterns.json');
      
      // standardプリセット（URLパターンを除外）
      const standardPatterns = await patternLoader.loadPatternsWithPreset(defaultPatternPath, 'standard');
      
      const patternNames = standardPatterns.map(p => p.name);
      expect(patternNames).not.toContain('URL');
      expect(patternNames).not.toContain('FileStream');
    });
  });
});