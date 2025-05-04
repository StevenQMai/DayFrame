import { Task } from "@shared/schema";

// Helper function to convert task to SVG arc path
export function calculateTaskArc(task: Task) {
  const startAngle = (Number(task.startTime) / 24) * 360;
  const endAngle = ((Number(task.startTime) + Number(task.duration)) / 24) * 360;
  
  // Convert to radians
  const startRad = startAngle * Math.PI / 180;
  const endRad = endAngle * Math.PI / 180;
  
  // SVG calculations
  const radius = 50; // SVG viewBox is 100x100, so radius is 50
  const center = { x: 50, y: 50 };
  
  // Start and end points
  const startX = center.x + radius * Math.cos(startRad);
  const startY = center.y + radius * Math.sin(startRad);
  const endX = center.x + radius * Math.cos(endRad);
  const endY = center.y + radius * Math.sin(endRad);
  
  // Flag for large arc (> 180 degrees)
  const largeArcFlag = Number(task.duration) / 24 > 0.5 ? 1 : 0;
  
  // Path data
  const path = [
    `M ${center.x},${center.y}`,
    `L ${startX},${startY}`,
    `A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}`,
    'Z'
  ].join(' ');
  
  return { path, startAngle, endAngle };
}

// Calculate task segment position for a specific time
export function calculateTimePosition(time: number) {
  const angle = (time / 24) * 360 - 90; // -90 to start at top
  const radians = angle * Math.PI / 180;
  
  const radius = 50; // Assuming SVG viewBox is 100x100
  const center = { x: 50, y: 50 };
  
  const x = center.x + radius * Math.cos(radians);
  const y = center.y + radius * Math.sin(radians);
  
  return { x, y, angle };
}
