import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/index.ts', 'src/worker.ts'],
    bundle: true,
    packages: 'external',
    outdir: 'dist',
    platform: 'node',
    format: 'esm',
    target: 'node24',
    minify: true,
    keepNames: true,
    sourcemap: true,
});