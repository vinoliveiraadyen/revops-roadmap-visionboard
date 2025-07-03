
"use client";

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { eachMonthOfInterval, endOfMonth, format, getYear, parseISO, startOfMonth, startOfYear, endOfYear } from 'date-fns';

export function ResourceLoadChart({ projects }: { projects: Project[] }) {
    const { chartData, allResources, year } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { chartData: [], allResources: [], year: new Date().getFullYear() };
        }

        const resourcesSet = new Set<string>();
        projects.forEach(p => {
            p.resources.split(',').forEach(r => {
                const trimmed = r.trim();
                if(trimmed) resourcesSet.add(trimmed);
            });
        });
        const allResources = [...resourcesSet].sort();

        // Use the year of the first project as the display year for the chart
        const displayYear = getYear(parseISO(projects[0].startDate));

        const months = eachMonthOfInterval({
            start: startOfYear(new Date(displayYear, 0, 1)),
            end: endOfYear(new Date(displayYear, 11, 31))
        });

        const data = months.map(month => {
            const monthData: { name: string; [key: string]: number | string } = {
                name: format(month, 'MMM'),
            };

            // Initialize all resources with 0 for this month
            allResources.forEach(resource => {
                monthData[resource] = 0;
            });

            projects.forEach(project => {
                try {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);

                    if (projectStart <= monthEnd && projectEnd >= monthStart) {
                        project.resources.split(',').map(r => r.trim()).forEach(resource => {
                            if (monthData.hasOwnProperty(resource)) {
                                (monthData[resource] as number) += 1;
                            }
                        });
                    }
                } catch(e) {
                    console.error("Invalid date for project:", project.name, e);
                }
            });

            return monthData;
        });

        return { chartData: data, allResources, year: displayYear };
    }, [projects]);
    
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        allResources.forEach((resource, index) => {
            config[resource] = {
                label: resource,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });
        return config as ChartConfig;
    }, [allResources]);

    if (chartData.length === 0 || allResources.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Resource Load - {year}</CardTitle>
                    <CardDescription>Number of projects assigned per resource each month.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">
                        No projects to display. Try adjusting filters or adding projects.
                    </p>
                </CardContent>
             </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Load - {year}</CardTitle>
                <CardDescription>Number of projects assigned per resource each month.</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <ChartLegend content={<ChartLegendContent />} />
                        {allResources.map((resource) => (
                            <Bar
                                key={resource}
                                dataKey={resource}
                                stackId="a"
                                fill={`var(--color-${resource})`}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
