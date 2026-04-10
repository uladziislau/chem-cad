import { Injectable, signal } from '@angular/core';
import { ProductSegment } from '../../lab/services/catalog.service';

export interface ISegmentInfo {
  id: ProductSegment;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutarkyService {
  // Текущий выбранный вектор развития
  public readonly selectedSegment = signal<ProductSegment | null>(null);

  public readonly segments: ISegmentInfo[] = [
    {
      id: 'cosmetics',
      title: 'Косметика и Уход',
      description: 'Создание эмульсий, кремов, шампуней и средств личной гигиены.',
      icon: 'sparkles',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/20'
    },
    {
      id: 'household',
      title: 'Бытовая химия',
      description: 'Моющие средства, очистители поверхностей, средства для стирки.',
      icon: 'home',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/20'
    },
    {
      id: 'coatings',
      title: 'Краски и Покрытия',
      description: 'Лаки, олифы, защитные составы для дерева и металла.',
      icon: 'paint-brush',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/20'
    },
    {
      id: 'agro',
      title: 'Агрохимия',
      description: 'Удобрения, стимуляторы роста и средства защиты растений.',
      icon: 'leaf',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/20'
    }
  ];

  selectSegment(segment: ProductSegment | null) {
    this.selectedSegment.set(segment);
  }
}
