export interface HomeSettings {
  showBanners: boolean
  showTiles: boolean
  showLab: boolean
}

export interface Settings {
  maintenanceMode: boolean
  home?: HomeSettings
}

