// Стандартные энергии связей (кДж/моль) при 298K
// Ключ формируется как "Символ1-Символ2_ТипСвязи" (по алфавиту)
export const BOND_ENERGIES: Record<string, number> = {
  'H-H_single': 436,
  'O-O_double': 498,
  'H-O_single': 460, // O-H
  'C-C_single': 347,
  'C-C_double': 614,
  'C-C_triple': 839,
  'C-O_single': 358,
  'C-O_double': 799,
  'C-H_single': 413,
  'N-N_triple': 945,
};
