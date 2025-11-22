/**
 * React Hook for Oura Data
 * Manages Oura API integration state and data fetching
 */

import { useState, useEffect } from 'react';
import { isOuraConfigured } from '@/constants/oura-config';
import {
  autoFillProfileFromOura,
  preFillAssessmentFromOura,
  getHealthSummary,
  fetchAndMapOuraData,
  type MappedOuraData,
} from '@/services/oura-data-mapper';

export function useOuraConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsConnected(isOuraConfigured());
    setIsChecking(false);
  }, []);

  return { isConnected, isChecking };
}

export function useOuraProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await autoFillProfileFromOura();
      setProfile(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Oura profile';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading, error, fetchProfile };
}

export function useOuraAssessment() {
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async (days: number = 7) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await preFillAssessmentFromOura(days);
      setAssessmentData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Oura assessment data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { assessmentData, isLoading, error, fetchAssessment };
}

export function useOuraHealthSummary(days: number = 7) {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getHealthSummary(days);
      setSummary(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Oura health summary';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOuraConfigured()) {
      fetchSummary();
    }
  }, [days]);

  return { summary, isLoading, error, fetchSummary, refetch: fetchSummary };
}

export function useOuraData(days: number = 7) {
  const [data, setData] = useState<MappedOuraData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mappedData = await fetchAndMapOuraData(days);
      setData(mappedData);
      return mappedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Oura data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, fetchData, refetch: fetchData };
}

