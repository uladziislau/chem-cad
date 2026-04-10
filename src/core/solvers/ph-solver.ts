import { IMultiphaseSystem } from '../entities/multiphase-system.interface';

/**
 * Решатель для расчета pH системы на основе уравнения электронейтральности
 * (Charge Balance Equation) с использованием метода бисекции.
 */
export class PHSolver {
    private static readonly KW = 1e-14; // Ионное произведение воды при 25°C

    /**
     * Рассчитывает pH водной фазы (первой фазы системы)
     */
    static calculatePH(system: IMultiphaseSystem): number {
        if (system.phases.length === 0) return 7.0;

        const waterPhase = system.phases[0];
        const components = waterPhase.composition.getComponents();
        const volumeLiters = waterPhase.getVolume().to('l');

        if (volumeLiters === 0 || components.length === 0) return 7.0;

        // Собираем все электролиты
        const electrolytes: { type: 'acid' | 'base', pKas: number[], concentration: number }[] = [];

        for (const c of components) {
            const entity = c.entity;
            const type = entity.getElectrolyteType();
            const pKas = entity.getPKas();
            
            if ((type === 'acid' || type === 'base') && pKas && pKas.length > 0) {
                electrolytes.push({
                    type,
                    pKas,
                    concentration: c.moles / volumeLiters
                });
            }
        }

        if (electrolytes.length === 0) return 7.0;

        // Метод бисекции для поиска корня уравнения электронейтральности
        let minPH = 0.0;
        let maxPH = 14.0;
        let currentPH = 7.0;
        const tolerance = 1e-7;
        const maxIterations = 100;

        for (let i = 0; i < maxIterations; i++) {
            currentPH = (minPH + maxPH) / 2;
            const hPlus = Math.pow(10, -currentPH);
            
            const chargeBalance = this.calculateChargeBalance(hPlus, electrolytes);

            if (Math.abs(chargeBalance) < tolerance) {
                break; // Нашли корень
            }

            // Если баланс положительный (избыток катионов, например H+), 
            // значит реальный pH выше (нужно меньше H+ или больше OH-)
            if (chargeBalance > 0) {
                minPH = currentPH;
            } else {
                maxPH = currentPH;
            }
        }

        return currentPH;
    }

    /**
     * Вычисляет баланс зарядов: f([H+]) = [H+] - [OH-] + sum(z * [Ion])
     * Если f > 0, значит катионов больше, чем анионов.
     */
    private static calculateChargeBalance(hPlus: number, electrolytes: { type: 'acid' | 'base', pKas: number[], concentration: number }[]): number {
        const ohMinus = this.KW / hPlus;
        let balance = hPlus - ohMinus;

        for (const el of electrolytes) {
            if (el.type === 'acid') {
                // Для кислот (HA -> H+ + A-)
                // Упрощенно для многоосновных кислот считаем сумму зарядов анионов
                // Точный расчет долей (alpha) для каждой ступени диссоциации:
                const alphas = this.calculateAcidAlphas(hPlus, el.pKas);
                for (let i = 1; i < alphas.length; i++) {
                    balance -= i * alphas[i] * el.concentration; // Анионы имеют отрицательный заряд -1, -2, ...
                }
            } else if (el.type === 'base') {
                // Для оснований (B + H+ -> BH+)
                const alphas = this.calculateBaseAlphas(hPlus, el.pKas);
                for (let i = 1; i < alphas.length; i++) {
                    balance += i * alphas[i] * el.concentration; // Катионы имеют положительный заряд +1, +2, ...
                }
            }
        }

        return balance;
    }

    /**
     * Расчет мольных долей (alpha) для многоосновной кислоты.
     * Возвращает массив [alpha0, alpha1, alpha2, ...], где:
     * alpha0 - доля недиссоциированной кислоты (HnA)
     * alpha1 - доля H(n-1)A^-
     * alpha2 - доля H(n-2)A^2-
     */
    private static calculateAcidAlphas(hPlus: number, pKas: number[]): number[] {
        const n = pKas.length;
        const kas = pKas.map(pKa => Math.pow(10, -pKa));
        
        // Знаменатель: [H+]^n + [H+]^(n-1)*K1 + [H+]^(n-2)*K1*K2 + ... + K1*K2*...*Kn
        let denominator = Math.pow(hPlus, n);
        let currentKProduct = 1;
        
        const terms = [Math.pow(hPlus, n)];
        
        for (let i = 0; i < n; i++) {
            currentKProduct *= kas[i];
            const term = Math.pow(hPlus, n - 1 - i) * currentKProduct;
            terms.push(term);
            denominator += term;
        }

        return terms.map(term => term / denominator);
    }

    /**
     * Расчет мольных долей (alpha) для многокислотного основания.
     * pKa здесь - это pKa сопряженной кислоты (BH+ -> B + H+).
     * Сильное основание (NaOH) имеет pKa сопряженной кислоты ~14.
     * Возвращает массив [alpha0, alpha1, ...], где:
     * alpha0 - доля свободного основания (B)
     * alpha1 - доля протонированного основания (BH+)
     */
    private static calculateBaseAlphas(hPlus: number, pKas: number[]): number[] {
        // Для оснований математика аналогична, но pKa относится к отрыву протона от BH+.
        // B + H+ <=> BH+ (Ka = [B][H+]/[BH+])
        // Для однокислотного основания:
        // alpha0 (B) = Ka / (Ka + [H+])
        // alpha1 (BH+) = [H+] / (Ka + [H+])
        
        const n = pKas.length;
        const kas = pKas.map(pKa => Math.pow(10, -pKa));
        
        let denominator = Math.pow(hPlus, n);
        let currentKProduct = 1;
        
        const terms = [Math.pow(hPlus, n)]; // Это соответствует полностью протонированной форме (максимальный заряд)
        
        for (let i = 0; i < n; i++) {
            currentKProduct *= kas[i];
            const term = Math.pow(hPlus, n - 1 - i) * currentKProduct;
            terms.push(term);
            denominator += term;
        }

        // terms: [ [H+]^n, [H+]^(n-1)*K1, ..., K1*K2*...*Kn ]
        // terms[0] - полностью протонированная форма (заряд +n)
        // terms[n] - полностью депротонированная форма (заряд 0)
        
        // Нам нужно вернуть массив, где индекс = заряд.
        // Поэтому мы переворачиваем массив terms.
        const reversedTerms = terms.slice().reverse();
        
        return reversedTerms.map(term => term / denominator);
    }
}
