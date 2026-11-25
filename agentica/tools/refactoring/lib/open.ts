import type { Args } from './cli';
import { fail } from './cli';
import { Project } from './project';

/** Открыть проект из аргументов, показав понятную ошибку вместо стектрейса. */
export function openProject(args: Args): Project {
  try {
    return new Project({ root: args.values.get('--root'), tsconfig: args.values.get('--tsconfig') });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
