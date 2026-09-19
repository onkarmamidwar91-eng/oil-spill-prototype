import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const client = axios.create({ baseURL: API_BASE });

export const listScenarios = () => client.get('/api/scenarios').then(r => r.data);
export const runPipeline = (id) => client.get(`/api/scenario/${id}/pipeline`).then(r => r.data);
export const getEvidenceReport = (id) => client.get(`/api/scenario/${id}/report`).then(r => r.data);
