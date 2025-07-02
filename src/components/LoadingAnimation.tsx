
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Search, Github, Globe, Zap, CheckCircle, AlertCircle, Wifi, Shield, Clock } from "lucide-react";

interface LoadingAnimationProps {
  domain: string;
}

export const LoadingAnimation = ({ domain }: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Initializing comprehensive scan...");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState("preparation");

  const tasks = [
    "Initializing comprehensive scan...",
    "Validating domain structure...",
    "Checking domain accessibility...",
    "Preparing GitHub search queries...",
    "Preparing Google search queries...",
    "Executing GitHub repository scan...",
    "Analyzing code patterns and secrets...",
    "Performing Google OSINT searches...",
    "Processing pastebin and leak sites...",
    "Evaluating security risk levels...",
    "Generating detailed analysis report...",
    "Finalizing scan results..."
  ];

  const phases = [
    { name: "preparation", icon: Search, color: "text-cyan-400", label: "Preparation" },
    { name: "github", icon: Github, color: "text-white", label: "GitHub Scan" },
    { name: "google", icon: Globe, color: "text-blue-400", label: "Google OSINT" },
    { name: "analysis", icon: Shield, color: "text-green-400", label: "Analysis" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 8 + 4;
        const newProgress = Math.min(prev + increment, 95);
        const taskIndex = Math.floor((newProgress / 100) * tasks.length);
        const currentTaskText = tasks[Math.min(taskIndex, tasks.length - 1)];
        
        // Update phase based on progress
        if (newProgress < 25) setCurrentPhase("preparation");
        else if (newProgress < 50) setCurrentPhase("github");
        else if (newProgress < 75) setCurrentPhase("google");
        else setCurrentPhase("analysis");
        
        // Mark previous tasks as completed
        if (taskIndex > 0 && !completedTasks.includes(tasks[taskIndex - 1])) {
          setCompletedTasks(prev => [...prev, tasks[taskIndex - 1]]);
        }
        
        setCurrentTask(currentTaskText);
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getCurrentPhase = () => phases.find(p => p.name === currentPhase);
  const currentPhaseData = getCurrentPhase();

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
      
      <CardContent className="p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {currentPhaseData && (
                <currentPhaseData.icon className={`h-10 w-10 ${currentPhaseData.color} animate-spin mr-3`} />
              )}
              <div className="absolute inset-0 animate-ping opacity-30">
                {currentPhaseData && (
                  <currentPhaseData.icon className={`h-10 w-10 ${currentPhaseData.color} mr-3`} />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-1">
                Scanning {domain}
              </h3>
              <p className="text-gray-400 text-sm">
                Phase: {currentPhaseData?.label} • {Math.round(progress)}% Complete
              </p>
            </div>
            <Zap className="h-10 w-10 text-purple-400 animate-pulse ml-3" />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-gray-300 font-medium">{currentTask}</p>
            </div>
            <Progress value={progress} className="w-full max-w-lg mx-auto h-4 mb-2" />
            <p className="text-sm text-gray-400">
              Estimated time remaining: {Math.max(1, Math.ceil((100 - progress) / 10))} seconds
            </p>
          </div>
        </div>

        {/* Phase Progress Indicators */}
        <div className="flex justify-center space-x-8 mb-8">
          {phases.map((phase, index) => (
            <div
              key={phase.name}
              className={`flex flex-col items-center p-4 rounded-lg transition-all duration-300 ${
                currentPhase === phase.name
                  ? 'bg-slate-700/70 border border-slate-600'
                  : 'bg-slate-700/30'
              }`}
            >
              <div className={`relative ${currentPhase === phase.name ? 'animate-pulse' : ''}`}>
                <phase.icon className={`h-8 w-8 ${phase.color} mb-2`} />
                {progress > (index + 1) * 25 && (
                  <CheckCircle className="h-4 w-4 text-green-400 absolute -top-1 -right-1" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                currentPhase === phase.name ? 'text-white' : 'text-gray-400'
              }`}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Task Status */}
        <div className="max-w-2xl mx-auto">
          <h4 className="text-lg font-medium text-gray-300 mb-4 text-center">Scan Progress Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.slice(0, 8).map((task, index) => (
              <div
                key={index}
                className={`flex items-center text-sm p-3 rounded-lg transition-all duration-300 ${
                  completedTasks.includes(task)
                    ? 'bg-green-900/30 border border-green-500/30'
                    : task === currentTask
                    ? 'bg-cyan-900/30 border border-cyan-500/30'
                    : 'bg-slate-700/30'
                }`}
              >
                {completedTasks.includes(task) ? (
                  <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                ) : task === currentTask ? (
                  <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3 flex-shrink-0"></div>
                ) : (
                  <div className="h-4 w-4 border border-gray-600 rounded-full mr-3 flex-shrink-0"></div>
                )}
                <span className={`${
                  completedTasks.includes(task) ? "text-green-400" :
                  task === currentTask ? "text-cyan-400" :
                  "text-gray-500"
                }`}>
                  {task}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-xl font-bold text-cyan-400">{Math.floor(progress / 5)}</div>
            <div className="text-xs text-gray-400">Queries Processed</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-xl font-bold text-purple-400">{Math.floor(progress / 10)}</div>
            <div className="text-xs text-gray-400">APIs Contacted</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-xl font-bold text-pink-400">{Math.floor(progress / 15)}</div>
            <div className="text-xs text-gray-400">Sources Scanned</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Running concurrent searches for optimal performance...
          </p>
          <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
            <Wifi className="h-3 w-3" />
            <span>Secure connection active</span>
            <span>•</span>
            <span>CORS limitations apply</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
