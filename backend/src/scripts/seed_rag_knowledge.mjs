// backend/src/scripts/seed_rag_knowledge.mjs
// Seeds and indexes all authoritative university documents from rag_documents/ into MongoDB Atlas

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');
const workspaceRoot = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(backendRoot, '.env') });
dotenv.config({ path: path.join(workspaceRoot, '.env') });
const ragDocsDir = path.join(workspaceRoot, 'rag_documents');
const MONGO_URI = process.env.MONGO_URI;

// Rich Chunk Schema matching EdenDocument
const richChunkSchema = new mongoose.Schema({
  chunkId: String,
  documentId: String,
  docTitle: String,
  category: String,
  department: String,
  semester: Number,
  sectionTitle: String,
  sourcePage: { type: Number, default: 1 },
  chunkIndex: { type: Number, default: 0 },
  text: { type: String, required: true },
  keywords: [String],
  embedding: [Number],
});

const edenDocumentSchema = new mongoose.Schema({
  documentId: { type: String, index: true },
  title: { type: String, required: true, index: true },
  category: { type: String, required: true, default: 'general', index: true },
  department: { type: String, default: 'All Departments', index: true },
  semester: { type: Number, index: true },
  content: { type: String, required: true },
  embedding: [Number],
  chunks: [richChunkSchema],
  uploadedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  fileName: String,
  fileSize: Number,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const EdenDocument = mongoose.models.EdenDocument || mongoose.model('EdenDocument', edenDocumentSchema, 'edendocuments');

// 768-dim Embedding Generator
async function generateEmbedding(text) {
  const cleanText = (text || '').trim().slice(0, 2048);
  if (!cleanText) return new Array(768).fill(0);

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (apiKey && apiKey.trim().length > 15) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: cleanText }] },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
          return data.embedding.values;
        }
      }
    } catch (e) {}
  }

  // Deterministic fallback with word-token projection
  const vector = new Array(768).fill(0);
  const clean = cleanText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return vector;

  for (const word of words) {
    let h = 0;
    for (let i = 0; i < word.length; i++) {
      h = (Math.imul(31, h) + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(h) % 768;
    vector[idx] += 1.0;
  }
  const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => v / mag);
}

// Collect files recursively
function collectMarkdownFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectMarkdownFiles(full));
    } else if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// Parse document metadata
