export interface ServiceReadiness {
  isReady(): boolean | Promise<boolean>;
}
