// Task related types
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null; // in seconds
  notes: string | null;
}

export interface Task {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  dueDate: string | null;
  startDate: string | null;
  estimatedTime: number | null; // in minutes
  actualTime: number | null; // in minutes
  dependencies: string[]; // IDs of tasks that this task depends on
  tools: string[];
  tags: string[];
  timeEntries: TimeEntry[];
  methodComparison: {
    currentMethod: {
      status: TaskStatus;
      timeEntries: TimeEntry[];
    };
    aiMethod: {
      status: TaskStatus;
      timeEntries: TimeEntry[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Chat related types
export interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  imageData?: string;
}

// Workflow related types
export interface Workflow {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  tasks: Task[];
}

// Workflow creation state
export interface WorkflowCreationState {
  workflowTitle: string;
  workflowDescription: string;
  currentStep: 'initial' | 'naming' | 'tasks' | 'review' | 'complete';
  chatHistory: ChatMessageType[];
  suggestedTasks: Task[];
  selectedTasks: Task[];
}
