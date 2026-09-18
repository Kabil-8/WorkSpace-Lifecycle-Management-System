# EduSphere RAG Evaluation

## 1. Objective

The objective of this evaluation is to quantitatively and scientifically benchmark the retrieval performance of the EduSphere Grounded Retrieval-Augmented Generation (RAG) architecture. Rather than relying on qualitative assertions that an expected document was retrieved, this evaluation establishes rigorous information retrieval metrics across a representative 60-question institutional dataset. We evaluate the system's ability to rank relevant evidence in top positions, filter out extraneous noise, reject out-of-domain ungrounded queries, and deliver verifiable knowledge citations to the EDEN conversational agent.

---

## 2. Evaluation Dataset

The evaluation dataset is located at `backend/src/scripts/rag_evaluation_dataset.json`. It comprises **60 curated questions** spanning five primary university policy categories (10 questions each) plus an adversarial out-of-domain test suite (10 questions):

* **Attendance Regulations (10)**: Covers mandatory 75% thresholds, safe zone criteria, medical condonation boundaries (65.0%–74.9%), 3-day HoD submission deadlines, ₹1,500 condonation fees, Detention due to Attendance Shortage (DAS), remediation via summer semesters, and On-Duty (OD) caps (10 days).
* **Examination Conduct & Assessment (10)**: Evaluates 40% Continuous Internal Assessment (CIA) vs. 60% End-Semester Examination (ESE) weightages, 45% ESE passing floors, 50% aggregate passing rules, 5-day advance hall ticket releases, Level 1–3 malpractice penalties, and revaluation fee refunds ($\ge 15\%$ score increases).
* **Academic Regulations & Grading (10)**: Examines the 10-point letter grading scale (O to C, RA, SA, W), SGPA and CGPA weighted formulas, First Class with Distinction criteria ($\text{CGPA} \ge 8.50$, 4-year completion, zero backlog history), maximum 6-year ($N+2$) duration caps, fast-track credit overload, and 24-credit backlog limits.
* **CSE Curriculum & Prerequisites (10)**: Tests Semester 5 course codes, credits, and prerequisite graphs (CS501 Algorithms requires CS301 Data Structures; CS502 DBMS requires MA301 Discrete Mathematics), mandatory Dynamic Programming prerequisites (Recursion and Divide & Conquer mastery), and Tracks A/B/C elective rules.
* **Placement & Career Policies (10)**: Assesses 6.50 CGPA eligibility, 0 active backlog restrictions, 75% training attendance, 75% ATS resume thresholds, Tier 1/2/3 CTC brackets, One-Student One-Offer rules, Tier 1 Dream Offer contestation, 48-hour acceptance windows, and 2-week interview absence suspensions.
* **Out-of-Domain / Adversarial (10)**: Tests ungrounded university queries (e.g., campus rooftop drone racing, Olympic swimming pool hours, private helicopter shuttles, dormitory hunting falcons, cryptocurrency mining in labs) designed to verify Zero-Hallucination guardrail triggering and refusal.

Each question entry adheres to the schema:
```json
{
  "id": "ATT-001",
  "category": "attendance",
  "question": "What is the minimum attendance required in each course to appear for end-semester exams?",
  "expectedDocuments": ["attendance_policy_2026", "univ-reg-att-2026"],
  "expectedSections": ["Mandatory Attendance Requirement", "Section 1"],
  "answerable": true
}
```

---

## 3. Document Corpus

The authoritative knowledge corpus is stored in Markdown within `rag_documents/` and indexed in MongoDB Atlas under the `edendocuments` collection:

| Document ID | Title | Category | Scope / Applicability | Chunks |
| :--- | :--- | :--- | :--- | :--- |
| `univ-reg-att-2026` | EduSphere University Attendance Regulations 2026 | `institutional_policy` | All Departments | 4 |
| `univ-reg-exam-2026` | EduSphere University Examination Conduct & Assessment Rules 2026 | `examination_rules` | All Departments | 4 |
| `univ-reg-acad-2026` | EduSphere Academic Regulations & Grading System 2026 | `academic_regulations` | B.Tech Programmes | 4 |
| `univ-curr-cse-2026` | Computer Science & Engineering Undergraduate Curriculum 2026 | `syllabus` | Computer Science & Engineering | 4 |
| `univ-pol-place-2026` | EduSphere Campus Placement & Career Internship Policy 2026 | `placement_policy` | All Graduating Batches | 4 |

---

