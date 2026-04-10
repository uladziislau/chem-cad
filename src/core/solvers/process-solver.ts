import { IMultiphaseSystem } from '../entities/multiphase-system.interface';

export class ProcessSolver {
    /**
     * Рассчитывает средний размер капель (Саутеровский диаметр, d32) в микрометрах
     * на основе параметров гомогенизации и физических свойств системы.
     * 
     * @param system Многофазная система
     * @param rpm Скорость вращения ротора гомогенизатора (об/мин)
     * @param timeMinutes Время гомогенизации (мин)
     */
    static calculateDropletSize(system: IMultiphaseSystem, rpm: number, timeMinutes: number): number {
        if (system.phases.length < 2 || system.boundaries.length === 0) {
            return 0; // Нет капель в гомогенной системе
        }

        const continuousPhase = system.phases[0];
        const boundary = system.boundaries[0];

        const ift = boundary.getInterfacialTension(); // мН/м
        const eta_c = continuousPhase.getViscosity(); // cP
        
        // Защита от деления на ноль
        const safeRpm = Math.max(100, rpm);
        const safeTime = Math.max(0.1, timeMinutes);

        // Эмпирическая модель:
        // 1. Чем выше IFT, тем крупнее капли (труднее разорвать)
        // 2. Чем выше вязкость сплошной фазы, тем мельче капли (лучше передается сдвиговое усилие)
        // 3. Чем выше RPM, тем мельче капли (зависимость ~ RPM^-1.2)
        // 4. Время смешивания асимптотически уменьшает размер капель
        
        // Базовый коэффициент калибровки
        const k = 50000; 

        // Влияние времени (асимптотическое приближение к равновесному размеру)
        const timeFactor = 1.0 + (5.0 / safeTime);

        // Расчет размера в мкм
        const d32 = (k * ift * timeFactor) / (Math.pow(safeRpm, 1.2) * Math.pow(eta_c, 0.3));

        // Ограничения
        // Минимальный размер капли (физический предел для обычных ротор-статор гомогенизаторов)
        const minSize = 0.5; 
        // Максимальный размер (если вообще не мешали или IFT огромный)
        const maxSize = 200.0;

        return Math.min(maxSize, Math.max(minSize, d32));
    }
}
