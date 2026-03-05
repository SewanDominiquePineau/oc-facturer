export interface JwtPayload {
  userId: string;
  email: string;
  nom: string;
  accesAdv: boolean;
  accesAdmin: boolean;
}

export interface Utilisateur {
  id_utilisateur: string;
  nom_utilisateur: string | null;
  email_utilisateur: string | null;
  last_login: Date | null;
  appVersion: string | null;
  id_manager: string | null;
  acces_commerce: number;
  acces_adv: number;
  acces_planif: number;
  acces_admin: number;
  acces_cdp: number;
  acces_attribution: number;
  acces_deploiement: number;
  acces_rgpd: number;
  mot_de_passe_hash: string | null;
  actif: number;
}

export interface SafeUtilisateur extends Omit<Utilisateur, 'mot_de_passe_hash'> {}