## 4. Chunking Strategy

To maintain high contextual coherence without truncating critical policy clauses, `ChunkingService.ts` executes **semantic section-boundary chunking**:
- Documents are split along structural Markdown header boundaries (`## Section X`).
- Target chunk size: **400 words** with a sliding window of **60 words overlap** when section length exceeds 400 words.
- Each chunk preserves structural metadata:
  - `documentId`: Unique institutional policy identifier
  - `docTitle`: Formal human-readable document title
  - `sectionTitle`: Heading of the specific clause
  - `sourcePage`: Virtual page number for verifiable human citations
  - `chunkIndex`: Monotonically increasing sequential index
  - `keywords`: Salient domain terms extracted for BM25 lexical cross-scoring

---

## 5. Embedding Model

Vectors are generated via `EmbeddingService.ts` utilizing:
- **Primary Model**: Google Gemini `text-embedding-004` producing **768-dimensional dense vector representations**.
- **Embedding Cache**: In-memory LRU cache keyed by SHA-256 text hashes, eliminating redundant inference latency.
- **Deterministic Token-Projection Fallback**: When external LLM APIs are offline or rate-limited, an offline deterministic word-token projection engine hashes lexical tokens into a normalized unit-length 768-dimensional hypersphere (`Math.imul(31, h) + charCodeAt(i)`), ensuring consistent semantic dot products between queries and indexed passages.

---

## 6. Retrieval Architecture

The retrieval pipeline executes a two-stage hybrid search via `RetrievalService.ts`:
1. **Dense Vector Search**: Computes cosine similarity between the query embedding $\mathbf{q}$ and stored chunk embeddings $\mathbf{d}_i$:
   $$\text{Sim}(\mathbf{q}, \mathbf{d}_i) = \frac{\mathbf{q} \cdot \mathbf{d}_i}{\|\mathbf{q}\| \|\mathbf{d}_i\|}$$
2. **Context-Aware Metadata Filtering**:
   - Queries with student profiles (e.g., Department: *Computer Science & Engineering*, Semester: *5*) filter candidate chunks such that department-specific materials (syllabi, elective tracks) match the student's program while institutional policies designated as `All Departments` remain universally accessible.
   - Top 8–10 candidate chunks are retrieved for downstream reranking.

---

## 7. Reranking

Candidate chunks undergo cross-scoring in `RerankingService.ts` via a weighted scoring function:
$$\text{Score} = 0.45 \cdot \text{VectorSim} + 0.40 \cdot \text{LexicalMatch} + 0.15 \cdot \text{ProfileRelevance}$$

* **Dense Vector Similarity (45%)**: Measures semantic conceptual proximity.
* **Lexical Match (40%)**: Normalized keyword overlap matching exact institutional terms (e.g., "condonation", "DAS", "65%", "revaluation", "Tier 1").
* **Profile Relevance (15%)**: Department and semester alignment bonus, **gated** by topical relevance ($\text{Lexical} > 0.10$ or $\text{VectorSim} > 0.35$) to prevent curriculum chunks from incorrectly outranking attendance policies on general queries.

---

## 8. Evaluation Metrics

Evaluated on the 50 domain questions via `backend/src/scripts/evaluate_rag_retrieval.mjs`:

```text
════════════════════════════════════
       EDUSPHERE RAG EVALUATION     
════════════════════════════════════

Dataset:
60 questions (50 domain + 10 out-of-domain)

────────────────────────────────────
RETRIEVAL PERFORMANCE
────────────────────────────────────

                    @1       @3       @5
Recall             1.00     1.00     1.00
Precision          1.00     0.91     0.79

MRR                 1.00
nDCG@5              0.98
```

### Recall@1
$$\text{Recall}@1 = 1.00$$
The authoritative institutional document appeared at Rank 1 in **100%** of all 50 domain test queries.

### Recall@3
$$\text{Recall}@3 = 1.00$$
All correct evidence documents appeared within the top 3 retrieved chunks.

### Recall@5
$$\text{Recall}@5 = 1.00$$
100% evidence coverage achieved across the Top 5 retrieved chunk pool.

### Precision@1
$$\text{Precision}@1 = 1.00$$
At Rank 1, 100% of retrieved chunks were directly relevant to the target institutional question.

### Precision@3
$$\text{Precision}@3 = 0.91$$
Across the top 3 chunks, an average of 91% of returned chunks contained relevant sections from the target document.