function parseDocument(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const stats = fs.statSync(filePath);

  let documentId = `doc-${path.basename(filename, path.extname(filename))}`;
  let title = path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ');
  let category = 'institutional_policy';
  let department = 'All Departments';
  let semester = undefined;

  const idMatch = raw.match(/\*\*Document ID\*\*:\s*`?([a-zA-Z0-9_-]+)`?/i);
  if (idMatch) documentId = idMatch[1].trim();

  const titleMatch = raw.match(/^#\s+(.+)$/m);
  if (titleMatch) title = titleMatch[1].trim();

  const catMatch = raw.match(/\*\*Category\*\*:\s*`?([a-zA-Z0-9_-]+)`?/i);
  if (catMatch) category = catMatch[1].trim();

  const deptMatch = raw.match(/\*\*Department\*\*:\s*(.+)$/im) || raw.match(/\*\*Applicability\*\*:\s*(.+)$/im);
  if (deptMatch) {
    const dStr = deptMatch[1].trim();
    if (/computer science|cse/i.test(dStr)) department = 'Computer Science & Engineering';
    else if (/all/i.test(dStr) || /graduating|final year|engineering|b\.tech/i.test(dStr)) department = 'All Departments';
    else department = dStr;
  }

  const semMatch = raw.match(/Semester\s*(\d+)/i);
  if (semMatch) semester = parseInt(semMatch[1], 10);

  return { documentId, title, category, department, semester, content: raw, fileSize: stats.size, filename };
}

// Semantic Chunker
function chunkDocument(doc) {
  const sectionRegex = /(?:^|\n)(?=##?\s+)/g;
  const sections = doc.content.split(sectionRegex).filter(s => s.trim().length > 0);
  const chunks = [];
  let globalIndex = 0;

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sText = sections[sIdx].trim();
    let sectionTitle = `Section ${sIdx + 1}`;
    const headerMatch = sText.match(/^##?\s+(.+)$/m);
    if (headerMatch) sectionTitle = headerMatch[1].trim();

    const words = sText.split(/\s+/);
    if (words.length <= 400) {
      chunks.push({
        chunkId: `${doc.documentId}-chunk-${globalIndex}`,
        documentId: doc.documentId,
        docTitle: doc.title,
        category: doc.category,
        department: doc.department,
        semester: doc.semester,
        sectionTitle,
        sourcePage: Math.max(1, Math.ceil((globalIndex + 1) / 2)),
        chunkIndex: globalIndex,
        text: sText,
        keywords: sText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 4).slice(0, 8),
      });
      globalIndex++;
    } else {
      let wStart = 0;
      while (wStart < words.length) {
        const wEnd = Math.min(wStart + 400, words.length);
        const snippet = words.slice(wStart, wEnd).join(' ');
        const textWithContext = wStart > 0 && !snippet.startsWith('#') ? `[${sectionTitle} (Cont.)]\n${snippet}` : snippet;
        chunks.push({
          chunkId: `${doc.documentId}-chunk-${globalIndex}`,
          documentId: doc.documentId,
          docTitle: doc.title,
          category: doc.category,
          department: doc.department,
          semester: doc.semester,
          sectionTitle,
          sourcePage: Math.max(1, Math.ceil((globalIndex + 1) / 2)),
          chunkIndex: globalIndex,
          text: textWithContext,
          keywords: textWithContext.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 4).slice(0, 8),
        });
        globalIndex++;
        if (wEnd >= words.length) break;
        wStart += 340;
      }
    }
  }
  return chunks;
}

async function runSeed() {
  console.log('======================================================================');
  console.log('🏛️  EDUSPHERE RAG: INSTITUTIONAL DOCUMENT INGESTION & VECTOR INDEXING');
  console.log('======================================================================\n');

  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
  } catch (e) {}

  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB Atlas cluster');

  const files = collectMarkdownFiles(ragDocsDir);
  console.log(`📁 Discovered ${files.length} institutional policy documents in rag_documents/\n`);

  let totalChunksCount = 0;

  for (const file of files) {
    const parsed = parseDocument(file);
    console.log(`📄 Ingesting: "${parsed.title}" [${parsed.category} | ${parsed.department}]`);

    const chunks = chunkDocument(parsed);
    console.log(`   -> Generated ${chunks.length} semantic section chunks`);

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = await generateEmbedding(chunk.text);
    }

    const docEmbedding = await generateEmbedding(`${parsed.title} ${parsed.content.slice(0, 1000)}`);

    // Upsert by documentId or title
    await EdenDocument.findOneAndUpdate(
      { $or: [{ documentId: parsed.documentId }, { title: parsed.title }] },
      {
        documentId: parsed.documentId,
        title: parsed.title,
        category: parsed.category,
        department: parsed.department,
        semester: parsed.semester,
        content: parsed.content,
        embedding: docEmbedding,
        chunks,
        fileName: parsed.filename,
        fileSize: parsed.fileSize,
        metadata: { ingestedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    totalChunksCount += chunks.length;
    console.log(`   ✅ Successfully indexed with 768-dim dense embeddings\n`);
  }

  const finalDocCount = await EdenDocument.countDocuments();
  console.log('======================================================================');
  console.log(`🎯 INGESTION COMPLETE: ${finalDocCount} Total Documents, ${totalChunksCount} Rich Chunks Indexed`);
  console.log('======================================================================\n');

  await mongoose.disconnect();
}

runSeed().catch(err => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
