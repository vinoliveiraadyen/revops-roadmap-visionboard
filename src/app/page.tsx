
"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import type { Project } from "@/lib/types";
import { AddProjectDialog, type ProjectFormValues } from "@/components/add-project-dialog";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getOptimalSequence } from "@/app/actions";
import { Lightbulb, Loader2, Upload, Plus, ListFilter } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays, getYear } from "date-fns";
import { ImportCsvDialog } from "@/components/import-csv-dialog";
import { ExportCsvButton } from "@/components/export-csv-button";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Separator } from "@/components/ui/separator";
import { ResourceAllocationChart } from "@/components/resource-load-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTable, type SortConfig } from "@/components/project-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialProjects: Project[] = [
    { id: 'proj-1', name: 'Initial Planning & Research', epicNumber: 'EPIC-001', revopsTeam: 'Strategy', function: 'High', startDate: '2024-01-15', endDate: '2024-02-28', assignee: 'PM, UX Researcher', support: 'IT', dependencies: '', progress: 100, ragStatus: 'Green' },
    { id: 'proj-2', name: 'Develop Core Features', epicNumber: 'EPIC-002', revopsTeam: 'Engineering', function: 'High', startDate: '2024-03-01', endDate: '2024-06-15', assignee: 'Dev Team A, QA', support: 'Architecture', dependencies: 'Initial Planning & Research', progress: 75, ragStatus: 'Green' },
    { id: 'proj-7', name: 'Mobile App Design', epicNumber: 'EPIC-007', revopsTeam: 'Design', function: 'Medium', startDate: '2024-02-01', endDate: '2024-04-30', assignee: 'UI/UX Designer', support: 'Design System Team', dependencies: 'Initial Planning & Research', progress: 90, ragStatus: 'Amber' },
    { id: 'proj-6', name: 'API Integration', epicNumber: 'EPIC-006', revopsTeam: 'GTMO Commercial', function: 'Medium', startDate: '2024-04-15', endDate: '2024-05-30', assignee: 'Dev Team A', support: 'DevOps', dependencies: 'Develop Core Features', progress: 50, ragStatus: 'Red' },
    { id: 'proj-3', name: 'User Testing & Feedback', epicNumber: 'EPIC-003', revopsTeam: 'QA & UX', function: 'Medium', startDate: '2024-06-16', endDate: '2024-07-31', assignee: 'Test Group, UX Designer', support: 'Analytics', dependencies: 'Develop Core Features', progress: 20, ragStatus: 'Green' },
    { id: 'proj-4', name: 'Marketing Launch Campaign', epicNumber: 'EPIC-004', revopsTeam: 'Marketing', function: 'High', startDate: '2024-08-01', endDate: '2024-09-15', assignee: 'Marketing Team', support: 'Sales', dependencies: 'Develop Core Features', progress: 0, ragStatus: 'Green' },
    { id: 'proj-5', name: 'Q4 Feature Enhancements', epicNumber: 'EPIC-005', revopsTeam: 'Salesforce Commercial', function: 'Low', startDate: '2024-10-01', endDate: '2024-11-30', assignee: 'Dev Team B', support: 'Architecture', dependencies: 'User Testing & Feedback', progress: 0, ragStatus: 'Amber' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [teamAvailability, setTeamAvailability] = useState("All teams are available with standard capacity. Marketing team has reduced capacity in June due to annual conference.");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedSupport, setSelectedSupport] = useState<string[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectedRagStatus, setSelectedRagStatus] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'progress', direction: 'descending' });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  const [selectedAssigneesForChart, setSelectedAssigneesForChart] = useState<string[]>([]);
  const [selectedSupportForChart, setSelectedSupportForChart] = useState<string[]>([]);

  const { allTeams, allFunctions, allAssignees, allSupport, allDependencies, allYears, allRagStatuses } = useMemo(() => {
    const teamsSet = new Set<string>();
    const functionsSet = new Set<string>();
    const assigneesSet = new Set<string>();
    const supportSet = new Set<string>();
    const dependenciesSet = new Set<string>();
    const yearsSet = new Set<number>();
    const ragStatusSet = new Set<string>();

    for (const project of projects) {
      if (project.revopsTeam) teamsSet.add(project.revopsTeam);
      project.function?.split(',').forEach(i => {
        const trimmed = i.trim();
        if (trimmed) functionsSet.add(trimmed);
      });
      project.assignee?.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed) assigneesSet.add(trimmed);
      });
      project.support?.split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) supportSet.add(s.trim());
      });
      project.dependencies?.split(',').forEach(d => {
        const trimmed = d.trim();
        if (trimmed && trimmed.toLowerCase() !== 'none') dependenciesSet.add(trimmed);
      });
      if (project.ragStatus) ragStatusSet.add(project.ragStatus);

      try {
        if (project.startDate) yearsSet.add(getYear(parseISO(project.startDate)));
        if (project.endDate) yearsSet.add(getYear(parseISO(project.endDate)));
      } catch (e) { /* ignore invalid dates */ }
    }
    
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }

    return {
      allTeams: [...teamsSet].sort(),
      allFunctions: [...functionsSet].sort(),
      allAssignees: [...assigneesSet].sort(),
      allSupport: [...supportSet].sort(),
      allDependencies: [...dependenciesSet].sort(),
      allYears: Array.from(yearsSet).sort((a, b) => a - b),
      allRagStatuses: ['Green', 'Amber', 'Red'], // Fixed order
    };
  }, [projects]);
  
  useEffect(() => {
    if (allYears.length > 0 && !allYears.includes(selectedYear)) {
      setSelectedYear(allYears[0] || new Date().getFullYear());
    }
  }, [allYears, selectedYear]);

  const hasActiveFilters = selectedTeams.length > 0 || selectedAssignees.length > 0 || selectedFunctions.length > 0 || selectedSupport.length > 0 || selectedDependencies.length > 0 || selectedRagStatus.length > 0;
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        let isYearMatch = false;
        try {
            const startYear = getYear(parseISO(project.startDate));
            const endYear = getYear(parseISO(project.endDate));
            if (startYear <= selectedYear && endYear >= selectedYear) {
                isYearMatch = true;
            }
        } catch (e) {
            isYearMatch = false;
        }

        if (!isYearMatch) {
            return false;
        }

        const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(project.revopsTeam);
        const functionMatch = selectedFunctions.length === 0 || (project.function || "").split(',').map(i => i.trim()).filter(Boolean).some(i => selectedFunctions.includes(i));
        const assigneeMatch = selectedAssignees.length === 0 || (project.assignee || "").split(',').map(r => r.trim()).filter(Boolean).some(r => selectedAssignees.includes(r));
        const supportMatch = selectedSupport.length === 0 || (project.support || "").split(',').map(s => s.trim()).filter(Boolean).some(s => selectedSupport.includes(s));
        const dependencyMatch = selectedDependencies.length === 0 || (project.dependencies || "").split(',').map(d => d.trim()).filter(Boolean).some(d => selectedDependencies.includes(d));
        const ragStatusMatch = selectedRagStatus.length === 0 || (project.ragStatus ? selectedRagStatus.includes(project.ragStatus) : false);

        return teamMatch && functionMatch && assigneeMatch && supportMatch && dependencyMatch && ragStatusMatch;
    });
  }, [projects, selectedYear, selectedTeams, selectedAssignees, selectedFunctions, selectedSupport, selectedDependencies, selectedRagStatus]);
  
  const sortedAndFilteredProjects = useMemo(() => {
    const sortable = [...filteredProjects];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null || aValue === '') return 1;
        if (bValue === undefined || bValue === null || bValue === '') return -1;
        
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
            comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
        }
        else {
            comparison = (aValue as string).localeCompare(bValue as string);
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortable;
  }, [filteredProjects, sortConfig]);

  const handleRequestSort = (key: keyof Project) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const handleProjectSave = (data: ProjectFormValues, projectId?: string) => {
    if (projectId) {
      // Update existing project
      setProjects(prev => prev.map(p => p.id === projectId ? {
        ...p,
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        function: data.function || "",
        assignee: data.assignee || "",
        support: data.support || "",
        dependencies: data.dependencies || "",
        progress: data.progress || 0,
        ragStatus: data.ragStatus || '',
      } : p));
      toast({ title: "Project Updated", description: `"${data.name}" has been successfully updated.` });
    } else {
      // Add new project
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        function: data.function || "",
        assignee: data.assignee || "",
        support: data.support || "",
        dependencies: data.dependencies || "",
        progress: data.progress || 0,
        ragStatus: data.ragStatus || '',
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

  const handleDeleteAllProjects = () => {
    setProjects([]);
    toast({
      title: "All Projects Deleted",
      description: "The project board has been cleared.",
      variant: "destructive",
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
            const duration = differenceInCalendarDays(originalEnd, originalStart);

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
    const projectsToOptimize = filteredProjects;

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
    setSelectedAssignees([]);
    setSelectedFunctions([]);
    setSelectedSupport([]);
    setSelectedDependencies([]);
    setSelectedRagStatus([]);
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-center">VisionBoard</h1>
        <p className="text-center text-muted-foreground mt-2">
          Visualize your project roadmap and optimize with AI.
        </p>
      </header>
      
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
                    Optimize with AI
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
                    label="RevOps Team"
                    options={allTeams}
                    selectedValues={selectedTeams}
                    onSelectedValuesChange={setSelectedTeams}
                />
                 <MultiSelectFilter
                    label="Function"
                    options={allFunctions}
                    selectedValues={selectedFunctions}
                    onSelectedValuesChange={setSelectedFunctions}
                />
                <MultiSelectFilter
                    label="Assignee"
                    options={allAssignees}
                    selectedValues={selectedAssignees}
                    onSelectedValuesChange={setSelectedAssignees}
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
                <MultiSelectFilter
                    label="RAG Status"
                    options={allRagStatuses}
                    selectedValues={selectedRagStatus}
                    onSelectedValuesChange={setSelectedRagStatus}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-auto justify-start">
                      <ListFilter className="mr-2 h-4 w-4" />
                      Year
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="start">
                    <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                      {allYears.map((year) => (
                        <DropdownMenuRadioItem key={year} value={year.toString()}>
                          {year}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="text-sm">
                        Clear Filters
                    </Button>
                )}
            </div>
            {(hasActiveFilters || selectedYear !== new Date().getFullYear()) && (
                <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {projects.length} projects for {selectedYear}.
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
            <Timeline 
              projects={filteredProjects} 
              onProjectDelete={handleProjectDelete} 
              onProjectEdit={handleProjectEdit} 
              onProjectMove={handleProjectMove}
              displayYear={selectedYear}
            />
          </TabsContent>
          <TabsContent value="table">
            <ProjectTable 
              projects={sortedAndFilteredProjects} 
              onProjectEdit={handleProjectEdit} 
              onProjectDelete={handleProjectDelete}
              onDeleteAll={handleDeleteAllProjects}
              sortConfig={sortConfig}
              onSort={handleRequestSort}
            />
          </TabsContent>
        </Tabs>


        <div className="mt-8 bg-card p-6 rounded-lg shadow-sm">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold font-headline">Resource Allocation</h2>
                <p className="text-muted-foreground text-sm">Number of projects assigned per Assignee and Support each month.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MultiSelectFilter
                    label="Filter Assignees"
                    options={allAssignees}
                    selectedValues={selectedAssigneesForChart}
                    onSelectedValuesChange={setSelectedAssigneesForChart}
                />
                <MultiSelectFilter
                    label="Filter Support"
                    options={allSupport}
                    selectedValues={selectedSupportForChart}
                    onSelectedValuesChange={setSelectedSupportForChart}
                />
              </div>
           </div>
          <ResourceAllocationChart 
            projects={filteredProjects} 
            selectedAssignees={selectedAssigneesForChart}
            selectedSupport={selectedSupportForChart}
          />
        </div>

      </main>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>Use the AI to find the optimal sequence. Click on a project to see details.</p>
      </footer>
    </div>
  );
}
