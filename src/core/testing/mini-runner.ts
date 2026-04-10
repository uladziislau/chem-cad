/**
 * Мини-фреймворк для запуска тестов прямо в браузере (в консоли)
 */

let currentSuitePassed = 0;
let currentSuiteFailed = 0;
let currentSuiteName = '';

export function describe(name: string, fn: () => void) {
    const parentSuiteName = currentSuiteName;
    const parentPassed = currentSuitePassed;
    const parentFailed = currentSuiteFailed;

    currentSuiteName = name;
    currentSuitePassed = 0;
    currentSuiteFailed = 0;

    console.log(`%c🧪 ТЕСТОВЫЙ НАБОР: ${name}`, 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    
    fn();

    if (currentSuitePassed > 0 && currentSuiteFailed === 0) {
        console.log(`%c  ✅ Все тесты пройдены (${currentSuitePassed} шт.)`, 'color: #10b981; font-style: italic;');
    } else if (currentSuiteFailed > 0) {
        console.log(`%c  ⚠️ Итог набора: ${currentSuitePassed} ок, ${currentSuiteFailed} провалено`, 'color: #f59e0b; font-weight: bold;');
    }

    // Возвращаем состояние родительского набора
    currentSuiteName = parentSuiteName;
    currentSuitePassed = parentPassed + currentSuitePassed;
    currentSuiteFailed = parentFailed + currentSuiteFailed;
}

export interface TestOptions {
    verbose?: boolean;
}

export function it(name: string, fn: () => void, options: TestOptions = {}) {
    try {
        fn();
        currentSuitePassed++;
        if (options.verbose) {
            console.log(`%c  ✅ ПРОЙДЕН (new): ${name}`, 'color: #10b981; font-weight: bold;');
        }
    } catch (e) {
        const error = e as Error;
        currentSuiteFailed++;
        console.log(`%c  ❌ ПРОВАЛЕН: ${name}`, 'color: #ef4444; font-weight: bold;');
        console.error(`     ${error.message}`);
    }
}

export function expect(actual: unknown) {
    return {
        toBe: (expected: unknown) => {
            if (actual !== expected) throw new Error(`Ожидалось ${expected}, получено ${actual}`);
        },
        toBeDefined: () => {
            if (actual === undefined || actual === null) throw new Error(`Ожидалось, что значение будет определено`);
        },
        toBeGreaterThan: (expected: number) => {
            if (!((actual as number) > expected)) throw new Error(`Ожидалось больше ${expected}, получено ${actual}`);
        },
        toBeLessThan: (expected: number) => {
            if (!((actual as number) < expected)) throw new Error(`Ожидалось меньше ${expected}, получено ${actual}`);
        },
        toBeLessThanOrEqual: (expected: number) => {
            if (!((actual as number) <= expected)) throw new Error(`Ожидалось меньше или равно ${expected}, получено ${actual}`);
        },
        toBeCloseTo: (expected: number, precision = 2) => {
            const diff = Math.abs((actual as number) - expected);
            const threshold = Math.pow(10, -precision) / 2;
            if (diff > threshold) throw new Error(`Ожидалось ${expected} (±${threshold}), получено ${actual}`);
        }
    };
}
