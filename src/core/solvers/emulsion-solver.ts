import { ISurfactant } from '../entities/surfactant.interface';

export interface SurfactantBlendResult {
    surfactantAAmount: number; // Доля первого ПАВ (0..1)
    surfactantBAmount: number; // Доля второго ПАВ (0..1)
}

export class EmulsionSolver {
    /**
     * Рассчитывает идеальную пропорцию двух ПАВ для достижения целевого HLB.
     * Использует закон аддитивности Гриффина: HLB_смеси = HLB_a * f_a + HLB_b * f_b
     * 
     * @param surfactantA Первый ПАВ
     * @param surfactantB Второй ПАВ
     * @param targetHLB Целевой HLB (обычно Required HLB масляной фазы)
     */
    static calculateSurfactantBlend(
        surfactantA: ISurfactant, 
        surfactantB: ISurfactant, 
        targetHLB: number
    ): SurfactantBlendResult {
        const hlbA = surfactantA.hlb;
        const hlbB = surfactantB.hlb;

        // Проверка на возможность решения
        const minHLB = Math.min(hlbA, hlbB);
        const maxHLB = Math.max(hlbA, hlbB);

        if (targetHLB < minHLB || targetHLB > maxHLB) {
            throw new Error(`Невозможно достичь HLB ${targetHLB} используя ПАВ с HLB ${hlbA} и ${hlbB}. Целевое значение должно быть между ними.`);
        }

        if (Math.abs(hlbA - hlbB) < 0.0001) {
            return { surfactantAAmount: 0.5, surfactantBAmount: 0.5 };
        }

        // Решение уравнения: target = hlbA * x + hlbB * (1 - x)
        // target = hlbA * x + hlbB - hlbB * x
        // target - hlbB = x * (hlbA - hlbB)
        // x = (target - hlbB) / (hlbA - hlbB)
        
        const fractionA = (targetHLB - hlbB) / (hlbA - hlbB);
        const fractionB = 1 - fractionA;

        return {
            surfactantAAmount: fractionA,
            surfactantBAmount: fractionB
        };
    }
}