### Precision@5
$$\text{Precision}@5 = 0.79$$
79% of chunks in the Top-5 window were relevant evidence, demonstrating minimal intrusion of extraneous or distracting passages.

### MRR (Mean Reciprocal Rank)
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i} = 1.00$$
Across all questions, the first relevant chunk was placed consistently at Rank 1 ($\text{RR} = 1.00$).

### nDCG@5 (Normalized Discounted Cumulative Gain)
$$\text{nDCG}@5 = 0.98$$
Calculated with graded relevance:
* **Grade 3**: Exact expected section
* **Grade 2**: Same document, useful section
* **Grade 1**: Related domain topic
* **Grade 0**: Irrelevant

The high nDCG@5 score (0.98 out of 1.00) confirms that exact sections are systematically positioned at the very top of the ranking list.

---

## 9. Category-wise Results

Breakdown across the 5 institutional categories:

| Category | Questions | nDCG@5 | Recall@5 | Precision@1 |
| :--- | :--- | :--- | :--- | :--- |
| **Attendance** | 10 | **0.96** | **1.00** | **1.00** |
| **Examination** | 10 | **1.00** | **1.00** | **1.00** |
| **Academic Regulations** | 10 | **1.00** | **1.00** | **1.00** |
| **CSE Curriculum** | 10 | **0.99** | **1.00** | **1.00** |
| **Placement** | 10 | **0.95** | **1.00** | **1.00** |

All categories achieved 100% Recall@5. Examination and Academic Regulations achieved perfect nDCG@5 (1.00), while Attendance (0.96) and Placement (0.95) exhibited slight grading variances when multi-section questions retrieved related adjacent policy sections.

---

## 10. Failure Analysis

* **Failure Log**: `backend/src/scripts/rag_evaluation_failures.json`
* **Total Failures**: **0** (Zero retrieval failures across 50 domain queries).
* Every domain question successfully retrieved its target document and relevant section within the Top-5 window.
* No hallucinations or wrong-department policy misattributions occurred.

---

## 11. Out-of-Domain Evaluation

Evaluated across 10 adversarial and ungrounded queries (drone racing, swimming pool hours, cryptocurrency mining in labs, dormitory hunting falcons, etc.):

```text
────────────────────────────────────
OUT-OF-DOMAIN
────────────────────────────────────

Blocked             10/10 (100%)
Grounding failures   0
```

* **Blocked**: 10 out of 10 queries were correctly identified as lacking authoritative institutional evidence.
* **Grounding Failures**: 0 false-positive citations.
* The system triggered the Feature #24 Zero-Hallucination guardrail and returned the verified fallback disclaimer:
  > *"EduSphere Verified Institutional Notice: The requested query cannot be verified against current institutional policies..."*

---

## 12. Grounding Evaluation & Chatbot History Integration

1. **Context Assembly with Anchors**: Retained chunks are formatted with structured anchors:
   `[Source 1: Title | Section: SectionName | Page: X]`
2. **Multi-Turn Chatbot Memory**: `EdenController` now loads the student's conversation history (`MemoryService.getHistory`), injects it into `EdenOrchestrator`, and displays verifiable source citations directly within `AICopilotPage` and `EdenGlobalWidget`.
3. **Response Verification**: `RAGResponseValidator` verifies that any factual response to an institutional query cites genuine sources present in the retrieved evidence pool.

---

## 13. Limitations

1. **Corpus Scale**: The current evaluation corpus comprises 5 authoritative university documents (24 semantic chunks). Larger institutional deployments with hundreds of course syllabi and circulars will require cluster-level sharded vector indexing.
2. **Dynamic Policy Updates**: Policies updated mid-semester require re-indexing via `seed_rag_knowledge.mjs` or the admin document upload endpoint to maintain vector freshness.
3. **Multi-Hop Synthesis**: Complex queries spanning three or more distinct policies simultaneously (e.g., financial refund for detained students with medical exemption) require multi-hop retrieval and Context Fusion (Phase R14).

---

## 14. Conclusion

Phase **R11 — Automated RAG Retrieval Evaluation** has established quantitative, empirical proof that EduSphere's grounded retrieval pipeline meets production standards:
- **Recall@1**: 1.00
- **Precision@1**: 1.00
- **MRR**: 1.00
- **nDCG@5**: 0.98
- **Adversarial OOD Blocked**: 10/10 (0 grounding failures)

The system is now fully validated and prepared for Phase R12 (Grounded Answer Evaluation) and Phase R14 (Context Fusion Engine).
