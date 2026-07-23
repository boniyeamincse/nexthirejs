'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyExpertProfile,
  getMyExpertApplication,
  getMyExpertApplicationReadiness,
  listMyExpertVerificationDocuments,
} from '@/lib/api-client';
import type {
  ExpertProfileResult,
  ExpertApplicationDetail,
  ExpertApplicationReadiness,
  ExpertVerificationDocumentResult,
} from '@nexthire/types';

export interface ExpertApplicantData {
  profile: ExpertProfileResult | null;
  application: ExpertApplicationDetail | null;
  readiness: ExpertApplicationReadiness | null;
  documents: ExpertVerificationDocumentResult[];
}

export interface UseExpertApplicantResult extends ExpertApplicantData {
  authStatus: ReturnType<typeof useAuth>['status'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getAccessToken: () => string | null;
}

/**
 * Loads the current user's expert profile, application, readiness, and
 * documents. Readiness/documents are only fetched when an application exists.
 * Centralises 401 handling (session expiry -> logout + redirect to login).
 */
export function useExpertApplicant(): UseExpertApplicantResult {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<ExpertApplicantData>({
    profile: null,
    application: null,
    readiness: null,
    documents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [profile, application] = await Promise.all([
        getMyExpertProfile(token),
        getMyExpertApplication(token),
      ]);

      let readiness: ExpertApplicationReadiness | null = null;
      let documents: ExpertVerificationDocumentResult[] = [];
      if (application) {
        [readiness, documents] = await Promise.all([
          getMyExpertApplicationReadiness(token).catch(() => null),
          listMyExpertVerificationDocuments(token).catch(() => []),
        ]);
      }

      setData({ profile, application, readiness, documents });
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setError('We could not load your expert application. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void refetch();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, refetch]);

  return {
    ...data,
    authStatus,
    loading,
    error,
    refetch,
    getAccessToken,
  };
}
