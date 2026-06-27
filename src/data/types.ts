export interface ClassEntry {
  name: string;
  tier: string;
  price_coins: number | null;
  price_robux: number | null;
  currency: string;
  role: string;
  ability: string;
  rarity: string;
  level_upgrades: {
    level_1: string;
    level_2: string;
    level_3: string;
  };
  stats: {
    sanity: string;
    utility: string;
    starter_money: string;
  };
  description: string;
  sources: string[];
  price_note?: string;
}

export interface ClassData {
  classes: ClassEntry[];
}

export interface AnomalyEntry {
  id: string;
  name: string;
  category: string;
  detection_method: string;
  description: string;
  how_to_handle: string;
  difficulty?: string;
}

export interface MonsterEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  how_to_handle: string;
  location?: string;
  danger_level: string;
}

export interface AnomalyData {
  appearance_anomalies: AnomalyEntry[];
  photo_anomalies: AnomalyEntry[];
  cctv_anomalies: AnomalyEntry[];
  monsters: MonsterEntry[];
}
