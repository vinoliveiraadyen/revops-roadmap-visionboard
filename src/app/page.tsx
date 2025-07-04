
"use client";

import { useState, useTransition, useMemo } from "react";
import type { Project } from "@/lib/types";
import { AddProjectDialog, type ProjectFormValues } from "@/components/add-project-dialog";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getOptimalSequence } from "@/app/actions";
import { Lightbulb, Loader2, Upload, Plus } from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { ImportCsvDialog } from "@/components/import-csv-dialog";
import { ExportCsvButton } from "@/components/export-csv-button";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Separator } from "@/components/ui/separator";
import { ResourceLoadChart } from "@/components/resource-load-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTable } from "@/components/project-table";

const initialProjects: Project[] = [
    { id: 'proj-1', name: 'Initial Planning & Research', epicNumber: 'EPIC-001', team: 'Strategy', impact: 'High', startDate: '2024-01-15', endDate: '2024-02-28', owner: 'PM, UX Researcher', support: 'IT', dependencies: 'None' },
    { id: 'proj-2', name: 'Develop Core Features', epicNumber: 'EPIC-002', team: 'Engineering', impact: 'High', startDate: '2024-03-01', endDate: '2024-06-15', owner: 'Dev Team A, QA', support: 'Architecture', dependencies: 'Initial Planning & Research' },
    { id: 'proj-7', name: 'Mobile App Design', epicNumber: 'EPIC-007', team: 'Design', impact: 'Medium', startDate: '2024-02-01', endDate: '2024-04-30', owner: 'UI/UX Designer', support: 'Design System Team', dependencies: 'Initial Planning & Research' },
    { id: 'proj-6', name: 'API Integration', epicNumber: 'EPIC-006', team: 'Engineering', impact: 'Medium', startDate: '2024-04-15', endDate: '2024-05-30', owner: 'Dev Team A', support: 'DevOps', dependencies: 'Develop Core Features' },
    { id: 'proj-3', name: 'User Testing & Feedback', epicNumber: 'EPIC-003', team: 'QA & UX', impact: 'Medium', startDate: '2024-06-16', endDate: '2024-07-31', owner: 'Test Group, UX Designer', support: 'Analytics', dependencies: 'Develop Core Features' },
    { id: 'proj-4', name: 'Marketing Launch Campaign', epicNumber: 'EPIC-004', team: 'Marketing', impact: 'High', startDate: '2024-08-01', endDate: '2024-09-15', owner: 'Marketing Team', support: 'Sales', dependencies: 'Develop Core Features' },
    { id: 'proj-5', name: 'Q4 Feature Enhancements', epicNumber: 'EPIC-005', team: 'Engineering', impact: 'Low', startDate: '2024-10-01', endDate: '2024-11-30', owner: 'Dev Team B', support: 'Architecture', dependencies: 'User Testing & Feedback' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [teamAvailability, setTeamAvailability] = useState("All teams are available with standard capacity. Marketing team has reduced capacity in June due to annual conference.");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [selectedSupport, setSelectedSupport] = useState<string[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  const [selectedOwnersForChart, setSelectedOwnersForChart] = useState<string[]>([]);

  const allTeams = useMemo(() => [...new Set(projects.map(p => p.team))].sort(), [projects]);
  const allImpacts = useMemo(() => {
    const impactsSet = new Set<string>();
    projects.forEach(p => {
        p.impact.split(',').forEach(i => {
            const trimmed = i.trim();
            if(trimmed) impactsSet.add(trimmed);
        });
    });
    return [...impactsSet].sort();
  }, [projects]);
  const allOwners = useMemo(() => {
    const ownersSet = new Set<string>();
    projects.forEach(p => {
        p.owner.split(',').forEach(r => {
            const trimmed = r.trim();
            if(trimmed) ownersSet.add(trimmed);
        });
    });
    return [...ownersSet].sort();
  }, [projects]);
  const allSupport = useMemo(() => {
    const supportSet = new Set<string>();
    projects.forEach(p => {
      p.support.split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) supportSet.add(trimmed);
      });
    });
    return [...supportSet].sort();
  }, [projects]);
  const allDependencies = useMemo(() => {
    const dependenciesSet = new Set<string>();
    projects.forEach(p => {
      p.dependencies.split(',').forEach(d => {
        const trimmed = d.trim();
        if (trimmed && trimmed.toLowerCase() !== 'none') dependenciesSet.add(trimmed);
      });
    });
    return [...dependenciesSet].sort();
  }, [projects]);
  
  const hasActiveFilters = selectedTeams.length > 0 || selectedOwners.length > 0 || selectedImpacts.length > 0 || selectedSupport.length > 0 || selectedDependencies.length > 0;
  
  const filteredProjects = useMemo(() => {
    if (!hasActiveFilters) return projects;

    return projects.filter(project => {
      const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(project.team);
      
      const projectImpacts = project.impact.split(',').map(i => i.trim()).filter(Boolean);
      const impactMatch = selectedImpacts.length === 0 || projectImpacts.some(i => selectedImpacts.includes(i));
      
      const projectOwners = project.owner.split(',').map(r => r.trim()).filter(Boolean);
      const ownerMatch = selectedOwners.length === 0 || projectOwners.some(r => selectedOwners.includes(r));

      const projectSupport = project.support.split(',').map(s => s.trim()).filter(Boolean);
      const supportMatch = selectedSupport.length === 0 || projectSupport.some(s => selectedSupport.includes(s));

      const projectDependencies = project.dependencies.split(',').map(d => d.trim()).filter(Boolean);
      const dependenciesMatch = selectedDependencies.length === 0 || projectDependencies.some(d => selectedDependencies.includes(d));
      
      return teamMatch && ownerMatch && impactMatch && supportMatch && dependenciesMatch;
    });
  }, [projects, selectedTeams, selectedOwners, selectedImpacts, selectedSupport, selectedDependencies, hasActiveFilters]);

  const handleProjectSave = (data: ProjectFormValues, projectId?: string) => {
    if (projectId) {
      // Update existing project
      setProjects(prev => prev.map(p => p.id === projectId ? {
        ...p,
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        dependencies: data.dependencies || "None",
      } : p));
      toast({ title: "Project Updated", description: `"${data.name}" has been successfully updated.` });
    } else {
      // Add new project
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: data.name,
        epicNumber: data.epicNumber,
        team: data.team,
        impact: data.impact,
        owner: data.owner,
        support: data.support,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        dependencies: data.dependencies || "None",
      };
      setProjects(prev => [...prev, newProject]);
      toast({ title: "Project Added", description: `"${data.name}" has been successfully created.` });
    }
  };
  
  const handleCsvImport = (newProjects: Project[]) => {
      setProjects(prev => [...prev, ...newProjects]);
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Project Deleted",
      description: "The project has been successfully removed.",
    });
  };
  
  const handleProjectEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsEditDialogOpen(true);
  };
  
  const handleProjectMove = (projectId: string, newStartDate: Date) => {
    setProjects(prevProjects => {
        const projectToMove = prevProjects.find(p => p.id === projectId);
        if (!projectToMove) return prevProjects;

        try {
            const originalStart = parseISO(projectToMove.startDate);
            const originalEnd = parseISO(projectToMove.endDate);
            const duration = differenceInDays(originalEnd, originalStart);

            const newEndDate = addDays(newStartDate, duration);

            return prevProjects.map(p => 
                p.id === projectId 
                ? { 
                    ...p, 
                    startDate: format(newStartDate, "yyyy-MM-dd"),
                    endDate: format(newEndDate, "yyyy-MM-dd")
                  } 
                : p
            );
        } catch (e) {
            console.error("Error calculating new project dates:", e);
            return prevProjects; // Return original state on error
        }
    });
    toast({
        title: "Project Rescheduled",
        description: "The project's dates have been updated on the timeline."
    });
  };

  const handleOptimize = () => {
    const projectsToOptimize = hasActiveFilters ? filteredProjects : projects;

    if (projectsToOptimize.length === 0) {
      toast({
        title: "No projects to optimize",
        description: "Add some projects or adjust filters before using the AI sequencer.",
        variant: "destructive"
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await getOptimalSequence(projectsToOptimize, teamAvailability);
        
        const projectMap = new Map(projects.map(p => [p.name, p]));
        
        const sortedOptimizedProjects = result.optimalSequence
            .map(name => projectMap.get(name))
            .filter(Boolean) as Project[];
        
        const remainingOptimizedProjects = projectsToOptimize.filter(p => !result.optimalSequence.includes(p.name));
        const unoptimizedProjects = projects.filter(p => !projectsToOptimize.find(optP => optP.id === p.id));
        
        const newProjectList = [
            ...sortedOptimizedProjects, 
            ...remainingOptimizedProjects,
            ...unoptimizedProjects
        ];

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

  const clearFilters = () => {
    setSelectedTeams([]);
    setSelectedOwners([]);
    setSelectedImpacts([]);
    setSelectedSupport([]);
    setSelectedDependencies([]);
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-center">VisionBoard</h1>
        <p className="text-center text-muted-foreground mt-2">
          Visualize your project roadmap and optimize with AI.
        </p>
      </header>
      
      {/* Edit Project Dialog - controlled, no visible trigger */}
      <AddProjectDialog
          onSave={handleProjectSave}
          projectToEdit={projectToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
      >
          <span />
      </AddProjectDialog>


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
            <div className="w-full md:w-auto pt-0 md:pt-8">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-grow flex flex-col gap-2">
                    <AddProjectDialog onSave={handleProjectSave}>
                      <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Project
                      </Button>
                    </AddProjectDialog>
                    <Button onClick={handleOptimize} disabled={isPending || projects.length === 0} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    Optimize {hasActiveFilters ? `${filteredProjects.length} ` : ''}with AI
                    </Button>
                  </div>
                  <div className="flex-grow flex flex-col gap-2">
                    <ImportCsvDialog onProjectsAdd={handleCsvImport} />
                    <ExportCsvButton projects={projects} />
                  </div>
                </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div>
            <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-lg font-semibold font-headline">Filters</h3>
                <MultiSelectFilter
                    label="Teams"
                    options={allTeams}
                    selectedValues={selectedTeams}
                    onSelectedValuesChange={setSelectedTeams}
                />
                 <MultiSelectFilter
                    label="Impact"
                    options={allImpacts}
                    selectedValues={selectedImpacts}
                    onSelectedValuesChange={setSelectedImpacts}
                />
                <MultiSelectFilter
                    label="Owner"
                    options={allOwners}
                    selectedValues={selectedOwners}
                    onSelectedValuesChange={setSelectedOwners}
                />
                 <MultiSelectFilter
                    label="Support"
                    options={allSupport}
                    selectedValues={selectedSupport}
                    onSelectedValuesChange={setSelectedSupport}
                />
                <MultiSelectFilter
                    label="Dependencies"
                    options={allDependencies}
                    selectedValues={selectedDependencies}
                    onSelectedValuesChange={setSelectedDependencies}
                />
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="text-sm">
                        Clear Filters
                    </Button>
                )}
            </div>
            {hasActiveFilters && (
                <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {projects.length} projects.
                </div>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:w-[400px]">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <Timeline projects={filteredProjects} onProjectDelete={handleProjectDelete} onProjectEdit={handleProjectEdit} onProjectMove={handleProjectMove} />
          </TabsContent>
          <TabsContent value="table">
            <ProjectTable projects={filteredProjects} onProjectEdit={handleProjectEdit} onProjectDelete={handleProjectDelete} />
          </TabsContent>
        </Tabs>


        <div className="mt-8 bg-card p-6 rounded-lg shadow-sm">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold font-headline">Resource Load</h2>
                <p className="text-muted-foreground text-sm">Number of projects assigned per owner each month.</p>
              </div>
              <MultiSelectFilter
                  label="Filter Owners"
                  options={allOwners}
                  selectedValues={selectedOwnersForChart}
                  onSelectedValuesChange={setSelectedOwnersForChart}
              />
           </div>
          <ResourceLoadChart projects={filteredProjects} selectedOwners={selectedOwnersForChart}/>
        </div>

      </main>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>Use the AI to find the optimal sequence. Click on a project to see details.</p>
      </footer>
    </div>
  );
}
