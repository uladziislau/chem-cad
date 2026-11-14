export type MassUnit = 'mg' | 'g' | 'kg';
export type AmountUnit = 'mmol' | 'mol';
export type VolumeUnit = 'ml' | 'l' | 'm3';

export class Mass {
    constructor(public readonly value: number, public readonly unit: MassUnit) {}

    /**
     * Конвертирует значение в целевую единицу измерения
     */
    to(targetUnit: MassUnit): number {
        const inGrams = this.toGrams();
        switch (targetUnit) {
            case 'mg': return inGrams * 1000;
            case 'g': return inGrams;
            case 'kg': return inGrams / 1000;
        }
    }

    private toGrams(): number {
        switch (this.unit) {
            case 'mg': return this.value / 1000;
            case 'g': return this.value;
            case 'kg': return this.value * 1000;
        }
    }
}

export class Moles {
    constructor(public readonly value: number, public readonly unit: AmountUnit) {}

    to(targetUnit: AmountUnit): number {
        const inMoles = this.toMoles();
        switch (targetUnit) {
            case 'mmol': return inMoles * 1000;
            case 'mol': return inMoles;
        }
    }

    private toMoles(): number {
        switch (this.unit) {
            case 'mmol': return this.value / 1000;
            case 'mol': return this.value;
        }
    }
}

export class Volume {
    constructor(public readonly value: number, public readonly unit: VolumeUnit) {}

    to(targetUnit: VolumeUnit): number {
        const inMl = this.toMl();
        switch (targetUnit) {
            case 'ml': return inMl;
            case 'l': return inMl / 1000;
            case 'm3': return inMl / 1000000;
        }
    }

    private toMl(): number {
        switch (this.unit) {
            case 'ml': return this.value;
            case 'l': return this.value * 1000;
            case 'm3': return this.value * 1000000;
        }
    }
}

export type PhysicalQuantity = Mass | Moles | Volume;
