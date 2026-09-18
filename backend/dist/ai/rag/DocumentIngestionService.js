import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger.js';
export class DocumentIngestionService {
    /**
     * Scans a root directory and parses all markdown and text documents into IngestedDocument objects.
     */
    static async ingestDirectory(dirPath) {
        const results = [];
        if (!fs.existsSync(dirPath)) {
            logger.warn({ dirPath }, '[DocumentIngestionService] Target directory does not exist');
            return results;
        }
        const files = DocumentIngestionService.collectFilesRecursive(dirPath);
        for (const filePath of files) {
            try {
                const raw = fs.readFileSync(filePath, 'utf-8');
                const parsed = DocumentIngestionService.parseDocumentContent(raw, filePath);
                if (parsed)
                    results.push(parsed);
            }
            catch (err) {
                logger.error({ filePath, err: err.message }, '[DocumentIngestionService] Failed to ingest file');
            }
        }
        logger.info({ totalIngested: results.length, rootDir: dirPath }, '[DocumentIngestionService] Directory ingestion complete');
        return results;
    }
    /**
     * Parses raw file content extracting documentId, title, category, department, and semester.
     */
    static parseDocumentContent(raw, filePath) {
        const filename = path.basename(filePath);
        const stats = fs.statSync(filePath);
        // Extract metadata from markdown headers or frontmatter
        let documentId = `doc-${path.basename(filename, path.extname(filename))}`;
        let title = path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ');
        let category = 'institutional_policy';
        let department = 'All Departments';
        let semester = undefined;
        const idMatch = raw.match(/\*\*Document ID\*\*:\s*`?([a-zA-Z0-9_-]+)`?/i);
        if (idMatch)
            documentId = idMatch[1].trim();
        const titleMatch = raw.match(/^#\s+(.+)$/m);
        if (titleMatch)
            title = titleMatch[1].trim();
        const catMatch = raw.match(/\*\*Category\*\*:\s*`?([a-zA-Z0-9_-]+)`?/i);
        if (catMatch)
            category = catMatch[1].trim();
        const deptMatch = raw.match(/\*\*Department\*\*:\s*(.+)$/im) || raw.match(/\*\*Applicability\*\*:\s*(.+)$/im);
        if (deptMatch) {
            const deptStr = deptMatch[1].trim();
            if (/computer science|cse/i.test(deptStr))
                department = 'Computer Science & Engineering';
            else if (/all/i.test(deptStr) || /graduating|final year|engineering|b\.tech/i.test(deptStr))
                department = 'All Departments';
            else
                department = deptStr;
        }
        const semMatch = raw.match(/Semester\s*(\d+)/i);
        if (semMatch)
            semester = parseInt(semMatch[1], 10);
        // Infer category from file path if not explicit
        const lowerPath = filePath.toLowerCase();
        if (lowerPath.includes('attendance'))
            category = 'attendance_policy';
        else if (lowerPath.includes('exam'))
            category = 'examination_rules';
        else if (lowerPath.includes('placement'))
            category = 'placement_policy';
        else if (lowerPath.includes('syllabus') || lowerPath.includes('curriculum'))
            category = 'syllabus';
        else if (lowerPath.includes('regulation'))
            category = 'academic_regulations';
        return {
            documentId,
            title,
            category,
            department,
            semester,
            content: raw,
            filePath,
            fileSize: stats.size,
            metadata: {
                rawFileName: filename,
                ingestedAt: new Date().toISOString()
            }
        };
    }
    static collectFilesRecursive(dir) {
        let files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(DocumentIngestionService.collectFilesRecursive(fullPath));
            }
            else if (entry.isFile() && /\.(md|txt|json)$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
