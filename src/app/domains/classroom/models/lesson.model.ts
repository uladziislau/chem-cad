export interface LessonStep {
  id: string;
  title: string;
  content: string;
  requiredAction?: {
    type: 'add_reagent';
    reagentId: string;
  };
  successMessage?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LessonStep[];
}
