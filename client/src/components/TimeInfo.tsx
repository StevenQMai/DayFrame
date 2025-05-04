import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTotalDuration } from "@/lib/taskHelpers";
import { CheckIcon, AlertCircleIcon, Clock, PieChart, BarChart4, LayoutGrid } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TimeInfoProps = {
  tasks: Task[];
  isLoading: boolean;
};

export default function TimeInfo({ tasks, isLoading }: TimeInfoProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"pie" | "bars">("pie");
  
  // Calculate total duration for all tasks
  const totalDuration = getTotalDuration(tasks);
  const isBalanced = Math.abs(totalDuration - 24) < 0.01; // Allow small floating point errors
  const remainingHours = Math.max(0, 24 - totalDuration).toFixed(1);
  
  // Group similar tasks (e.g., all eating tasks)
  const groupedTasks = tasks.reduce<Record<string, { color: string; duration: number; percent: number }>>((acc, task) => {
    // Check if this is an eating-related task
    if (
      task.name.toLowerCase().includes("breakfast") || 
      task.name.toLowerCase().includes("lunch") || 
      task.name.toLowerCase().includes("dinner") ||
      task.name.toLowerCase().includes("eating")
    ) {
      if (!acc["Eating"]) {
        acc["Eating"] = { color: task.color, duration: 0, percent: 0 };
      }
      acc["Eating"].duration += Number(task.duration);
    } 
    // Otherwise use the task name as the key
    else {
      if (!acc[task.name]) {
        acc[task.name] = { color: task.color, duration: 0, percent: 0 };
      }
      acc[task.name].duration += Number(task.duration);
    }
    return acc;
  }, {});
  
  // Calculate percentages
  Object.values(groupedTasks).forEach(task => {
    task.percent = (task.duration / 24) * 100;
  });
  
  const groupedTasksArray = Object.entries(groupedTasks)
    .map(([name, details]) => ({
      name,
      color: details.color,
      duration: details.duration,
      percent: details.percent
    }))
    .sort((a, b) => b.duration - a.duration); // Sort by duration (descending)
  
  // Add 'Unallocated' if not 24 hours
  if (!isBalanced && totalDuration < 24) {
    groupedTasksArray.push({
      name: "Unallocated",
      color: "#e5e7eb", // gray-200
      duration: 24 - totalDuration,
      percent: ((24 - totalDuration) / 24) * 100
    });
  }
  
  // Create pie chart on component mount
  useEffect(() => {
    if (chartRef.current && !isLoading && tasks.length > 0 && viewMode === "pie") {
      // Clear any existing content
      chartRef.current.innerHTML = '';
      
      const size = 140;
      const radius = size / 2;
      const centerX = radius;
      const centerY = radius;
      
      // Create SVG element
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", size.toString());
      svg.setAttribute("height", size.toString());
      svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
      chartRef.current.appendChild(svg);
      
      // Calculate the start angle for each segment
      let startAngle = 0;
      
      // Draw pie segments
      groupedTasksArray.forEach(task => {
        const angle = (task.percent / 100) * 360;
        const endAngle = startAngle + angle;
        
        // Convert to radians
        const startRad = (startAngle - 90) * Math.PI / 180; // -90 to start at top
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        // Calculate arc points
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        const endX = centerX + radius * Math.cos(endRad);
        const endY = centerY + radius * Math.sin(endRad);
        
        // Determine if this is a large arc
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        // Create path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `
          M ${centerX},${centerY}
          L ${startX},${startY}
          A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}
          Z
        `);
        path.setAttribute("fill", task.color);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        path.setAttribute("title", `${task.name}: ${task.duration}h`);
        
        // Add hover effect
        path.addEventListener("mouseenter", () => {
          path.setAttribute("opacity", "0.8");
          path.setAttribute("stroke-width", "2");
          
          // Show tooltip with task name and duration
          const tooltip = document.createElement("div");
          tooltip.id = "chart-tooltip";
          tooltip.style.position = "absolute";
          tooltip.style.backgroundColor = "white";
          tooltip.style.borderRadius = "4px";
          tooltip.style.padding = "4px 8px";
          tooltip.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          tooltip.style.fontSize = "12px";
          tooltip.style.zIndex = "10";
          tooltip.style.pointerEvents = "none";
          tooltip.innerHTML = `<div style="display:flex;align-items:center;gap:4px;">
            <div style="width:8px;height:8px;border-radius:9999px;background-color:${task.color}"></div>
            <b>${task.name}</b>
          </div>
          <div style="font-size:10px;color:#666;">${task.duration.toFixed(1)} hours (${task.percent.toFixed(0)}%)</div>`;
          
          document.body.appendChild(tooltip);
          
          // Position tooltip near the mouse
          document.addEventListener("mousemove", positionTooltip);
          
          function positionTooltip(e: MouseEvent) {
            if (tooltip) {
              tooltip.style.left = `${e.pageX + 10}px`;
              tooltip.style.top = `${e.pageY + 10}px`;
            }
          }
        });
        
        path.addEventListener("mouseleave", () => {
          path.setAttribute("opacity", "1");
          path.setAttribute("stroke-width", "1");
          
          // Remove tooltip
          const tooltip = document.getElementById("chart-tooltip");
          if (tooltip) {
            document.body.removeChild(tooltip);
            document.removeEventListener("mousemove", function() {});
          }
        });
        
        svg.appendChild(path);
        
        // Update start angle for next segment
        startAngle = endAngle;
      });
      
      // Add center circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", centerX.toString());
      circle.setAttribute("cy", centerY.toString());
      circle.setAttribute("r", (radius * 0.55).toString());
      circle.setAttribute("fill", "#fff");
      circle.setAttribute("stroke", "#e2e8f0");
      circle.setAttribute("stroke-width", "1.5");
      svg.appendChild(circle);
      
      // Add center text (24h)
      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      // Hours text
      const hoursText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      hoursText.setAttribute("x", centerX.toString());
      hoursText.setAttribute("y", (centerY - 5).toString());
      hoursText.setAttribute("text-anchor", "middle");
      hoursText.setAttribute("dominant-baseline", "middle");
      hoursText.setAttribute("font-size", "16");
      hoursText.setAttribute("font-weight", "600");
      hoursText.setAttribute("fill", "#475569");
      hoursText.textContent = totalDuration.toFixed(1);
      
      // "h" label
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("x", centerX.toString());
      labelText.setAttribute("y", (centerY + 10).toString());
      labelText.setAttribute("text-anchor", "middle");
      labelText.setAttribute("dominant-baseline", "middle");
      labelText.setAttribute("font-size", "10");
      labelText.setAttribute("font-weight", "400");
      labelText.setAttribute("fill", "#94a3b8");
      labelText.textContent = "hours";
      
      textGroup.appendChild(hoursText);
      textGroup.appendChild(labelText);
      svg.appendChild(textGroup);
    }
  }, [tasks, isLoading, viewMode, groupedTasksArray, totalDuration]);
  
  if (isLoading) {
    return (
      <Card className="mt-6 w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          
          <Skeleton className="h-4 w-full mt-6 mb-4" />
          
          <div className="mt-4 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div className="flex items-center" key={i}>
                <Skeleton className="w-3 h-3 rounded-full mr-2" />
                <Skeleton className="h-4 w-24 flex-grow" />
                <Skeleton className="h-4 w-10 ml-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6 bg-white rounded-lg shadow-md w-full max-w-2xl overflow-hidden">
      <CardHeader className="pb-0 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-primary" />
              Time Distribution
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Analysis of your 24-hour schedule</p>
          </div>
          
          <div className="flex gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-md bg-gray-100 p-0.5 text-gray-600">
              <button 
                className={`p-1.5 rounded-md ${viewMode === 'pie' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('pie')}
              >
                <PieChart className="w-3.5 h-3.5" />
              </button>
              <button 
                className={`p-1.5 rounded-md ${viewMode === 'bars' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('bars')}
              >
                <BarChart4 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Status indicator */}
            {isBalanced ? (
              <div className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center border border-green-100">
                <CheckIcon className="w-3 h-3 mr-1" />
                <span>24h balanced</span>
              </div>
            ) : (
              <div className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center border border-amber-100">
                <AlertCircleIcon className="w-3 h-3 mr-1" />
                <span>{totalDuration.toFixed(1)}/24h allocated</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className={`flex ${viewMode === 'pie' ? 'flex-row' : 'flex-col'}`}>
          {/* Pie chart */}
          {tasks.length > 0 && viewMode === "pie" && (
            <div className={`${viewMode === 'pie' ? 'mr-6 flex-shrink-0' : 'mb-4'}`} style={{ width: "140px", height: "140px" }}>
              <div ref={chartRef} className="w-full h-full"></div>
            </div>
          )}
          
          {/* Bar graph list */}
          <div className={`${viewMode === 'pie' ? 'flex-grow' : 'w-full'} space-y-1`}>
            {groupedTasksArray.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-100">
                <LayoutGrid className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="font-medium text-gray-600">No tasks available</p>
                <p className="text-xs mt-1">Add tasks to see your time allocation</p>
              </div>
            ) : (
              <>
                {/* Progress bars */}
                {groupedTasksArray.map((task, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: task.color }}></div>
                        <span className="text-sm font-medium text-gray-700">{task.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600">{task.duration.toFixed(1)}h</span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-1.5 rounded-sm">
                          {task.percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${task.percent}%`, 
                          backgroundColor: task.color 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {!isBalanced && totalDuration < 24 && (
                  <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center text-gray-600 text-sm">
                      <span className="font-medium">Remaining time</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        {remainingHours}h ({((24 - totalDuration) / 24 * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
