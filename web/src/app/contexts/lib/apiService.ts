// contexts/lib/apiService.ts
import axios from 'axios';

const apiService = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default apiService;
