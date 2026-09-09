import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
export class CompilerEngine {
    static tempDir = path.join(os.tmpdir(), 'edusphere-compiler');
    static ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    static async execute(req, onDataChunk) {
        this.ensureTempDir();
        const { language, code, input = '', timeoutMs = 5000 } = req;
        const sessionKey = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let command = '';
        let args = [];
        let tempFilePath = '';
        let extraCleanupFile = '';
        try {
            if (language === 'javascript') {
                tempFilePath = path.join(this.tempDir, `${sessionKey}.js`);
                fs.writeFileSync(tempFilePath, code, 'utf-8');
                command = 'node';
                args = [tempFilePath];
            }
            else if (language === 'python') {
                tempFilePath = path.join(this.tempDir, `${sessionKey}.py`);
                fs.writeFileSync(tempFilePath, code, 'utf-8');
                command = process.platform === 'win32' ? 'python' : 'python3';
                args = [tempFilePath];
            }
            else if (language === 'c') {
                tempFilePath = path.join(this.tempDir, `${sessionKey}.c`);
                const exePath = path.join(this.tempDir, process.platform === 'win32' ? `${sessionKey}.exe` : sessionKey);
                fs.writeFileSync(tempFilePath, code, 'utf-8');
                extraCleanupFile = exePath;
                const compiler = process.platform === 'win32' ? 'gcc' : 'gcc';
                const compileResult = await this.runCommand(compiler, ['-O2', tempFilePath, '-o', exePath], '', 10000);
                if (compileResult.exitCode !== 0) {
                    return {
                        status: 'error',
                        stdout: '',
                        stderr: `C Compilation Error:\n${compileResult.stderr}`,
                        executionTimeMs: compileResult.executionTimeMs,
                        exitCode: compileResult.exitCode,
                    };
                }
                command = exePath;
                args = [];
            }
            else if (language === 'cpp') {
                tempFilePath = path.join(this.tempDir, `${sessionKey}.cpp`);
                const exePath = path.join(this.tempDir, process.platform === 'win32' ? `${sessionKey}.exe` : sessionKey);
                fs.writeFileSync(tempFilePath, code, 'utf-8');
                extraCleanupFile = exePath;
                const compileResult = await this.runCommand('g++', ['-O2', tempFilePath, '-o', exePath], '', 10000);
                if (compileResult.exitCode !== 0) {
                    return {
                        status: 'error',
                        stdout: '',
                        stderr: `C++ Compilation Error:\n${compileResult.stderr}`,
                        executionTimeMs: compileResult.executionTimeMs,
                        exitCode: compileResult.exitCode,
                    };
                }
                command = exePath;
                args = [];
            }
            else if (language === 'java') {
                // 1. Search for explicit 'public class ClassName'
                let className = '';
                const publicMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                if (publicMatch) {
                    className = publicMatch[1];
                }
                else {
                    // 2. Search for class containing main method
                    const mainClassMatch = code.match(/class\s+([A-Za-z0-9_]+)\s*\{[\s\S]*?public\s+static\s+void\s+main/);
                    if (mainClassMatch) {
                        className = mainClassMatch[1];
                    }
                    else {
                        // 3. Fallback to any class name or 'Main'
                        const anyClassMatch = code.match(/class\s+([A-Za-z0-9_]+)/);
                        className = anyClassMatch ? anyClassMatch[1] : 'Main';
                    }
                }
                const javaDir = path.join(this.tempDir, sessionKey);
                fs.mkdirSync(javaDir, { recursive: true });
                tempFilePath = path.join(javaDir, `${className}.java`);
                fs.writeFileSync(tempFilePath, code, 'utf-8');
                // Try compiling with --release 8 for maximum JRE runtime compatibility
                let compileResult = await this.runCommand('javac', ['--release', '8', '-encoding', 'UTF-8', tempFilePath], '', 10000);
                if (compileResult.exitCode !== 0) {
                    // Fallback to standard javac compilation without --release 8
                    compileResult = await this.runCommand('javac', ['-encoding', 'UTF-8', tempFilePath], '', 10000);
                }
                if (compileResult.exitCode !== 0) {
                    return {
                        status: 'error',
                        stdout: '',
                        stderr: `Java Compilation Error:\n${compileResult.stderr}`,
                        executionTimeMs: compileResult.executionTimeMs,
                        exitCode: compileResult.exitCode,
                    };
                }
                command = 'java';
                args = ['-cp', javaDir, className];
            }
            else {
                throw new Error(`Unsupported language: ${language}`);
            }
            return await this.runCommand(command, args, input, timeoutMs, tempFilePath, extraCleanupFile, onDataChunk);
        }
        catch (err) {
            return {
                status: 'error',
                stdout: '',
                stderr: err.message || 'Execution error',
                executionTimeMs: 0,
                exitCode: 1,
            };
        }
    }
    static runCommand(command, args, input, timeoutMs, cleanupFile, cleanupFile2, onDataChunk) {
        return new Promise(resolve => {
            const startTime = Date.now();
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            const customEnv = {
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                PYTHONUTF8: '1',
                JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8',
                LANG: 'en_US.UTF-8',
                LC_ALL: 'en_US.UTF-8',
            };
            const child = spawn(command, args, { windowsHide: true, env: customEnv });
            const timer = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeoutMs);
            if (input && child.stdin) {
                child.stdin.write(input);
                child.stdin.end();
            }
            child.stdout?.on('data', data => {
                const text = data.toString('utf-8');
                stdout += text;
                onDataChunk?.({ type: 'stdout', text });
            });
            child.stderr?.on('data', data => {
                const text = data.toString('utf-8');
                stderr += text;
                onDataChunk?.({ type: 'stderr', text });
            });
            child.on('error', (err) => {
                clearTimeout(timer);
                if (err.code === 'ENOENT') {
                    stderr += `\nCompiler/Runtime executable "${command}" was not found on the host system PATH.\nPlease install ${command} or select another supported language (JavaScript, Python, Java).`;
                }
                else {
                    stderr += `\nProcess error: ${err.message}`;
                }
                this.cleanFiles(cleanupFile, cleanupFile2);
                resolve({
                    status: 'error',
                    stdout,
                    stderr,
                    executionTimeMs: Date.now() - startTime,
                    exitCode: 1,
                });
            });
            child.on('close', code => {
                clearTimeout(timer);
                const executionTimeMs = Date.now() - startTime;
                this.cleanFiles(cleanupFile, cleanupFile2);
                if (timedOut) {
                    resolve({
                        status: 'timeout',
                        stdout,
                        stderr: stderr + `\nTime limit exceeded (${timeoutMs}ms)`,
                        executionTimeMs,
                        exitCode: null,
                    });
                }
                else {
                    resolve({
                        status: code === 0 ? 'success' : 'error',
                        stdout,
                        stderr,
                        executionTimeMs,
                        exitCode: code,
                    });
                }
            });
        });
    }
    static cleanFiles(file1, file2) {
        try {
            if (file1 && fs.existsSync(file1)) {
                if (fs.statSync(file1).isDirectory()) {
                    fs.rmSync(file1, { recursive: true, force: true });
                }
                else {
                    fs.unlinkSync(file1);
                }
            }
            if (file2 && fs.existsSync(file2))
                fs.unlinkSync(file2);
        }
        catch {
            // Ignore cleanup errors
        }
    }
}
