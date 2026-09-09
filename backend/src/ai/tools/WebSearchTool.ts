import { logger } from '../../config/logger.js'
import { WebSource } from '../SourceManager.js'

export class WebSearchTool {
  /**
   * SSRF Security Guard: Ensures target URL uses http/https and is not a private IP.
   */
  private static isSafeUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
      const host = parsed.hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false
      if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false
      if (/^169\.254\./.test(host) || /^100\.64\./.test(host)) return false // link-local + CGNAT
      return true
    } catch {
      return false
    }
  }

  static async search(query: string): Promise<{ success: boolean; results: WebSource[]; error?: string }> {
    const provider = (process.env.WEB_SEARCH_PROVIDER || 'tavily').toLowerCase()
    const apiKey = process.env.WEB_SEARCH_API_KEY || process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY

    if (!apiKey || apiKey.trim().length < 5) {
      logger.info('[WebSearchTool] Search API key unconfigured, live web verification unavailable.')
      return {
        success: false,
        results: [],
        error: 'Web search API key is unconfigured in backend/.env (WEB_SEARCH_API_KEY).',
      }
    }

    try {
      // 1. Tavily Search Provider Integration
      if (provider === 'tavily') {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey.trim(),
            query,
            search_depth: 'basic',
            include_answer: false,
            max_results: 5,
          }),
          signal: AbortSignal.timeout(8000),
        })

        if (res.ok) {
          const data: any = await res.json()
          const results: WebSource[] = (data.results || [])
            .filter((r: any) => this.isSafeUrl(r.url))
            .map((r: any) => ({
              title: r.title || 'Web Result',
              url: r.url,
              domain: new URL(r.url).hostname.replace(/^www\./, ''),
              snippet: r.content || r.snippet || '',
              content: r.content || '',
              retrievedAt: new Date().toISOString(),
              relevanceScore: r.score || 0.8,
            }))

          return { success: true, results }
        }
        const errorText = await res.text().catch(() => '')
        logger.warn({ status: res.status, body: errorText.slice(0, 200) }, '[WebSearchTool] Tavily request failed')
      }

      // 2. Serper Google Search Provider Integration
      if (provider === 'serper') {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 5 }),
          signal: AbortSignal.timeout(8000),
        })

        if (res.ok) {
          const data: any = await res.json()
          const results: WebSource[] = (data.organic || [])
            .filter((r: any) => this.isSafeUrl(r.link))
            .map((r: any) => ({
              title: r.title || 'Search Result',
              url: r.link,
              domain: new URL(r.link).hostname.replace(/^www\./, ''),
              snippet: r.snippet || '',
              content: r.snippet || '',
              retrievedAt: new Date().toISOString(),
            }))

          return { success: true, results }
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message, query }, '[WebSearchTool] Web search execution error')
      return { success: false, results: [], error: err.message }
    }

    return {
      success: false,
      results: [],
      error: 'Web search provider failed or unconfigured.',
    }
  }

  /**
   * Opens a web page and extracts clean text content (up to 5000 chars).
   * Strips scripts, styles, and HTML tags.
   */
  static async openWebPage(url: string): Promise<{ success: boolean; title?: string; text?: string; error?: string }> {
    if (!this.isSafeUrl(url)) {
      return { success: false, error: 'Target URL failed SSRF security checks.' }
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'EduSphere-EDEN-ResearchBot/2.0 (+https://edusphere.ai/bot)' },
        signal: AbortSignal.timeout(7000),
      })

      if (!res.ok) return { success: false, error: `Page returned HTTP ${res.status}` }

      const html = await res.text()
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : url

      // Strip HTML tags & scripts to extract clean text content
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000) // expanded from 3000 to 5000

      return { success: true, title, text }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * NEW: Follow relevant links from a page.
   * Extracts <a href> links from the page, finds ones likely relevant to the query,
   * fetches the first relevant linked page, and returns its text content.
   * Limited to 1 level deep to avoid infinite crawling.
   */
  static async followRelevantLink(pageUrl: string, query: string): Promise<string | null> {
    try {
      const res = await fetch(pageUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'EduSphere-EDEN-ResearchBot/2.0' },
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) return null

      const html = await res.text()
      const baseDomain = new URL(pageUrl).hostname

      // Extract all internal links (same domain, not anchors, not downloads)
      const linkPattern = /<a\s+[^>]*href="([^"#?]+)"[^>]*>([^<]{3,80})<\/a>/gi
      const links: { href: string; text: string }[] = []
      let match

      while ((match = linkPattern.exec(html)) !== null) {
        const href = match[1].trim()
        const linkText = match[2].replace(/<[^>]+>/g, '').trim()

        // Only internal links or absolute links to same domain
        if (href.startsWith('/') || href.includes(baseDomain)) {
          const fullUrl = href.startsWith('http') ? href : `${new URL(pageUrl).origin}${href}`
          if (this.isSafeUrl(fullUrl)) {
            links.push({ href: fullUrl, text: linkText })
          }
        }
      }

      if (links.length === 0) return null

      // Score links by keyword overlap with query
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      const scored = links.map(link => ({
        ...link,
        score: queryWords.filter(w => link.text.toLowerCase().includes(w) || link.href.toLowerCase().includes(w)).length,
      }))
        .filter(l => l.score > 0)
        .sort((a, b) => b.score - a.score)

      if (scored.length === 0) return null

      // Fetch the most relevant linked page
      const bestLink = scored[0]
      const linkedPage = await this.openWebPage(bestLink.href)

      if (linkedPage.success && linkedPage.text) {
        logger.info({ url: bestLink.href, score: bestLink.score }, '[WebSearchTool] Followed relevant link')
        return `  [Linked: ${linkedPage.title || bestLink.href}]\n  ${linkedPage.text.slice(0, 1000)}`
      }

      return null
    } catch (err: any) {
      logger.debug({ err: err.message }, '[WebSearchTool] Link following failed (non-critical)')
      return null
    }
  }
}
