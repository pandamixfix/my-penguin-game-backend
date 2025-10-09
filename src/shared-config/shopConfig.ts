// packages/shared-config/shopConfig.ts

import { Upgrades } from './types';

export interface ShopItemConfig {
  id: keyof Upgrades;
  name: string;
  description: string;
  maxLevel: number;
  getNewValue: (currentValue: number) => number;
  formatValue: (value: number) => string;
  costs: number[]; // <-- ТЕПЕРЬ ВСЕ ИСПОЛЬЗУЮТ МАССИВ ЦЕН
}

export const shopItemsConfig: ShopItemConfig[] = [
  {
    id: 'clickPower',
    name: 'Сила клика',
    description: 'Увеличивает количество очков за каждый клик.',
    maxLevel: 10,
    costs: [300, 350, 550, 850, 1250, 1800, 2450, 3200, 4150, 5400],
    getNewValue: (currentValue) => currentValue + 1,
    formatValue: (value) => `Ур. ${value}`,
  },
  {
    id: 'critChance',
    name: 'Шанс крит. удара',
    description: 'Дает шанс нанести кратно больше урона.',
    maxLevel: 10,
    costs: [500, 750, 1250, 2000, 3000, 4250, 5500, 7000, 8500, 10000],
    getNewValue: (currentValue) => Math.min(currentValue + 0.01, 1),
    formatValue: (value) => `Шанс: ${(value * 100).toFixed(0)}%`,
  },
  {
    id: 'critMultiplier',
    name: 'Множитель крита',
    description: 'Увеличивает урон от критических кликов.',
    maxLevel: 5,
    costs: [1000, 2500, 5000, 8500, 14000],
    getNewValue: (currentValue) => currentValue + 0.5,
    formatValue: (value) => `Сила: x${value.toFixed(1)}`,
  },
  {
    id: 'doubleHitChance',
    name: 'Двойной удар',
    description: 'Дает шанс, что ваш клик засчитается как два.',
    maxLevel: 5,
    costs: [750, 1500, 2750, 4500, 6500],
    getNewValue: (currentValue) => Math.min(currentValue + 0.02, 1),
    formatValue: (value) => `Шанс: ${(value * 100).toFixed(0)}%`,
  },
];