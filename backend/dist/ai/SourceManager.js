export class SourceManager {
    sources = [];
    addSource(source) {
        let domain = '';
        try {
            const parsed = new URL(source.url);
            domain = parsed.hostname.replace(/^www\./, '');
        }
        catch {
            domain = 'external';
        }
        // SSRF / Fake URL check: Only store valid http/https URLs
        if (!/^https?:\/\//i.test(source.url)) {
            return;
        }
        const newSource = {
            ...source,
            domain,
            retrievedAt: new Date().toISOString(),
        };
        if (!this.sources.some(s => s.url === newSource.url)) {
            this.sources.push(newSource);
        }
    }
    getSources() {
        return this.sources;
    }
    clear() {
        this.sources = [];
    }
    formatCitationsMarkdown() {
        if (this.sources.length === 0)
            return '';
        let markdown = '\n\n### 📚 Verified Sources & References:\n';
        this.sources.forEach((src, idx) => {
            markdown += `[${idx + 1}] [${src.title}](${src.url}) — *${src.domain}*\n`;
        });
        return markdown;
    }
}
