'use server';

/**
 * @fileOverview An AI agent that suggests the optimal project sequence.
 *
 * - suggestProjectSequence - A function that suggests an optimal project sequence.
 * - Project - The interface that represents a project.
 * - SuggestProjectSequenceInput - The input type for the suggestProjectSequence function.
 * - SuggestProjectSequenceOutput - The return type for the suggestProjectSequence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectSchema = z.object({
  name: z.string().describe('The name of the project.'),
  epicNumber: z.string().describe('The epic number associated with the project.'),
  team: z.string().describe('The team responsible for the project.'),
  startDate: z.string().describe('The start date of the project (ISO format).'),
  endDate: z.string().describe('The end date of the project (ISO format).'),
  resources: z.string().describe('The resources required for the project.'),
  dependencies: z.string().describe('The project dependencies (names of other projects).'),
});

export type Project = z.infer<typeof ProjectSchema>;

const SuggestProjectSequenceInputSchema = z.object({
  projects: z.array(ProjectSchema).describe('An array of project objects.'),
  teamAvailability: z.string().describe('Information about the team availability.'),
});

export type SuggestProjectSequenceInput = z.infer<typeof SuggestProjectSequenceInputSchema>;

const SuggestProjectSequenceOutputSchema = z.object({
  optimalSequence: z.array(z.string()).describe('The optimal sequence of project names.'),
  reasoning: z.string().describe('The reasoning behind the suggested sequence.'),
});

export type SuggestProjectSequenceOutput = z.infer<typeof SuggestProjectSequenceOutputSchema>;

export async function suggestProjectSequence(input: SuggestProjectSequenceInput): Promise<SuggestProjectSequenceOutput> {
  return suggestProjectSequenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProjectSequencePrompt',
  input: {schema: SuggestProjectSequenceInputSchema},
  output: {schema: SuggestProjectSequenceOutputSchema},
  prompt: `You are an expert project manager, skilled at sequencing projects based on dependencies, timelines, and resource availability.

  Given the following projects, their dependencies, and team availability, suggest an optimal project sequence.

  Projects:
  {{#each projects}}
  - Name: {{this.name}}
    Epic Number: {{this.epicNumber}}
    Team: {{this.team}}
    Start Date: {{this.startDate}}
    End Date: {{this.endDate}}
    Resources: {{this.resources}}
    Dependencies: {{this.dependencies}}
  {{/each}}

  Team Availability: {{{teamAvailability}}}

  Consider dependencies, timelines, and resource constraints when determining the optimal sequence.
  Return the optimal sequence of project names and the reasoning behind the sequence.

  Output format: 
  {
    "optimalSequence": ["Project1", "Project2", "Project3"],
    "reasoning": "Explanation of the suggested sequence."
  }
`,
});

const suggestProjectSequenceFlow = ai.defineFlow(
  {
    name: 'suggestProjectSequenceFlow',
    inputSchema: SuggestProjectSequenceInputSchema,
    outputSchema: SuggestProjectSequenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
