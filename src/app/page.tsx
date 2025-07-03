"use client";

import { useState, useTransition } from "react";
import type { Project } from "@/lib/types";
import { AddProjectDialog, type ProjectFormValues } from "@/components/add-project-dialog";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getOptimalSequence } from "@/app/actions";
import { Lightbulb, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { ImportCsvDialog } from "@/components/import-csv-dialog";

const initialProjects: Project[] = [
    { id: 'proj-1', name: 'Initial Planning & Research', epicNumber: 'EPIC-001', team: 'Strategy', startDate: '2024-01-15', endDate: '2024-02-28', resources: 'PM, UX Researcher', dependencies: 'None' },
    { id: 'proj-2', name: 'Develop Core Features', epicNumber: 'EPIC-002', team: 'Engineering', startDate: '2024-03-01', endDate: '2024-06-15', resources: 'Dev Team A, QA', dependencies: 'Initial Planning & Research' },
    { id: 'proj-7', name: 'Mobile App Design', epicNumber: 'EPIC-007', team: 'Design', startDate: '2024-02-01', endDate: '2024-04-30', resources: 'UI/UX Designer', dependencies: 'Initial Planning & Research' },
    { id: 'proj-6', name: 'API Integration', epicNumber: 'EPIC-006', team: 'Engineering', startDate: '2024-04-15', endDate: '2024-05-30', resources: 'Dev Team A', dependencies: 'Develop Core Features' },
    { id: 'proj-3', name: 'User Testing & Feedback', epicNumber: 'EPIC-003', team: 'QA & UX', startDate: '2024-06-16', endDate: '2024-07-31', resources: 'Test Group, UX Designer', dependencies: 'Develop Core Features' },
    { id: 'proj-4', name: 'Marketing Launch Campaign', epicNumber: 'EPIC-004', team: 'Marketing', startDate: '2024-08-01', endDate: '2024-09-15', resources: 'Marketing Team', dependencies: 'Develop Core Features' },
    { id: 'proj-5', name: 'Q4 Feature Enhancements', epicNumber: 'EPIC-005', team: 'Engineering', startDate: '2024-10-01', endDate: '2024-11-30', resources: 'Dev Team B', dependencies: 'User Testing & Feedback' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [teamAvailability, setTeamAvailability] = useState("All teams are available with standard capacity. Marketing team has reduced capacity in June due to annual conference.");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleProjectAdd = (data: ProjectFormValues) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      epicNumber: data.epicNumber,
      team: data.team,
      resources: data.resources,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      dependencies: data.dependencies || "None",
    };
    setProjects(prev => [...prev, newProject]);
  };
  
  const handleCsvImport = (newProjects: Project[]) => {
      setProjects(prev => [...prev, ...newProjects]);
  };

  const handleOptimize = () => {
    if (projects.length === 0) {
      toast({
        title: "No projects to optimize",
        description: "Add some projects before using the AI sequencer.",
        variant: "destructive"
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await getOptimalSequence(projects, teamAvailability);
        
        const projectMap = new Map(projects.map(p => [p.name, p]));
        const sortedProjects = result.optimalSequence.map(name => projectMap.get(name)).filter(Boolean) as Project[];
        const unsortedProjects = projects.filter(p => !result.optimalSequence.includes(p.name));
    
        const newProjectList = [...sortedProjects, ...unsortedProjects];

        setProjects(newProjectList);
        toast({
          title: "AI Suggestion Applied!",
          description: <div className="w-full mt-2"><p className="font-semibold">Reasoning:</p><p className="text-xs whitespace-pre-wrap">{result.reasoning}</p></div>,
          duration: 9000
        });

      } catch (error) {
        toast({
          title: "AI Sequencing Failed",
          description: "There was an error processing the request. Please try again.",
          variant: "destructive"
        });
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-center">VisionBoard</h1>
        <p className="text-center text-muted-foreground mt-2">
          Visualize your project roadmap and optimize with AI.
        </p>
      </header>

      <main>
        <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 w-full">
                <h2 className="text-lg font-semibold font-headline mb-2">Team Availability & Constraints</h2>
                <Textarea
                    placeholder="Describe team availability, holidays, or other constraints..."
                    value={teamAvailability}
                    onChange={(e) => setTeamAvailability(e.target.value)}
                    className="h-24 bg-background"
                />
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto pt-0 md:pt-8">
                <div className="flex flex-col sm:flex-row gap-2">
                  <AddProjectDialog onProjectAdd={handleProjectAdd} />
                  <ImportCsvDialog onProjectsAdd={handleCsvImport} />
                </div>
                <Button onClick={handleOptimize} disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Lightbulb className="mr-2 h-4 w-4" />
                )}
                Optimize with AI
                </Button>
            </div>
          </div>
        </div>
        
        <Timeline projects={projects} />

      </main>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>Use the AI to find the optimal sequence. Click on a project to see details.</p>
      </footer>
    </div>
  );
}
