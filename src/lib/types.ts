import type { Project as AiProject } from '@/ai/flows/suggest-project-sequence';

export interface Project extends AiProject {
  id: string;
}

export type Quarter = 1 | 2 | 3 | 4;

export type ProjectsByQuarter = {
  1: Project[];
  2: Project[];
  3: Project[];
  4: Project[];
};
