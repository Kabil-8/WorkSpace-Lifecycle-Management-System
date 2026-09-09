import { WebSearchTool } from './tools/WebSearchTool.js';
import { logger } from '../config/logger.js';
export class WebResearchAgent {
    /**
     * Determines if a query warrants live web research.
     * Broader trigger than before — covers current events, versions, pricing,
     * official docs, and any query that implies need for verified external knowledge.
     */
    static isResearchNeeded(query) {
        const q = query.toLowerCase();
        return /(latest|current|news|today|version|release|2024|2025|2026|pricing|limits|docs|official|documentation|best practice|who won|score|how much|what is the price|recently|just released|new feature|changelog|update|announcement|tutorial|guide|example|vs\s|compare|difference between|which is better)\b/i.test(q);
    }
    /**
     * Generates multiple diverse search queries for a user question.
     * This improves recall by covering different angles of the same topic.
     */
    static generateSearchQueries(originalQuery) {
        const q = originalQuery.trim();
        const queries = [q];
        // Add a documentation-focused query
        if (/(aws|azure|gcp|react|node|python|mongodb|docker|kubernetes|java|typescript)/i.test(q)) {
            queries.push(`${q} official documentation`);
        }
        // Add a comparison-focused query if comparing technologies
        if (/\bvs\b|\bversus\b|\bcompare\b|\bdifference\b/i.test(q)) {
            queries.push(`${q} comparison 2026`);
        }
        // Add pricing/cost query if relevant
        if (/\bpric(e|ing)\b|\bcost\b|\bfree\b|\bplan\b/i.test(q)) {
            queries.push(`${q} pricing plans 2026`);
        }
        // Add example/tutorial query for how-to questions
        if (/\bhow to\b|\bhow do\b|\bexample\b|\btutorial\b/i.test(q)) {
            queries.push(`${q} step by step example`);
        }
        return [...new Set(queries)].slice(0, 3); // max 3 distinct queries
    }
    /**
     * Ranks sources by domain authority (official > edu > org > general).
     */
    static rankSources(sources) {
        const tier1 = ['aws.amazon.com', 'docs.python.org', 'developer.mozilla.org', 'react.dev', 'nodejs.org', 'mongodb.com', 'oracle.com', 'microsoft.com', 'cloud.google.com', 'docs.docker.com'];
        const tier2 = ['github.com', 'stackoverflow.com', 'wikipedia.org', 'medium.com', 'dev.to'];
        return sources.sort((a, b) => {
            const aScore = tier1.some(d => a.domain.includes(d)) ? 3
                : (tier2.some(d => a.domain.includes(d)) || a.domain.endsWith('.edu') || a.domain.endsWith('.gov') || a.domain.endsWith('.org')) ? 2
                    : (a.relevanceScore || 0);
            const bScore = tier1.some(d => b.domain.includes(d)) ? 3
                : (tier2.some(d => b.domain.includes(d)) || b.domain.endsWith('.edu') || b.domain.endsWith('.gov') || b.domain.endsWith('.org')) ? 2
                    : (b.relevanceScore || 0);
            return bScore - aScore;
        });
    }
    /**
     * Deduplicates sources by URL across multiple search queries.
     */
    static deduplicateSources(sources) {
        const seen = new Set();
        return sources.filter(s => {
            if (seen.has(s.url))
                return false;
            seen.add(s.url);
            return true;
        });
    }
    /**
     * Full multi-source web research pipeline:
     * 1. Generate 3 search queries
     * 2. Execute searches in parallel
     * 3. Deduplicate + rank sources by authority
     * 4. Open top-2 pages for full content extraction
     * 5. Follow 1 relevant link per top page (1 level deep)
     * 6. Build rich evidence block with source attribution
     */
    static async conductResearch(query, sourceManager) {
        logger.info({ query }, '[WebResearchAgent] Starting multi-source research pipeline');
        const searchQueries = this.generateSearchQueries(query);
        logger.info({ queries: searchQueries }, '[WebResearchAgent] Generated search queries');
        // Execute all queries in parallel
        const searchPromises = searchQueries.map(q => WebSearchTool.search(q));
        const searchResults = await Promise.allSettled(searchPromises);
        // Collect all results, flatten and deduplicate
        const allSources = [];
        for (const result of searchResults) {
            if (result.status === 'fulfilled' && result.value.success) {
                allSources.push(...result.value.results);
            }
        }
        if (allSources.length === 0) {
            return {
                hasWebResults: false,
                evidenceText: '',
                sources: [],
                statusMessage: 'Live web research API key unconfigured or all searches failed. Relied on internal LLM knowledge.',
            };
        }
        const deduped = this.deduplicateSources(allSources);
        const ranked = this.rankSources(deduped);
        const topSources = ranked.slice(0, 6); // top 6 ranked sources
        let evidenceText = '### 🔎 Live Web Research Evidence (Multi-Source, Verified):\n\n';
        // Process top sources with full page content for top 2
        for (let i = 0; i < topSources.length; i++) {
            const src = topSources[i];
            sourceManager.addSource({
                title: src.title,
                url: src.url,
                snippet: src.snippet,
                content: src.content,
                relevanceScore: src.relevanceScore,
            });
            let contentBlock = src.snippet.slice(0, 600);
            // For top-2 sources: fetch full page text for richer context
            if (i < 2) {
                try {
                    const pageRes = await WebSearchTool.openWebPage(src.url);
                    if (pageRes.success && pageRes.text) {
                        contentBlock = pageRes.text.slice(0, 1500);
                        logger.info({ url: src.url, chars: contentBlock.length }, '[WebResearchAgent] Full page content extracted');
                        // Follow 1 relevant link from this page (1 level deep)
                        const linkedContent = await WebSearchTool.followRelevantLink(src.url, query);
                        if (linkedContent) {
                            evidenceText += `Source [${i + 1}] (${src.title} — ${src.domain}):\n${contentBlock}\n\n`;
                            evidenceText += `  ↳ Related Link Found:\n${linkedContent}\n\n`;
                            continue;
                        }
                    }
                }
                catch (pageErr) {
                    logger.warn({ url: src.url, err: pageErr.message }, '[WebResearchAgent] Full page fetch failed, using snippet');
                }
            }
            evidenceText += `Source [${i + 1}] (${src.title} — ${src.domain}):\n${contentBlock}\n\n`;
        }
        logger.info({ totalSources: topSources.length, queriesRun: searchQueries.length }, '[WebResearchAgent] Research pipeline complete');
        return {
            hasWebResults: true,
            evidenceText,
            sources: topSources,
        };
    }
}
