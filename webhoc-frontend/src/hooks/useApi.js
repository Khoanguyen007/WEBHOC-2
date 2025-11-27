import { useState, useEffect } from 'react';
import axios from 'axios';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const config = {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          ...options
        };
        
        const response = await axios.get(`/api${url}`, config);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};