export interface Player {
  id: string;
  name: string;
  registeredAt: string;
}

export interface Beyblade {
  id: string;
  name: string;
  serial: string;
  type: string;
  systemLine: 'BX' | 'UX' | 'CX';
  image: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface PlayerAssignment {
  playerId: string;
  playerName: string;
  beybladeIds: string[];
}

export interface Match {
  assignments: PlayerAssignment[];
  numBeyblades: number;
  createdAt: string;
}
