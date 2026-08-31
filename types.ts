export type L12ShapePoint = {
  id: number;
  lat: number;
  lon: number;
  ordre: number;
};

export type L12StopPoint = {
  id: string;
  nom: string;
  lat: number;
  lon: number;
  ordre: number;
};

export type L12Shape = L12ShapePoint[];
export type L12Stop = L12StopPoint[];
