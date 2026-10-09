import {
  PredictRequest,
  PredictResponse,
  ScenariosRequest,
  ScenariosResponse,
  WasteRecordCreate,
  WasteRecord,
  ModelMetrics,
  DashboardSummary,
  HistoricalRecord,
  ChartsData
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string; model_loaded: boolean; dataset_present: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/summary`);
    return handleResponse<DashboardSummary>(res);
  },

  async getHistory(params?: {
    menu_type?: string;
    day_of_week?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<HistoricalRecord[]> {
    const query = new URLSearchParams();
    if (params?.menu_type && params.menu_type !== 'All') query.set('menu_type', params.menu_type);
    if (params?.day_of_week && params.day_of_week !== 'All') query.set('day_of_week', params.day_of_week);
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    return handleResponse<HistoricalRecord[]>(res);
  },

  async getCharts(menuType?: string): Promise<ChartsData> {
    const query = menuType && menuType !== 'All' ? `?menu_type=${encodeURIComponent(menuType)}` : '';
    const res = await fetch(`${API_BASE}/charts${query}`);
    return handleResponse<ChartsData>(res);
  },

  async predictDemand(payload: PredictRequest): Promise<PredictResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<PredictResponse>(res);
  },

  async evaluateScenarios(payload: ScenariosRequest): Promise<ScenariosResponse> {
    const res = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ScenariosResponse>(res);
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    const res = await fetch(`${API_BASE}/model-metrics`);
    return handleResponse<ModelMetrics>(res);
  },

  async retrainModel(): Promise<{ status: string; message: string; metrics: ModelMetrics }> {
    const res = await fetch(`${API_BASE}/train`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getWasteRecords(): Promise<WasteRecord[]> {
    const res = await fetch(`${API_BASE}/waste-records`);
    return handleResponse<WasteRecord[]>(res);
  },

  async createWasteRecord(payload: WasteRecordCreate): Promise<WasteRecord> {
    const res = await fetch(`${API_BASE}/waste-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<WasteRecord>(res);
  },
};
