"use server";

import { suggestProjectSequence, type SuggestProjectSequenceInput, type SuggestProjectSequenceOutput } from "@/ai/flows/suggest-project-sequence";
import type { Project } from "@/lib/types";

export async function getOptimalSequence(
  projects: Project[], 
  teamAvailability: string
): Promise<SuggestProjectSequenceOutput> {
  const input: SuggestProjectSequenceInput = {
    projects,
    teamAvailability,
  };

  try {
    const result = await suggestProjectSequence(input);
    return result;
  } catch (error) {
    console.error("AI sequencing failed:", error);
    throw new Error("Failed to get optimal sequence from AI.");
  }
}
