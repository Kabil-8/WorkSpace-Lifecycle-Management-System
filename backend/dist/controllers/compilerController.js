import { CompilerEngine } from '../services/compilerEngine.js';
export const runCode = async (req, res) => {
    try {
        const { language, code, input, timeoutMs } = req.body;
        if (!language || !code) {
            res.status(400).json({ success: false, message: 'Language and code are required fields' });
            return;
        }
        const result = await CompilerEngine.execute({ language, code, input, timeoutMs });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to execute code',
            error: error.message,
        });
    }
};
