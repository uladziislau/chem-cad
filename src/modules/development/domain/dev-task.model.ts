export type TaskStatus = 'backlog' | 'design' | 'implementation' | 'verification' | 'done' | 'pending';
export type SubTaskStatus = 'pending' | 'design' | 'implementation' | 'verification' | 'done' | 'in-progress';

export interface DevSubTask {
  id: string;
  title: string;
  status: SubTaskStatus;
}

export interface DevTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  subtasks?: DevSubTask[];
}

export interface DevelopmentEpic {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'active' | 'completed';
  tasks: DevTask[];
}
