
"use client";

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { eachMonthOfInterval, endOfMonth, format, getYear, parseISO, startOfMonth, startOfYear, endOfYear } from 'date-fns';

const sanitizeForCssIdentifier = (name: string) => {
    // Replaces all non-alphanumeric characters with underscores to ensure a valid CSS identifier.
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}

export function ResourceAllocationChart({ projects, selectedAssignees, selectedSupport }: { projects: Project[]; selectedAssignees?: string[], selectedSupport?: string[] }) {
    const { chartData, peopleToDisplay, year } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { chartData: [], peopleToDisplay: [], year: new Date().getFullYear() };
        }

        const assigneesSet = new Set<string>();
        const supportSet = new Set<string>();
        projects.forEach(p => {
            p.assignee?.split(',').forEach(r => {
                const trimmed = r.trim();
                if(trimmed) assigneesSet.add(trimmed);
            });
            p.support?.split(',').forEach(s => {
                const trimmed = s.trim();
                if(trimmed) supportSet.add(trimmed);
            });
        });
        const allAssignees = [...assigneesSet].sort();
        const allSupport = [...supportSet].sort();

        const assigneesToDisplay = selectedAssignees && selectedAssignees.length > 0 
            ? allAssignees.filter(o => selectedAssignees.includes(o)) 
            : allAssignees;
            
        const supportToDisplay = selectedSupport && selectedSupport.length > 0
            ? allSupport.filter(s => selectedSupport.includes(s))
            : allSupport;

        const peopleToDisplay = [
            ...assigneesToDisplay.map(name => ({name, type: 'assignee'})),
            ...supportToDisplay.map(name => ({name, type: 'support'}))
        ];

        const firstProjectWithDate = projects.find(p => p.startDate);
        const displayYear = firstProjectWithDate ? getYear(parseISO(firstProjectWithDate.startDate)) : new Date().getFullYear();

        const months = eachMonthOfInterval({
            start: startOfYear(new Date(displayYear, 0, 1)),
            end: endOfYear(new Date(displayYear, 11, 31))
        });

        const data = months.map(month => {
            const monthData: { name: string; [key: string]: number | string } = {
                name: format(month, 'MMM'),
            };

            // Initialize all sanitized people with 0 for this month
            peopleToDisplay.forEach(person => {
                monthData[sanitizeForCssIdentifier(`${person.name}_${person.type}`)] = 0;
            });

            projects.forEach(project => {
                try {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);

                    if (projectStart <= monthEnd && projectEnd >= monthStart) {
                        project.assignee?.split(',').map(r => r.trim()).forEach(assignee => {
                            if (!assignee) return;
                            const sanitizedKey = sanitizeForCssIdentifier(`${assignee}_assignee`);
                            if (monthData.hasOwnProperty(sanitizedKey)) {
                                (monthData[sanitizedKey] as number) += 1;
                            }
                        });
                        project.support?.split(',').map(s => s.trim()).forEach(support => {
                            if (!support) return;
                             const sanitizedKey = sanitizeForCssIdentifier(`${support}_support`);
                            if (monthData.hasOwnProperty(sanitizedKey)) {
                                (monthData[sanitizedKey] as number) += 1;
                            }
                        });
                    }
                } catch(e) {
                    console.error("Invalid date for project:", project.name, e);
                }
            });

            return monthData;
        });

        return { chartData: data, peopleToDisplay, year: displayYear };
    }, [projects, selectedAssignees, selectedSupport]);
    
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        const uniqueNames = [...new Set(peopleToDisplay.map(p => p.name))];

        uniqueNames.forEach((name, index) => {
            const assigneeKey = sanitizeForCssIdentifier(`${name}_assignee`);
            const supportKey = sanitizeForCssIdentifier(`${name}_support`);
            
            config[assigneeKey] = {
                label: `${name} (Assignee)`,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
            config[supportKey] = {
                label: `${name} (Support)`,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });

        return config as ChartConfig;
    }, [peopleToDisplay]);

    if (chartData.length === 0 || peopleToDisplay.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground text-center p-4">
                    No project data to display. <br/> Try adjusting filters or adding projects.
                </p>
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                />
                <YAxis 
                    tickMargin={8}
                    allowDecimals={false}
                    fontSize={12}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent wrapperStyle={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} />} />
                {peopleToDisplay.map((person) => {
                    const sanitizedKey = sanitizeForCssIdentifier(`${person.name}_${person.type}`);
                    return (
                        <Bar
                            key={sanitizedKey}
                            dataKey={sanitizedKey}
                            stackId="a"
                            fill={`var(--color-${sanitizedKey})`}
                            radius={[4, 4, 0, 0]}
                        />
                    )
                })}
            </BarChart>
        </ChartContainer>
    );
}
