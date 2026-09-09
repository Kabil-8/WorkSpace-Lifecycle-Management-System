import path from 'path';
export class DocumentLoader {
    static loadTextContent(bufferOrString, filename, ownerId) {
        const content = typeof bufferOrString === 'string' ? bufferOrString : bufferOrString.toString('utf-8');
        const ext = path.extname(filename).toLowerCase().replace('.', '');
        return {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: path.basename(filename),
            content: content.trim(),
            ownerId,
            fileType: ext || 'txt',
        };
    }
}
