import { RouteData } from '../types/route';

export const EMPTY_DEFAULT_ROUTE: RouteData = {
  id: 'empty_default',
  name: 'Загрузите GPX файл',
  distanceKm: 0,
  estimatedDurationMinutes: 0,
  maxAltitudeMeters: 0,
  startPointName: 'Не указан',
  endPointName: 'Не указан',
  description: 'Импортируйте GPX файл для отслеживания маршрута.',
  coordinates: [],
};

export const MOCK_ROUTE_BAO: RouteData = EMPTY_DEFAULT_ROUTE;

export const MOCK_ROUTES_LIST: RouteData[] = [];
