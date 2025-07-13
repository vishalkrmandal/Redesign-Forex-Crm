import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label, Sector } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

interface Partner {
    _id: string;
    userId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
    };
    referralCode: string | null;
    level: number;
    totalVolume: number;
    totalEarned: number;
    createdAt: string;
}

interface PartnerLevelsPieChartProps {
    partners: Partner[];
    theme: 'light' | 'dark';
}

const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#06B6D4', // Cyan
];

const PartnerLevelsPieChart: React.FC<PartnerLevelsPieChartProps> = ({ partners }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [, setIsAnimating] = useState(true);

    // Start animation on mount
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const levelData = useMemo(() => {
        const levelCounts = partners.reduce((acc, partner) => {
            const level = partner.level;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(levelCounts)
            .map(([level, count], index) => ({
                level: `Level ${level}`,
                levelNumber: parseInt(level),
                count,
                percentage: ((count / partners.length) * 100).toFixed(1),
                fill: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => a.levelNumber - b.levelNumber);
    }, [partners]);

    const totalPartners = partners.length;

    const handlePieClick = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.fill }}
                        />
                        <p className="font-semibold text-gray-900 dark:text-white text-base">{data.level}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                            Partners: <span className="font-bold">{data.count}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Percentage: <span className="font-bold">{data.percentage}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }: any) => {
        return (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md ${activeIndex === index ? 'bg-gray-100 dark:bg-gray-700 scale-105 shadow-md' : ''
                            }`}
                        onClick={() => handlePieClick(index)}
                    >
                        <div
                            className="w-3 h-3 rounded-full shadow-sm transition-all duration-300"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Level {entry.payload.levelNumber} ({entry.payload.count})
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Custom active shape inspired by shadcn/ui
    const renderActiveShape = (props: PieSectorDataItem) => {
        const { outerRadius = 0, ...otherProps } = props;
        return (
            <g>
                <Sector {...otherProps} outerRadius={outerRadius + 8} />
                <Sector
                    {...otherProps}
                    outerRadius={outerRadius + 20}
                    innerRadius={outerRadius + 12}
                    fill={props.fill}
                    fillOpacity={0.6}
                />
            </g>
        );
    };

    if (totalPartners === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors duration-300">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Partner Levels Distribution
                    </h3>
                </div>

                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <div className="relative">
                        <Users className="w-20 h-20 mb-4 opacity-30 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                    </div>
                    <p className="text-lg font-medium mb-2">No Partners Yet</p>
                    <p className="text-sm text-center max-w-xs">
                        Start referring partners to see the level distribution here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors duration-300">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Partner Levels Distribution
                    </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{totalPartners} Total Partners</span>
                </div>
            </div>

            <div className="relative h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={levelData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={55}
                            paddingAngle={2}
                            dataKey="count"
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                            onClick={(_, index) => handlePieClick(index)}
                            activeIndex={activeIndex !== null ? activeIndex : undefined}
                            activeShape={renderActiveShape}
                            strokeWidth={0}
                        >
                            {levelData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                                />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        const selectedData = activeIndex !== null ? levelData[activeIndex] : null;
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="transition-all duration-500"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-gray-900 dark:fill-white text-3xl font-bold"
                                                >
                                                    {selectedData ? selectedData.count.toLocaleString() : totalPartners.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-gray-600 dark:fill-gray-400 text-sm"
                                                >
                                                    {selectedData ? selectedData.level : 'Total Partners'}
                                                </tspan>
                                                {selectedData && (
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 40}
                                                        className="fill-gray-500 dark:fill-gray-500 text-xs"
                                                    >
                                                        {selectedData.percentage}%
                                                    </tspan>
                                                )}
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Most Active Level</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {levelData.length > 0 ? levelData.reduce((prev, current) =>
                            (prev.count > current.count) ? prev : current
                        ).level : 'N/A'}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Levels</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {levelData.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartnerLevelsPieChart;