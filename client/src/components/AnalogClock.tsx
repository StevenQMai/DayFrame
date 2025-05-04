import { useState, useEffect } from "react";
import { Task } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateTaskArc } from "@/lib/clockHelpers";
import { formatTimeDisplay } from "@/lib/taskHelpers";

type AnalogClockProps = {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (taskId: number) => void;
};

export default function AnalogClock({ tasks, isLoading, onTaskClick }: AnalogClockProps) {
  const [clockSize, setClockSize] = useState(Math.min(window.innerWidth * 0.8, 550));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [estTimeString, setEstTimeString] = useState("");
  
  // Format time as EST (Eastern Standard Time)
  const formatTimeInEST = (date: Date): { hours: number, minutes: number, seconds: number, timeString: string } => {
    // Convert to EST time string
    const estTimeStr = date.toLocaleTimeString('en-US', { 
      timeZone: 'America/New_York',
      hour12: false
    });
    
    // Parse the EST time components
    const [timeStr, ampm] = estTimeStr.split(' ');
    const [hoursStr, minutesStr, secondsStr] = timeStr.split(':');
    
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    
    // Format nicely for display
    const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return { 
      hours, 
      minutes, 
      seconds,
      timeString: displayTime
    };
  };
  
  // Update clock size on window resize
  useEffect(() => {
    const handleResize = () => {
      setClockSize(Math.min(window.innerWidth * 0.8, 550));
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Update current time every second for smooth movement and use EST timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update EST time string
      const estTime = formatTimeInEST(now);
      setEstTimeString(estTime.timeString);
      
      // Log for debugging
      console.log(`EST Time: ${estTime.hours}:${estTime.minutes}:${estTime.seconds}`);
    };
    
    // Initial update
    updateTime();
    
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Get the time in Eastern Standard Time
  const estTime = formatTimeInEST(currentTime);
  const hours = estTime.hours;
  const minutes = estTime.minutes;
  const seconds = estTime.seconds;
  
  // 24-hour time indicator (complete rotation in 24 hours)
  const timeIn24Hours = hours + minutes / 60 + seconds / 3600;
  const time24HourAngle = (timeIn24Hours / 24) * 360 - 90; // -90 to start at top
  
  // 12-hour hand (complete rotation in 12 hours) - more traditional clock hand
  const timeIn12Hours = hours % 12 + minutes / 60 + seconds / 3600;
  const hourHandAngle = (timeIn12Hours / 12) * 360 - 90;
  
  // Minute hand (complete rotation in 60 minutes)
  const minuteHandAngle = (minutes / 60) * 360 + (seconds / 60) * 6 - 90;
  
  if (isLoading) {
    return (
      <div className="clock-container relative" style={{ width: clockSize, height: clockSize }}>
        <Skeleton className="w-full h-full rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="clock-container relative flex justify-center items-center" style={{ width: clockSize, height: clockSize }}>
      {/* Outer ring with hour markers */}
      <div className="absolute inset-0 rounded-full bg-gray-50 shadow-md border border-gray-200">
        {/* Hour markers (24-hour) */}
        {Array.from({ length: 24 }, (_, i) => {
          // For better alignment, we start at the top (0 degrees = 12 o'clock position)
          // and move clockwise
          const hourPosition = i;
          const angle = (hourPosition / 24) * 360;
          const rad = (angle - 90) * Math.PI / 180; // -90 to start at top
          const outerRadius = clockSize / 2;
          
          // Determine marker type (major for every 3 hours, medium for others)
          const isMajor = i % 3 === 0;
          const markerLength = isMajor ? 12 : 8;
          const innerRadius = outerRadius - markerLength;
          
          // Calculate tick mark coordinates
          const outerX = Math.cos(rad) * outerRadius + outerRadius;
          const outerY = Math.sin(rad) * outerRadius + outerRadius;
          const innerX = Math.cos(rad) * (outerRadius - markerLength) + outerRadius;
          const innerY = Math.sin(rad) * (outerRadius - markerLength) + outerRadius;
          
          // Calculate text position (slightly inward from tick marks)
          const textRadius = innerRadius - 16;
          const textX = Math.cos(rad) * textRadius + outerRadius;
          const textY = Math.sin(rad) * textRadius + outerRadius;
          
          return (
            <div key={i} className="absolute">
              {/* Hour marker line - using SVG for better precision */}
              <svg 
                width={clockSize} 
                height={clockSize} 
                className="absolute top-0 left-0 pointer-events-none"
              >
                <line
                  x1={outerX}
                  y1={outerY}
                  x2={innerX}
                  y2={innerY}
                  stroke={isMajor ? "#4b5563" : "#9ca3af"}
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Show all hour numbers */}
              <div 
                className={`absolute ${isMajor ? 'text-sm font-semibold text-gray-800' : 'text-xs font-medium text-gray-600'}`}
                style={{
                  left: textX,
                  top: textY,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {i}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inner clock face */}
      <div className="absolute rounded-full bg-white shadow-lg border border-gray-200"
           style={{ width: clockSize * 0.85, height: clockSize * 0.85, left: clockSize * 0.075, top: clockSize * 0.075 }}>
        
        {/* Task segments */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            {tasks.map((task) => {
              const { path } = calculateTaskArc(task);
              return (
                <path
                  key={task.id}
                  d={path}
                  fill={task.isTimerActive ? task.color : task.color}
                  fillOpacity={task.isTimerActive ? 0.85 : 0.7} 
                  stroke={task.isTimerActive ? "#FFF" : "#FFF"}
                  strokeWidth={task.isTimerActive ? "0.8" : "0.5"}
                  className={`cursor-pointer transition-opacity ${
                    task.isTimerActive ? 'animate-pulse-subtle' : 'hover:opacity-80'
                  }`}
                  onClick={() => onTaskClick(task.id)}
                  onMouseEnter={() => setHoveredTask(task)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  {/* Add pulsing effect for active timer */}
                  {task.isTimerActive && (
                    <animate 
                      attributeName="fill-opacity" 
                      values="0.85;0.65;0.85" 
                      dur="2s" 
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              );
            })}
          </svg>
        </div>
        
        {/* Minute hand (traditional clock display) */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 w-[43%] h-1 bg-gray-400 origin-left z-10 rounded-full"
            style={{ 
              transform: `translateX(-1px) translateY(-50%) rotate(${minuteHandAngle}deg)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)' 
            }}
          >
            <div className="absolute right-0 -top-1 h-2 w-2 rounded-full bg-gray-400"></div>
          </div>
        </div>
        
        {/* Hour hand (traditional clock display) */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 w-[30%] h-1.5 bg-gray-700 origin-left z-15 rounded-full"
            style={{ 
              transform: `translateX(-1px) translateY(-50%) rotate(${hourHandAngle}deg)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
            }}
          >
            <div className="absolute right-0 -top-1 h-3 w-3 rounded-full bg-gray-700"></div>
          </div>
        </div>
        
        {/* 24-hour time indicator (primary function) */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 w-[48%] h-0.5 bg-blue-600 origin-left z-20"
            style={{ 
              transform: `translateX(-1px) translateY(-50%) rotate(${time24HourAngle}deg)` 
            }}
          >
            <div className="absolute right-0 -top-1.5 h-3 w-3 rounded-full bg-blue-600 shadow-md"></div>
            <div className="absolute right-0 -top-1 h-2 w-2 rounded-full bg-white"></div>
          </div>
        </div>

        {/* Clock center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-gray-700 shadow-md z-30 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">24h</span>
        </div>
        
        {/* Small dots at each hour position for better readability */}
        <div className="absolute inset-0">
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * 360;
            const rad = (angle - 90) * Math.PI / 180; // -90 to start at top
            const radius = (clockSize * 0.85) / 2;
            const dotRadius = radius - 10;
            
            // Calculate dot position
            const dotX = Math.cos(rad) * dotRadius + radius;
            const dotY = Math.sin(rad) * dotRadius + radius;
            
            // Determine if this is a major hour (0, 3, 6, 9, 12, 15, 18, 21)
            const isMajor = i % 3 === 0;
            
            return (
              <div 
                key={`dot-${i}`}
                className={`absolute rounded-full ${isMajor ? 'w-1.5 h-1.5 bg-gray-400' : 'w-1 h-1 bg-gray-300'}`}
                style={{
                  left: dotX,
                  top: dotY,
                  transform: "translate(-50%, -50%)"
                }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Current time display with EST indicator */}
      <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-200 z-40 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-700">
          {estTimeString}
        </span>
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
          EST
        </span>
      </div>
      
      {/* Task info tooltip */}
      {hoveredTask && (
        <div 
          className="absolute bg-white shadow-lg rounded-md p-3 border border-gray-200 z-50 text-sm pointer-events-none transition-opacity opacity-95"
          style={{ 
            top: clockSize / 2 + 10, 
            left: clockSize / 2,
            transform: "translateX(-50%)",
            maxWidth: "220px"
          }}
        >
          <div className="font-medium text-gray-800 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredTask.color }}></div>
            {hoveredTask.name}
            {hoveredTask.isTimerActive && (
              <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1 font-semibold">
            {formatTimeDisplay(hoveredTask).startTimeDisplay} - {formatTimeDisplay(hoveredTask).endTimeDisplay}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Duration: {hoveredTask.duration} hours
          </div>
          
          {/* Timer information when active */}
          {hoveredTask.isTimerActive && hoveredTask.timerStartedAt && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs font-medium text-green-700 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                Timer Active
              </div>
              
              <div className="text-xs text-gray-600 mt-1">
                {(() => {
                  const now = Date.now();
                  const elapsed = now - hoveredTask.timerStartedAt;
                  const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
                  const hours = Math.floor(elapsedMinutes / 60);
                  const minutes = elapsedMinutes % 60;
                  
                  return (
                    <span>
                      Elapsed: {hours > 0 ? `${hours}h ` : ''}{minutes}m
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
