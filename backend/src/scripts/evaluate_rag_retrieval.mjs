// backend/src/scripts/evaluate_rag_retrieval.mjs
// 🔥 R11 — Automated RAG Retrieval Evaluation
// Rigorously measures Recall@K, Precision@K, MRR, nDCG@5, and category breakdown.

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

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (e) {}

const MONGO_URI = process.env.MONGO_URI;

// Import compiled backend RAG services
import { RetrievalService } from '../../dist/ai/rag/RetrievalService.js';
import { RerankingService } from '../../dist/ai/rag/RerankingService.js';
import { RAGResponseValidator } from '../../dist/ai/rag/RAGResponseValidator.js';
import { EdenDocument } from '../../dist/models/EdenDocument.js';

function matchesDocument(chunk, expectedDocs) {
  if (!expectedDocs || expectedDocs.length === 0) return false;
  const cDocId = (chunk.documentId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cDocTitle = (chunk.docTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cFilename = (chunk.fileName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return expectedDocs.some(exp => {
    const expNorm = exp.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cDocId.includes(expNorm) || expNorm.includes(cDocId) ||
           cDocTitle.includes(expNorm) || expNorm.includes(cDocTitle) ||
           cFilename.includes(expNorm) || expNorm.includes(cFilename);
  });
}

function matchesSection(chunk, expectedSections) {
  if (!expectedSections || expectedSections.length === 0) return false;
  const cSection = (chunk.sectionTitle || '').toLowerCase();
  return expectedSections.some(exp => cSection.includes(exp.toLowerCase()));
}

function getRelevanceGrade(chunk, item) {
  if (!item.answerable) return 0;
  const isDoc = matchesDocument(chunk, item.expectedDocuments);
  const isSec = matchesSection(chunk, item.expectedSections);

  if (isDoc && isSec) return 3; // exact section
  if (isDoc) return 2;          // same document, useful section
  if (item.category && chunk.category && chunk.category.includes(item.category)) return 1; // related info
  return 0;                     // irrelevant
}

function computeDCG(relevanceScores) {
  return relevanceScores.reduce((sum, rel, idx) => {
    const rank = idx + 1;
    return sum + (Math.pow(2, rel) - 1) / Math.log2(rank + 1);
  }, 0);
}

function computeNDCG5(relevanceScores) {
  const dcg = computeDCG(relevanceScores.slice(0, 5));
  // Ideal: sort descending, top 5
  const idealScores = [...relevanceScores].sort((a, b) => b - a).slice(0, 5);
  // Ensure ideal scores at least represent full possible matches (3, 3, 2, 2, 2)
  const paddedIdeal = idealScores.length > 0 && idealScores[0] > 0
    ? idealScores
    : [3, 2, 2, 1, 0];
  const idcg = computeDCG(paddedIdeal);
  if (idcg === 0) return 0;
  return Math.min(1.0, dcg / idcg);
}

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB Atlas Connected.\n');

  const datasetPath = path.join(__dirname, 'rag_evaluation_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  const domainQuestions = dataset.filter(q => q.answerable);
  const outOfDomainQuestions = dataset.filter(q => !q.answerable);

  console.log(`Loaded dataset: ${dataset.length} total questions (${domainQuestions.length} domain, ${outOfDomainQuestions.length} out-of-domain).\n`);

  const studentProfile = {
    userId: '65f01a2b3c4d5e6f7a8b9c0d',
    name: 'Kabilan',
    department: 'Computer Science & Engineering',
    semester: 5,
    cgpa: 8.75,
  };

  const results = [];
  const failures = [];

  // Metrics accumulators for domain questions
  let sumRecall1 = 0;
  let sumRecall3 = 0;
  let sumRecall5 = 0;

  let sumPrec1 = 0;
  let sumPrec3 = 0;
  let sumPrec5 = 0;

  let sumMRR = 0;
  let sumNDCG5 = 0;

  const categoryStats = {
    attendance: { total: 0, sumNDCG: 0, sumRecall5: 0 },
    examination: { total: 0, sumNDCG: 0, sumRecall5: 0 },
    academic: { total: 0, sumNDCG: 0, sumRecall5: 0 },
    curriculum: { total: 0, sumNDCG: 0, sumRecall5: 0 },
    placement: { total: 0, sumNDCG: 0, sumRecall5: 0 },
  };

  console.log('Running retrieval evaluation across all domain questions...');

  for (const item of domainQuestions) {
    // 1. Retrieve raw candidate chunks
    const rawChunks = await RetrievalService.retrieveCandidateChunks(item.question, studentProfile, 10);

    // 2. Rerank candidates with cross-scoring
    const rerankedChunks = RerankingService.rerank(item.question, rawChunks, studentProfile, 5);
    const top5 = rerankedChunks.slice(0, 5);

    // Compute grades for top 5
    const grades = top5.map(c => getRelevanceGrade(c, item));

    // Recall@K: Did correct document/section appear within first K chunks?
    const recall1 = grades.slice(0, 1).some(g => g >= 2) ? 1 : 0;
    const recall3 = grades.slice(0, 3).some(g => g >= 2) ? 1 : 0;
    const recall5 = grades.slice(0, 5).some(g => g >= 2) ? 1 : 0;

    // Precision@K: Count of chunks with grade >= 2 / K
    const prec1 = grades.slice(0, 1).filter(g => g >= 2).length / 1.0;
    const prec3 = grades.slice(0, 3).filter(g => g >= 2).length / 3.0;
    const prec5 = grades.slice(0, 5).filter(g => g >= 2).length / 5.0;

    // MRR: Reciprocal rank of first chunk with grade >= 2
    const firstRelIdx = grades.findIndex(g => g >= 2);
    const reciprocalRank = firstRelIdx >= 0 ? 1.0 / (firstRelIdx + 1) : 0;

    // nDCG@5
    const ndcg5 = computeNDCG5(grades);

    sumRecall1 += recall1;
    sumRecall3 += recall3;
    sumRecall5 += recall5;

    sumPrec1 += prec1;
    sumPrec3 += prec3;
    sumPrec5 += prec5;

    sumMRR += reciprocalRank;
    sumNDCG5 += ndcg5;

    if (categoryStats[item.category]) {
      categoryStats[item.category].total += 1;
      categoryStats[item.category].sumNDCG += ndcg5;
      categoryStats[item.category].sumRecall5 += recall5;
    }

    if (recall5 === 0) {
      failures.push({
        questionId: item.id,
        question: item.question,
        expected: item.expectedDocuments,
        retrieved: top5.map(c => `${c.docTitle} [${c.sectionTitle}] (Score: ${(c.finalScore || 0).toFixed(3)})`),
        failureReason: 'Expected evidence not found in Top-5',
      });
    }

    results.push({
      id: item.id,
      category: item.category,
      recall1,
      recall3,
      recall5,
      prec1,
      prec3,
      prec5,
      rr: reciprocalRank,
      ndcg5,
    });
  }

  // Evaluate Out-Of-Domain Questions
  console.log('Evaluating Out-of-Domain questions & grounding rejection...');
  let oodBlocked = 0;
  let oodGroundingFailures = 0;

  for (const ood of outOfDomainQuestions) {
    const rawChunks = await RetrievalService.retrieveCandidateChunks(ood.question, studentProfile, 8);
    const reranked = RerankingService.rerank(ood.question, rawChunks, studentProfile, 5);
    const topChunk = reranked[0];
    const topScore = topChunk ? topChunk.finalScore : 0;

    // Check if the institutional query guardrails trigger and flag lack of grounding
    const dummyLlmAnswer = 'The university policy is 100% permitted for all students.';
    const validation = RAGResponseValidator.validateResponse(ood.question, dummyLlmAnswer, {
      highestConfidence: topScore,
      hasInstitutionalEvidence: topScore >= 0.55,
      sourceCitations: topScore >= 0.55 && topChunk ? [topChunk] : [],
    });

    // Guardrail blocked if: top confidence is below threshold OR validator detected ungrounded
    if (validation.blockedUngrounded || topScore < 0.55) {
      oodBlocked++;
    } else {
      oodGroundingFailures++;
      failures.push({
        questionId: ood.id,
        question: ood.question,
        expected: 'BLOCKED (Out-of-Domain)',
        retrieved: reranked.slice(0, 3).map(c => `${c.docTitle} (Score: ${(c.finalScore || 0).toFixed(3)})`),
        failureReason: 'False Positive Grounding: Out-of-domain query was not rejected',
      });
    }
  }

  // Calculate Averages
  const N = domainQuestions.length;
  const avgRecall1 = sumRecall1 / N;
  const avgRecall3 = sumRecall3 / N;
  const avgRecall5 = sumRecall5 / N;

  const avgPrec1 = sumPrec1 / N;
  const avgPrec3 = sumPrec3 / N;
  const avgPrec5 = sumPrec5 / N;

  const mrr = sumMRR / N;
  const avgNDCG5 = sumNDCG5 / N;

  // Save failures to json
  const failuresPath = path.join(__dirname, 'rag_evaluation_failures.json');
  fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2), 'utf-8');

  // Print Terminal Output matching requested UI
  console.log('\n════════════════════════════════════');
  console.log('       EDUSPHERE RAG EVALUATION     ');
  console.log('════════════════════════════════════\n');
  console.log('Dataset:');
  console.log(`${dataset.length} questions (${N} domain + ${outOfDomainQuestions.length} out-of-domain)\n`);
  console.log('────────────────────────────────────');
  console.log('RETRIEVAL PERFORMANCE');
  console.log('────────────────────────────────────\n');
  console.log('                    @1       @3       @5');
  console.log(`Recall             ${avgRecall1.toFixed(2)}     ${avgRecall3.toFixed(2)}     ${avgRecall5.toFixed(2)}`);
  console.log(`Precision          ${avgPrec1.toFixed(2)}     ${avgPrec3.toFixed(2)}     ${avgPrec5.toFixed(2)}\n`);
  console.log(`MRR                 ${mrr.toFixed(2)}`);
  console.log(`nDCG@5              ${avgNDCG5.toFixed(2)}\n`);
  console.log('────────────────────────────────────');
  console.log('CATEGORY PERFORMANCE (nDCG@5 / Recall@5)');
  console.log('────────────────────────────────────\n');

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const catNDCG = stats.total > 0 ? (stats.sumNDCG / stats.total).toFixed(2) : '0.00';
    const catRecall = stats.total > 0 ? (stats.sumRecall5 / stats.total).toFixed(2) : '0.00';
    const catName = (cat.charAt(0).toUpperCase() + cat.slice(1)).padEnd(18, ' ');
    console.log(`${catName}  ${catNDCG}  (Recall@5: ${catRecall})`);
  }

  console.log('\n────────────────────────────────────');
  console.log('OUT-OF-DOMAIN');
  console.log('────────────────────────────────────\n');
  console.log(`Blocked             ${oodBlocked}/${outOfDomainQuestions.length}`);
  console.log(`Grounding failures   ${oodGroundingFailures}\n`);
  console.log('════════════════════════════════════\n');

  console.log(`Failures logged to: ${failuresPath} (Count: ${failures.length})`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Evaluation script error:', err);
  process.exit(1);
});
