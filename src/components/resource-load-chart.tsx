
"use client";

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { eachMonthOfInterval, endOfMonth, format, getYear, parseISO, startOfMonth, startOfYear, endOfYear } from 'date-fns';

const sanitizeForCssIdentifier = (name: string) => {
    // Replaces all non-alphanumeric characters with underscores to ensure a valid CSS identifier.
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}

export function ResourceAllocationChart({ projects, selectedAssignees }: { projects: Project[]; selectedAssignees?: string[] }) {
    const { chartData, assigneesToDisplay, year } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { chartData: [], assigneesToDisplay: [], year: new Date().getFullYear() };
        }

        const assigneesSet = new Set<string>();
        projects.forEach(p => {
            p.assignee.split(',').forEach(r => {
                const trimmed = r.trim();
                if(trimmed) assigneesSet.add(trimmed);
            });
        });
        const allAssignees = [...assigneesSet].sort();

        const assigneesToDisplay = selectedAssignees && selectedAssignees.length > 0 
            ? allAssignees.filter(o => selectedAssignees.includes(o)) 
            : allAssignees;

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

            // Initialize all sanitized assignees with 0 for this month
            assigneesToDisplay.forEach(assignee => {
                monthData[sanitizeForCssIdentifier(assignee)] = 0;
            });

            projects.forEach(project => {
                try {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);

                    if (projectStart <= monthEnd && projectEnd >= monthStart) {
                        project.assignee.split(',').map(r => r.trim()).forEach(assignee => {
                            if (!assignee) return;
                            const sanitizedAssignee = sanitizeForCssIdentifier(assignee);
                            if (monthData.hasOwnProperty(sanitizedAssignee)) {
                                (monthData[sanitizedAssignee] as number) += 1;
                            }
                        });
                    }
                } catch(e) {
                    console.error("Invalid date for project:", project.name, e);
                }
            });

            return monthData;
        });

        return { chartData: data, assigneesToDisplay, year: displayYear };
    }, [projects, selectedAssignees]);
    
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        assigneesToDisplay.forEach((assignee, index) => {
            // Use the sanitized key for the config, but the original name for the label
            config[sanitizeForCssIdentifier(assignee)] = {
                label: assignee,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });
        return config as ChartConfig;
    }, [assigneesToDisplay]);

    if (chartData.length === 0 || assigneesToDisplay.length === 0) {
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
                <ChartLegend content={<ChartLegendContent wrapperStyle={{ display: 'flex', flexWrap: 'wrap' }} />} />
                {assigneesToDisplay.map((assignee) => {
                    const sanitizedAssignee = sanitizeForCssIdentifier(assignee);
                    return (
                        <Bar
                            key={sanitizedAssignee}
                            dataKey={sanitizedAssignee}
                            stackId="a"
                            fill={`var(--color-${sanitizedAssignee})`}
                            radius={[4, 4, 0, 0]}
                        />
                    )
                })}
            </BarChart>
        </ChartContainer>
    );
}
