import { useState } from "react";
import { Clock, Download, Info, Settings, HelpCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

type HeaderProps = {
  onSave: () => void;
}

export default function Header({ onSave }: HeaderProps) {
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    // In a real app, would implement actual theme switching here
  };
  
  const handleSave = () => {
    // In a real app, this would save the data to localStorage or export as JSON
    onSave();
    
    // Create downloadable data
    const element = document.createElement("a");
    const file = new Blob(
      [JSON.stringify({ savedAt: new Date().toISOString(), message: "Your schedule has been saved!" })], 
      { type: "application/json" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `chronotask-schedule-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Clock className="text-primary text-2xl mr-2" />
          <h1 className="text-xl font-semibold text-dark">
            Chrono<span className="text-primary">Task</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="default"
            size="sm"
            className="flex items-center"
            onClick={handleSave}
          >
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Save Schedule</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)} className="cursor-pointer">
                <Info className="mr-2 h-4 w-4" />
                <span>About</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About ChronoTask</DialogTitle>
            <DialogDescription>
              ChronoTask is a 24-hour task management application with an interactive analog clock interface for visualizing and managing daily time allocations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Version 1.0.0
            </p>
            <h4 className="font-medium text-sm">Key Features:</h4>
            <ul className="text-sm text-gray-500 list-disc ml-5 space-y-1">
              <li>Visual 24-hour clock interface for time management</li>
              <li>Auto-adjusting tasks to maintain 24-hour balance</li>
              <li>Detailed time tracking and analysis</li>
              <li>Custom color coding for different activities</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
