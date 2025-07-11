import type { Project as AiProject } from '@/ai/flows/suggest-project-sequence';

export interface Project extends AiProject {
  id: string;
  ragStatus?: 'Red' | 'Amber' | 'Green' | '';
}
