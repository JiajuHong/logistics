export interface PathPointVO {
  stationId: string;
  stationName: string;
  longitude: number;
  latitude: number;
}

export interface OptimalRouteVO {
  fromStationId: string;
  toStationId: string;
  pathPoints: PathPointVO[];
  totalDistance: number;
  estimatedTime: number;
  error?: boolean;
  isDefault?: boolean;
}

export interface RouteItem {
  id: number;
  fromStationId: number;
  toStationId: number;
  distance: number;
  travelTime: number;
  transportCost: number;
  status: number;
}
