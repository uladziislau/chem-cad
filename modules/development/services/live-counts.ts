interface LiveCount {
  label: string;
  count: number;
  color: string;
  icon: string;
}

interface LiveCountsInput {
  records: number;
  symptoms: number;
  medications: number;
  doctors: number;
  medicalCardFiles: number;
  events: number;
}

export function computeLiveCounts(input: LiveCountsInput): LiveCount[] {
  return [
    { label: 'Документы', count: input.records, color: 'text-blue-400', icon: '📄' },
    { label: 'Симптомы', count: input.symptoms, color: 'text-teal-400', icon: '📝' },
    { label: 'Лекарства', count: input.medications, color: 'text-green-400', icon: '💊' },
    { label: 'Врачи', count: input.doctors, color: 'text-purple-400', icon: '👨‍⚕️' },
    { label: 'Стр. Медкарты', count: input.medicalCardFiles, color: 'text-rose-400', icon: '📇' },
    { label: 'События', count: input.events, color: 'text-yellow-400', icon: '📅' },
  ];
}
