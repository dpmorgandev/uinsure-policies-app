export interface CompileOptions {
root: string;
ref: string;
now?: () => Date;
}

export interface Problem {
file: string | null;
line: number | null;
reason: string;
}

export interface CompileFailure extends Error {
problems: Problem[];
}

export function compile(options: CompileOptions): void {
throw new Error('not implemented');
}
