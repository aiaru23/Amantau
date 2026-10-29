import { RouteData } from '../types/route';

export interface CatalogRoute extends RouteData {
  provider: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  bestSeason: string;
  tags: string[];
  isDownloaded?: boolean;
}

export const DIFFICULTY_LABELS: Record<CatalogRoute['difficulty'], string> = {
  easy: '🟢 Лёгкий',
  moderate: '🟡 Средний',
  hard: '🟠 Сложный',
  expert: '🔴 Экспертный',
};

export const ROUTE_CATALOG: CatalogRoute[] = [];

export function getCatalogRoutes(difficulty?: CatalogRoute['difficulty']): CatalogRoute[] {
  if (!difficulty) return ROUTE_CATALOG;
  return ROUTE_CATALOG.filter((r) => r.difficulty === difficulty);
}

export function getCatalogRouteById(id: string): CatalogRoute | undefined {
  return ROUTE_CATALOG.find((r) => r.id === id);
}
