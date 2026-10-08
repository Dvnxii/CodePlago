/**
 * Plagiarism Detection Engine
 * Uses a combination of:
 * 1. Token normalization (strips identifiers, whitespace)
 * 2. K-gram fingerprinting (Winnowing algorithm)
 * 3. Jaccard similarity on fingerprint sets
 * 4. Line-level diff matching for visual highlighting
 */

const KGRAM_SIZE = 5;
const WINDOW_SIZE = 4;

// ─── Tokenizer ──────────────────────────────────────────────────────────────

function detectLanguage(filename, code) {
  if (!filename) {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function') || code.includes('=>')) return 'javascript';
    if (code.includes('public class') || code.includes('System.out')) return 'java';
    if (code.includes('#include')) return 'c/c++';
    return 'unknown';
  }
  const ext = filename.split('.').pop().toLowerCase();
  const langMap = { js: 'javascript', ts: 'typescript', py: 'python', java: 'java', c: 'c', cpp: 'c++', cs: 'c#', go: 'go', rb: 'ruby', php: 'php', rs: 'rust', swift: 'swift', kt: 'kotlin' };
  return langMap[ext] || 'unknown';
}

function normalizeCode(code) {
  return code
    .replace(/\/\/[^\n]*/g, '')       // remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
    .replace(/#[^\n]*/g, '')           // remove hash comments
    .replace(/"""[\s\S]*?"""/g, 'STR') // python docstrings
    .replace(/"(?:[^"\\]|\\.)*"/g, 'STR')  // strings
    .replace(/'(?:[^'\\]|\\.)*'/g, 'STR')  // single-quoted strings
    .replace(/\b\d+(\.\d+)?\b/g, 'NUM')    // numbers
    .replace(/\b[a-zA-Z_]\w*\b/g, t => KEYWORDS.has(t) ? t : 'ID') // normalize identifiers
    .replace(/\s+/g, ' ')
    .trim();
}

const KEYWORDS = new Set([
  'if','else','for','while','do','switch','case','break','continue','return',
  'function','def','class','import','from','export','const','let','var',
  'public','private','protected','static','void','int','float','double',
  'string','bool','boolean','true','false','null','undefined','new','this',
  'try','catch','finally','throw','throws','extends','implements','interface',
  'package','namespace','using','include','print','println','printf',
  'async','await','yield','lambda','in','of','typeof','instanceof','and','or','not'
]);

// ─── Fingerprinting (Winnowing) ──────────────────────────────────────────────

function getKgrams(tokens, k) {
  const grams = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    grams.push(tokens.slice(i, i + k).join(''));
  }
  return grams;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function winnow(kgrams, w) {
  const hashes = kgrams.map(hashString);
  const fingerprints = new Set();
  for (let i = 0; i <= hashes.length - w; i++) {
    const window = hashes.slice(i, i + w);
    fingerprints.add(Math.min(...window));
  }
  return fingerprints;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ─── Line-level matching ─────────────────────────────────────────────────────

function getMatchedLines(codeA, codeB) {
  const linesA = codeA.split('\n').map(l => l.trim()).filter(Boolean);
  const linesB = codeB.split('\n').map(l => l.trim()).filter(Boolean);
  const setB = new Set(linesB.map(normalizeCode));
  const matched = [];
  linesA.forEach((line, i) => {
    if (setB.has(normalizeCode(line)) && line.length > 5) {
      matched.push(i + 1);
    }
  });
  return matched;
}

// ─── Main compare function ───────────────────────────────────────────────────

function compareCode(codeA, codeB) {
  const normA = normalizeCode(codeA);
  const normB = normalizeCode(codeB);

  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);

  if (tokensA.length < KGRAM_SIZE || tokensB.length < KGRAM_SIZE) {
    // Fallback to simple normalized comparison for very short files
    const simple = normA === normB ? 1.0 : 0.0;
    return { similarity: simple, matchedLines: [], fingerprints: { a: 0, b: 0, common: 0 } };
  }

  const kgramsA = getKgrams(tokensA, KGRAM_SIZE);
  const kgramsB = getKgrams(tokensB, KGRAM_SIZE);

  const fpA = winnow(kgramsA, WINDOW_SIZE);
  const fpB = winnow(kgramsB, WINDOW_SIZE);

  const similarity = jaccardSimilarity(fpA, fpB);
  const matchedLines = getMatchedLines(codeA, codeB);

  const commonFP = new Set([...fpA].filter(x => fpB.has(x)));

  return {
    similarity: Math.round(similarity * 100) / 100,
    matchedLines,
    fingerprints: {
      a: fpA.size,
      b: fpB.size,
      common: commonFP.size
    }
  };
}

// ─── Batch compare all pairs ─────────────────────────────────────────────────

function compareAll(submissions) {
  const results = [];
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const { similarity, matchedLines, fingerprints } = compareCode(
        submissions[i].code,
        submissions[j].code
      );
      results.push({
        fileA: submissions[i],
        fileB: submissions[j],
        similarity,
        matchedLines: matchedLines.length,
        matchedLineNumbers: matchedLines,
        fingerprints
      });
    }
  }
  return results;
}

function getRiskLevel(similarity) {
  if (similarity >= 0.7) return { label: 'High Risk', color: 'red' };
  if (similarity >= 0.4) return { label: 'Medium Risk', color: 'yellow' };
  return { label: 'Low Risk', color: 'green' };
}

module.exports = { compareCode, compareAll, detectLanguage, getRiskLevel };
