import { authHandlers } from './auth';
import { githubHandlers } from './github';

export const handlers = [...authHandlers, ...githubHandlers];
