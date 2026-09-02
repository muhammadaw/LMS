import axios from 'axios';
import { ApiResponse } from '@lms/types';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network communication failure.',
      },
    });
  }
);
