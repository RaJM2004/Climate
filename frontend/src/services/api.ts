import axios from 'axios';

export const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if present in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('climate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DistrictSummary {
  id: string;
  name: string;
  state_name: string;
  code: string;
  centroid_lat: number;
  centroid_lng: number;
  zone: string;
  vulnerability_score: number;
  vulnerability_category: string;
  category_color: string;
  exposure_score: number;
  sensitivity_score: number;
  adaptive_capacity_score: number;
  data_confidence: number;
  population: number;
  rainfall_24h: number;
  temp_c: number;
}

export interface StateSummary {
  id: number;
  name: string;
  code: string;
  region: string;
  district_count: number;
}

export interface MapLayerMeta {
  layer_key: string;
  title: string;
  category: 'VULNERABILITY' | 'HAZARD_MONITORING';
  source_name: string;
  source_url: string;
  observation_timestamp: string;
  update_status: string;
  geographic_coverage: string;
  unit: string;
}

export interface OverviewAnalytics {
  total_states: number;
  total_union_territories?: number;
  total_administrative_units?: number;
  total_districts: number;
  high_vulnerability_districts: number;
  average_vulnerability_score: number;
  active_hazards_count: number;
  active_official_warnings_count: number;
  vulnerability_distribution: Record<string, number>;
  top_vulnerable_districts: DistrictSummary[];
  recent_official_alerts: any[];
  latest_rainfall_extremes: any[];
}

export const api = {
  getStates: () => apiClient.get<StateSummary[]>('/states').then((r) => r.data),
  
  getDistricts: (params?: { state?: string; category?: string; search?: string }) =>
    apiClient.get<DistrictSummary[]>('/districts', { params }).then((r) => r.data),
    
  getDistrictDetail: (id: string) =>
    apiClient.get(`/districts/${id}`).then((r) => r.data),
    
  getMapLayers: () =>
    apiClient.get<MapLayerMeta[]>('/map/layers').then((r) => r.data),
    
  getLayerGeoJSON: (layerKey: string) =>
    apiClient.get(`/map/${layerKey}`).then((r) => r.data),
    
  getOverviewAnalytics: () =>
    apiClient.get<OverviewAnalytics>('/analytics/overview').then((r) => r.data),
    
  getClimateTrends: (districtId: string) =>
    apiClient.get(`/analytics/trends?district_id=${districtId}`).then((r) => r.data),
    
  getDistrictComparison: (districtIds: string[]) => {
    const params = new URLSearchParams();
    districtIds.forEach((id) => params.append('district_ids', id));
    return apiClient.get(`/analytics/comparison?${params.toString()}`).then((r) => r.data);
  },
  
  getAlerts: (params?: { severity?: string; alert_type?: string }) =>
    apiClient.get('/alerts', { params }).then((r) => r.data),
    
  getHazards: (params?: { hazard_type?: string }) =>
    apiClient.get('/alerts/hazards', { params }).then((r) => r.data),
    
  getDataSources: () =>
    apiClient.get('/data-sources').then((r) => r.data),
    
  getIngestionLogs: () =>
    apiClient.get('/admin/ingestion-logs').then((r) => r.data),
    
  getWeights: () =>
    apiClient.get('/admin/weights').then((r) => r.data),
    
  updateWeights: (weights: { weight_exposure: number; weight_sensitivity: number; weight_adaptive_capacity: number }) =>
    apiClient.post('/admin/weights', weights).then((r) => r.data),
    
  triggerSync: (sourceKey: string) =>
    apiClient.post('/admin/sync', { source_key: sourceKey }).then((r) => r.data),
    
  getUnionTerritories: () =>
    apiClient.get<StateSummary[]>('/states/union-territories').then((r) => r.data),
    
  getStateDetail: (stateId: string) =>
    apiClient.get(`/states/${stateId}`).then((r) => r.data),

  getAdminDashboardStats: () =>
    apiClient.get('/admin/dashboard-stats').then((r) => r.data),

  getUsers: () =>
    apiClient.get('/admin/users').then((r) => r.data),

  createUser: (userData: any) =>
    apiClient.post('/admin/users', userData).then((r) => r.data),

  toggleUserStatus: (userId: number, isActive: boolean) =>
    apiClient.put(`/admin/users/${userId}/status`, { is_active: isActive }).then((r) => r.data),

  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials).then((r) => r.data),
};
