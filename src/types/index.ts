export interface Promoter {
  name: string;
  leader: string;
}

export interface Photo {
  id: string;
  name: string;
  url: string;
  evaluation?: {
    score: number;
    criteria: string[];
  };
  promoter?: string;
  leader?: string;
}

export interface ExtractedSlideData {
  codigoParceiro: string;
  nomeLoja: string;
  colaborador: string;
  superior: string;
  dataEnvio: string;
  slideNumber: number;
  imageUrl?: string;
}
