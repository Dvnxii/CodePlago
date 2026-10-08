const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { compareAll, detectLanguage, getRiskLevel } = require('../services/plagiarismEngine');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = function(db) {
  const router = express.Router();

  // POST /api/checks
  router.post('/', upload.array('files', 30), (req, res) => {
    try {
      const { checkName } = req.body;
      const files = req.files;

      if (!files || files.length < 2)
        return res.status(400).json({ error: 'Please upload at least 2 files to compare.' });

      const checkId = uuidv4();
      const name = checkName || `Check ${new Date().toLocaleString()}`;

      db.prepare('INSERT INTO checks (id, name, status) VALUES (?, ?, ?)').run(checkId, name, 'processing');

      const submissions = [];
      for (const file of files) {
        const code = fs.readFileSync(file.path, 'utf-8');
        const subId = uuidv4();
        const language = detectLanguage(file.originalname, code);
        const lines = code.split('\n').length;
        db.prepare('INSERT INTO submissions (id, name, language, code, lines) VALUES (?, ?, ?, ?, ?)').run(subId, file.originalname, language, code, lines);
        db.prepare('INSERT INTO check_files (id, check_id, submission_id) VALUES (?, ?, ?)').run(uuidv4(), checkId, subId);
        submissions.push({ id: subId, name: file.originalname, code, language, lines });
      }

      const comparisons = compareAll(submissions);
      const resultRows = [];

      for (const comp of comparisons) {
        const resultId = uuidv4();
        const risk = getRiskLevel(comp.similarity);
        const details = JSON.stringify({ matchedLineNumbers: comp.matchedLineNumbers, fingerprints: comp.fingerprints, risk });
        db.prepare('INSERT INTO results (id, check_id, file_a_id, file_b_id, similarity, matched_lines, details) VALUES (?, ?, ?, ?, ?, ?, ?)').run(resultId, checkId, comp.fileA.id, comp.fileB.id, comp.similarity, comp.matchedLines, details);
        resultRows.push({
          id: resultId,
          fileA: { id: comp.fileA.id, name: comp.fileA.name },
          fileB: { id: comp.fileB.id, name: comp.fileB.name },
          similarity: comp.similarity,
          matchedLines: comp.matchedLines,
          risk,
          details: { matchedLineNumbers: comp.matchedLineNumbers, fingerprints: comp.fingerprints }
        });
      }

      db.prepare('UPDATE checks SET status = ? WHERE id = ?').run('complete', checkId);
      files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });

      res.json({
        checkId, name, status: 'complete',
        files: submissions.map(s => ({ id: s.id, name: s.name, language: s.language, lines: s.lines })),
        results: resultRows,
        summary: {
          totalFiles: submissions.length,
          totalComparisons: comparisons.length,
          highRisk: resultRows.filter(r => r.risk.color === 'red').length,
          mediumRisk: resultRows.filter(r => r.risk.color === 'yellow').length,
          lowRisk: resultRows.filter(r => r.risk.color === 'green').length,
          maxSimilarity: Math.max(...resultRows.map(r => r.similarity), 0)
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  });

  // GET /api/checks
  router.get('/', (req, res) => {
    try {
      // Get all checks with file counts
      const checks = db.prepare('SELECT * FROM checks ORDER BY created_at DESC').all();
      const enriched = checks.map(c => {
        const cf = db.prepare('SELECT COUNT(*) as cnt FROM check_files WHERE check_id = ?').get(c.id);
        return { ...c, file_count: cf ? cf.cnt : 0 };
      });
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/checks/:id
  router.get('/:id', (req, res) => {
    try {
      const check = db.prepare('SELECT * FROM checks WHERE id = ?').get(req.params.id);
      if (!check) return res.status(404).json({ error: 'Check not found' });

      const files = db.prepare(`
        SELECT s.* FROM submissions s
        JOIN check_files cf ON s.id = cf.submission_id
        WHERE cf.check_id = ?
      `).all(req.params.id);

      const results = db.prepare('SELECT * FROM results WHERE check_id = ?').all(req.params.id);
      const fileMap = Object.fromEntries(files.map(f => [f.id, f]));

      const enrichedResults = results.map(r => {
        const details = JSON.parse(r.details || '{}');
        return {
          ...r,
          fileA: fileMap[r.file_a_id] ? { id: r.file_a_id, name: fileMap[r.file_a_id].name } : { id: r.file_a_id, name: 'Unknown' },
          fileB: fileMap[r.file_b_id] ? { id: r.file_b_id, name: fileMap[r.file_b_id].name } : { id: r.file_b_id, name: 'Unknown' },
          risk: getRiskLevel(r.similarity),
          details
        };
      });

      const maxSim = enrichedResults.length ? Math.max(...enrichedResults.map(r => r.similarity)) : 0;
      res.json({
        ...check, files, results: enrichedResults,
        summary: {
          totalFiles: files.length,
          totalComparisons: results.length,
          highRisk: enrichedResults.filter(r => r.risk.color === 'red').length,
          mediumRisk: enrichedResults.filter(r => r.risk.color === 'yellow').length,
          lowRisk: enrichedResults.filter(r => r.risk.color === 'green').length,
          maxSimilarity: maxSim
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/checks/:checkId/compare/:fileAId/:fileBId
  router.get('/:checkId/compare/:fileAId/:fileBId', (req, res) => {
    try {
      const { fileAId, fileBId } = req.params;
      const fileA = db.prepare('SELECT * FROM submissions WHERE id = ?').get(fileAId);
      const fileB = db.prepare('SELECT * FROM submissions WHERE id = ?').get(fileBId);
      if (!fileA || !fileB) return res.status(404).json({ error: 'Files not found' });

      const result = db.prepare(
        'SELECT * FROM results WHERE check_id = ? AND ((file_a_id = ? AND file_b_id = ?) OR (file_a_id = ? AND file_b_id = ?))'
      ).get(req.params.checkId, fileAId, fileBId, fileBId, fileAId);

      res.json({
        fileA: { id: fileA.id, name: fileA.name, code: fileA.code, language: fileA.language, lines: fileA.lines },
        fileB: { id: fileB.id, name: fileB.name, code: fileB.code, language: fileB.language, lines: fileB.lines },
        similarity: result?.similarity || 0,
        matchedLines: result?.matched_lines || 0,
        details: result ? JSON.parse(result.details || '{}') : {}
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/checks/:id
  router.delete('/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM results WHERE check_id = ?').run(req.params.id);
      db.prepare('DELETE FROM check_files WHERE check_id = ?').run(req.params.id);
      db.prepare('DELETE FROM checks WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
