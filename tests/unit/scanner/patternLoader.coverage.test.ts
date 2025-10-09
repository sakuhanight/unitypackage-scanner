import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternLoader } from '../../../src/main/services/scanner/patternLoader';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra for error testing
vi.mock('fs-extra', () => ({
  readFile: vi.fn(),
  readdir: vi.fn()
}));
const mockFs = vi.mocked(fs);

describe('PatternLoader Coverage Tests', () => {
  let patternLoader: PatternLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    patternLoader = new PatternLoader();
  });

  describe('Error Handling Coverage', () => {
    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(
        patternLoader.loadPatternsFromFile('/non/existent/file.json')
      ).rejects.toThrow('パターンファイルの読み込みに失敗しました');
    });

    it('should handle JSON parsing errors', async () => {
      mockFs.readFile.mockResolvedValue('invalid json content');

      await expect(
        patternLoader.loadPatternsFromFile('/invalid/file.json')
      ).rejects.toThrow('パターンファイルの読み込みに失敗しました');
    });

    it('should handle malformed regex patterns', async () => {
      const malformedPatternFile = {
        version: '1.0.0',
        name: 'Malformed Patterns',
        description: 'Test file with bad regex',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Bad Regex',
                description: 'Invalid regex pattern',
                regex: '[invalid(regex',
                flags: 'gi'
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(malformedPatternFile));

      // Should not throw error, but bad pattern should be skipped
      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(0);
    });

    it('should handle unknown error types', async () => {
      mockFs.readFile.mockRejectedValue('Unknown error type');

      await expect(
        patternLoader.loadPatternsFromFile('/test/file.json')
      ).rejects.toThrow('パターンファイルの読み込みに失敗しました: 不明なエラー');
    });
  });

  describe('Preset Error Handling', () => {
    it('should handle invalid preset name', async () => {
      const validPatternFile = {
        version: '1.0.0',
        name: 'Valid Patterns',
        description: 'Valid pattern file',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: []
          }
        },
        presets: {
          valid: {
            name: 'Valid Preset',
            description: 'Valid preset',
            enabledCategories: ['test']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(validPatternFile));

      await expect(
        patternLoader.loadPatternsWithPreset('/test/file.json', 'invalid_preset')
      ).rejects.toThrow("プリセット 'invalid_preset' が見つかりません");
    });

    it('should handle missing presets section', async () => {
      const patternFileWithoutPresets = {
        version: '1.0.0',
        name: 'No Presets',
        description: 'Pattern file without presets',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: []
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFileWithoutPresets));

      await expect(
        patternLoader.loadPatternsWithPreset('/test/file.json', 'any_preset')
      ).rejects.toThrow("プリセット 'any_preset' が見つかりません");
    });
  });

  describe('Pattern Compilation Edge Cases', () => {
    it('should handle patterns without severity (fallback to category)', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Fallback Test',
        description: 'Test severity fallback',
        categories: {
          test: {
            severity: 'critical' as const,
            description: 'Test category with severity',
            patterns: [
              {
                name: 'Pattern Without Severity',
                description: 'Should use category severity',
                regex: 'test',
                flags: 'gi'
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].severity).toBe('critical'); // Should fallback to category severity
    });

    it('should handle patterns with explicit severity', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Explicit Severity Test',
        description: 'Test explicit severity',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Pattern With Severity',
                description: 'Has explicit severity',
                regex: 'test',
                flags: 'gi',
                severity: 'info' as const
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].severity).toBe('info'); // Should use explicit severity
    });

    it('should handle categories without patterns', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Empty Category Test',
        description: 'Test empty category',
        categories: {
          empty: {
            severity: 'warning' as const,
            description: 'Empty category'
            // No patterns array
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(0);
    });

    it('should handle empty patterns array', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Empty Patterns Test',
        description: 'Test empty patterns',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: []
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(0);
    });
  });

  describe('Regex Flag Parsing', () => {
    it('should handle all valid regex flags', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Flag Test',
        description: 'Test regex flags',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'All Flags',
                description: 'Test all flags',
                regex: 'test',
                flags: 'gimsuy'
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].regex.flags).toContain('g'); // Should include auto-added 'g'
      expect(patterns[0].regex.flags.length).toBeGreaterThan(1);
    });

    it('should filter invalid flags', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Invalid Flag Test',
        description: 'Test invalid flags',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Invalid Flags',
                description: 'Test invalid flags',
                regex: 'test',
                flags: 'gixz' // x and z are invalid
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].regex.flags).toBe('gi'); // Should only include valid flags
    });

    it('should automatically add global flag when missing', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Missing Global Test',
        description: 'Test missing global flag',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'No Global Flag',
                description: 'Missing global flag',
                regex: 'test',
                flags: 'i'
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].regex.flags).toContain('g'); // Should add global flag
      expect(patterns[0].regex.flags).toContain('i');
    });

    it('should handle empty flags', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Empty Flags Test',
        description: 'Test empty flags',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Empty Flags',
                description: 'No flags specified',
                regex: 'test',
                flags: ''
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].regex.flags).toBe('g'); // Should add global flag
    });
  });

  describe('Preset Application Edge Cases', () => {
    it('should handle preset with non-existent categories', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Preset Test',
        description: 'Test preset with invalid categories',
        categories: {
          valid: {
            severity: 'warning' as const,
            description: 'Valid category',
            patterns: [
              {
                name: 'Valid Pattern',
                description: 'Valid pattern',
                regex: 'valid',
                flags: 'gi'
              }
            ]
          }
        },
        presets: {
          mixed: {
            name: 'Mixed Preset',
            description: 'Valid and invalid categories',
            enabledCategories: ['valid', 'invalid', 'nonexistent']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsWithPreset('/test/file.json', 'mixed');
      expect(patterns).toHaveLength(1); // Should only include valid category
      expect(patterns[0].name).toBe('Valid Pattern');
    });

    it('should handle preset with empty enabled categories', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Empty Preset Test',
        description: 'Test preset with empty categories',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Test Pattern',
                description: 'Test pattern',
                regex: 'test',
                flags: 'gi'
              }
            ]
          }
        },
        presets: {
          empty: {
            name: 'Empty Preset',
            description: 'No enabled categories',
            enabledCategories: []
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsWithPreset('/test/file.json', 'empty');
      expect(patterns).toHaveLength(0);
    });

    it('should handle exclude patterns correctly', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Exclude Test',
        description: 'Test pattern exclusion',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Keep Pattern',
                description: 'Should be kept',
                regex: 'keep',
                flags: 'gi'
              },
              {
                name: 'Exclude Pattern',
                description: 'Should be excluded',
                regex: 'exclude',
                flags: 'gi'
              }
            ]
          }
        },
        presets: {
          filtered: {
            name: 'Filtered Preset',
            description: 'Excludes specific patterns',
            enabledCategories: ['test'],
            excludePatterns: ['Exclude Pattern']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsWithPreset('/test/file.json', 'filtered');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Keep Pattern');
    });

    it('should handle preset without exclude patterns', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'No Exclude Test',
        description: 'Test preset without exclude patterns',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Pattern 1',
                description: 'First pattern',
                regex: 'pattern1',
                flags: 'gi'
              },
              {
                name: 'Pattern 2',
                description: 'Second pattern',
                regex: 'pattern2',
                flags: 'gi'
              }
            ]
          }
        },
        presets: {
          all: {
            name: 'All Patterns',
            description: 'Include all patterns',
            enabledCategories: ['test']
            // No excludePatterns
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsWithPreset('/test/file.json', 'all');
      expect(patterns).toHaveLength(2);
    });
  });

  describe('File Discovery Coverage', () => {
    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const files = await PatternLoader.findAvailablePatternFiles('/invalid/path');
      expect(files).toHaveLength(0);
    });

    it('should filter non-JSON files', async () => {
      mockFs.readdir.mockResolvedValue([
        'valid.json',
        'invalid.txt',
        'another.json',
        'readme.md'
      ]);

      // Mock file reading for validation
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            name: 'Valid',
            categories: {}
          }));
        }
        return Promise.reject(new Error('Not JSON'));
      });

      const files = await PatternLoader.findAvailablePatternFiles('/test/path');
      expect(files).toHaveLength(2); // Only JSON files
    });

    it('should validate pattern file structure', async () => {
      mockFs.readdir.mockResolvedValue([
        'valid.json',
        'missing-version.json',
        'missing-name.json',
        'missing-categories.json'
      ]);

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('valid.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            name: 'Valid File',
            categories: {}
          }));
        } else if (filePath.includes('missing-version.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'Missing Version',
            categories: {}
          }));
        } else if (filePath.includes('missing-name.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            categories: {}
          }));
        } else if (filePath.includes('missing-categories.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            name: 'Missing Categories'
          }));
        }
        return Promise.reject(new Error('Unknown file'));
      });

      const files = await PatternLoader.findAvailablePatternFiles('/test/path');
      expect(files).toHaveLength(1); // Only valid file
      expect(files[0]).toContain('valid.json');
    });

    it('should handle file validation errors gracefully', async () => {
      mockFs.readdir.mockResolvedValue(['error.json', 'valid.json']);

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('error.json')) {
          return Promise.reject(new Error('File read error'));
        } else if (filePath.includes('valid.json')) {
          return Promise.resolve(JSON.stringify({
            version: '1.0.0',
            name: 'Valid File',
            categories: {}
          }));
        }
        return Promise.reject(new Error('Unknown file'));
      });

      const files = await PatternLoader.findAvailablePatternFiles('/test/path');
      expect(files).toHaveLength(1); // Should skip error file
      expect(files[0]).toContain('valid.json');
    });
  });

  describe('Information Retrieval Coverage', () => {
    it('should return null when no pattern file is loaded', () => {
      const info = patternLoader.getPatternFileInfo();
      expect(info).toBeNull();
    });

    it('should return undefined when no presets are available', () => {
      const presets = patternLoader.getAvailablePresets();
      expect(presets).toBeUndefined();
    });

    it('should return copy of loaded patterns', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Test File',
        description: 'Test description',
        categories: {
          test: {
            severity: 'warning' as const,
            description: 'Test category',
            patterns: [
              {
                name: 'Test Pattern',
                description: 'Test pattern',
                regex: 'test',
                flags: 'gi'
              }
            ]
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      await patternLoader.loadPatternsFromFile('/test/file.json');

      const patterns1 = patternLoader.getLoadedPatterns();
      const patterns2 = patternLoader.getLoadedPatterns();

      // Should return different array instances
      expect(patterns1).not.toBe(patterns2);
      
      // But with same content
      expect(patterns1).toEqual(patterns2);
    });
  });

  describe('Complex Scenario Coverage', () => {
    it('should handle file extension patterns (legacy DLL support)', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Extension Test',
        description: 'Test file extension patterns',
        categories: {
          dll: {
            severity: 'warning' as const,
            description: 'DLL file detection',
            fileExtension: '.dll'
          },
          exe: {
            severity: 'critical' as const,
            description: 'EXE file detection',
            fileExtension: '.exe'
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(2);
      
      // Should create patterns for file extensions
      expect(patterns.some(p => p.name === 'DLL File')).toBe(true);
      expect(patterns.some(p => p.name === 'EXE File')).toBe(true);
    });

    it('should handle mixed categories with patterns and extensions', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'Mixed Test',
        description: 'Test mixed patterns and extensions',
        categories: {
          regex_category: {
            severity: 'warning' as const,
            description: 'Regex patterns',
            patterns: [
              {
                name: 'Regex Pattern',
                description: 'Regular regex pattern',
                regex: 'test',
                flags: 'gi'
              }
            ]
          },
          extension_category: {
            severity: 'critical' as const,
            description: 'File extensions',
            fileExtension: '.exe'
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      const patterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(patterns).toHaveLength(2);
      
      expect(patterns.some(p => p.name === 'Regex Pattern')).toBe(true);
      expect(patterns.some(p => p.name === 'EXTENSION_CATEGORY File')).toBe(true);
    });

    it('should handle pattern loading after preset application', async () => {
      const patternFile = {
        version: '1.0.0',
        name: 'State Test',
        description: 'Test pattern loader state',
        categories: {
          category1: {
            severity: 'warning' as const,
            description: 'First category',
            patterns: [
              {
                name: 'Pattern 1',
                description: 'First pattern',
                regex: 'pattern1',
                flags: 'gi'
              }
            ]
          },
          category2: {
            severity: 'critical' as const,
            description: 'Second category',
            patterns: [
              {
                name: 'Pattern 2',
                description: 'Second pattern',
                regex: 'pattern2',
                flags: 'gi'
              }
            ]
          }
        },
        presets: {
          first_only: {
            name: 'First Only',
            description: 'Only first category',
            enabledCategories: ['category1']
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(patternFile));

      // Load with preset
      const presettedPatterns = await patternLoader.loadPatternsWithPreset('/test/file.json', 'first_only');
      expect(presettedPatterns).toHaveLength(1);

      // Load all patterns
      const allPatterns = await patternLoader.loadPatternsFromFile('/test/file.json');
      expect(allPatterns).toHaveLength(2);

      // State should be updated
      const loadedPatterns = patternLoader.getLoadedPatterns();
      expect(loadedPatterns).toHaveLength(2);
    });
  });
});