
import type {Config} from '@jest/types';

export const JEST_CONFIG: Config.InitialOptions = {
    preset: 'ts-jest',
    verbose: true,
    collectCoverage: true,
    testMatch: [ '**/spec/**/*.spec.ts' ],
    collectCoverageFrom: [ './src/**/*.ts' ]
}

export default JEST_CONFIG;
