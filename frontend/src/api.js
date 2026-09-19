import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({ baseURL: API_BASE });

export const listScenarios = () => client.get('/scenarios').then(r => r.data);

export const runPipeline = (id) =>
  client.get(`/scenario/${id}/pipeline`).then(r => r.data);

export const getEvidenceReport = (id) =>
  client.get(`/scenario/${id}/report`).then(r => r.data);
