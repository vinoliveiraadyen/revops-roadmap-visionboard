"use client";

import { useState, useTransition, type DragEvent } from "react";
import type { Project, ProjectsByQuarter, Quarter } from "@/lib/types";
import { AddProjectDialog, type ProjectFormValues } from "@/components/add-project-dialog";
import { TimelineQuarter } from "@/components/timeline-quarter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getOptimalSequence } from "@/app/actions";
import { Lightbulb, Loader2 } from "lucide-react";
import { format } from "date-fns";

const initialProjects: ProjectsByQuarter = {
  1: [
    { id: 'proj-1', name: 'Initial Planning & Research', epicNumber: 'EPIC-001', team: 'Strategy', startDate: '2024-01-15', endDate: '2024-02-28', resources: 'PM, UX Researcher', dependencies: 'None' },
  ],
  2: [
    { id: 'proj-2', name: 'Develop Core Features', epicNumber: 'EPIC-002', team: 'Engineering', startDate: '2024-04-01', endDate: '2024-06-15', resources: 'Dev Team A, QA', dependencies: 'Initial Planning & Research' },
  ],
  3: [],
  4: [],
};

const getQuarterFromDate = (date: Date): Quarter => {
  const month = date.getMonth(); // 0-11
  if (month < 3) return 1;
  if (month < 6) return 2;
  if (month < 9) return 3;
  return 4;
};

export default function Home() {
  const [projectsByQuarter, setProjectsByQuarter] = useState<ProjectsByQuarter>(initialProjects);
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
    const quarter = getQuarterFromDate(data.startDate);
    setProjectsByQuarter(prev => ({
      ...prev,
      [quarter]: [...prev[quarter], newProject],
    }));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    e.dataTransfer.setData("projectId", projectId);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetQuarter: Quarter) => {
    const projectId = e.dataTransfer.getData("projectId");
    if (!projectId) return;

    let sourceQuarter: Quarter | null = null;
    let projectToMove: Project | undefined;

    const updatedProjects = JSON.parse(JSON.stringify(projectsByQuarter));

    for (const q of Object.keys(updatedProjects)) {
        const quarterKey = parseInt(q) as Quarter;
        const projectIndex = updatedProjects[quarterKey].findIndex((p: Project) => p.id === projectId);
        if (projectIndex !== -1) {
            sourceQuarter = quarterKey;
            [projectToMove] = updatedProjects[quarterKey].splice(projectIndex, 1);
            break;
        }
    }
    
    if (projectToMove && sourceQuarter) {
        updatedProjects[targetQuarter].push(projectToMove);
        setProjectsByQuarter(updatedProjects);
    }
  };

  const handleOptimize = () => {
    const allProjects = Object.values(projectsByQuarter).flat();
    if (allProjects.length === 0) {
      toast({
        title: "No projects to optimize",
        description: "Add some projects before using the AI sequencer.",
        variant: "destructive"
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await getOptimalSequence(allProjects, teamAvailability);
        
        const projectMap = new Map(allProjects.map(p => [p.name, p]));
        const sortedProjects = result.optimalSequence.map(name => projectMap.get(name)).filter(Boolean) as Project[];

        const newProjectsByQuarter: ProjectsByQuarter = { 1: [], 2: [], 3: [], 4: [] };
        sortedProjects.forEach(p => {
            const quarter = getQuarterFromDate(new Date(p.startDate));
            newProjectsByQuarter[quarter].push(p);
        });

        allProjects.forEach(p => {
          if (!result.optimalSequence.includes(p.name)) {
            const quarter = getQuarterFromDate(new Date(p.startDate));
            if (!newProjectsByQuarter[quarter].some(np => np.id === p.id)) {
                newProjectsByQuarter[quarter].push(p);
            }
          }
        });

        setProjectsByQuarter(newProjectsByQuarter);
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
                <AddProjectDialog onProjectAdd={handleProjectAdd} />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(projectsByQuarter) as (keyof ProjectsByQuarter)[]).map((q) => (
            <TimelineQuarter
              key={q}
              quarter={q}
              projects={projectsByQuarter[q]}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </main>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>Drag and drop cards to reorganize. Use the AI to find the optimal sequence.</p>
      </footer>
    </div>
  );
}
