import specificationsJson from './specifications.json';
import type { DevSpecification } from '../domain';

export const SPECIFICATIONS = specificationsJson as DevSpecification[];
export const SPEC_BY_ID: Record<string, DevSpecification> =
  Object.fromEntries(SPECIFICATIONS.map((s) => [s.id, s]));
