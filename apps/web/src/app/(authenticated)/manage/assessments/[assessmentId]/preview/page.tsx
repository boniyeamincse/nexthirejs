'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  getManagedAssessment,
  getAssessmentReadiness,
  publishAssessment,
  archiveAssessment,
  republishAssessment
} from '@/lib/api-client';

export default function PreviewPublishPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter();
  const { session } = useAuth();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await getManagedAssessment(session.accessToken, params.assessmentId);
      setAssessment(data);
      const readData = await getAssessmentReadiness(session.accessToken, params.assessmentId);
      setReadiness(readData);
    } catch (err: any) {
      setError(err.message || 'Failed to load readiness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session, params.assessmentId]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      if (assessment.status === 'ARCHIVED') {
        await republishAssessment(session!.accessToken, params.assessmentId);
      } else {
        await publishAssessment(session!.accessToken, params.assessmentId);
      }
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this assessment?')) return;
    setActionLoading(true);
    try {
      await archiveAssessment(session!.accessToken, params.assessmentId);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !assessment) return <div className="p-8">Loading...</div>;
  if (!assessment) return <div className="p-8 text-red-600">Error loading data</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assessment.title} - Publication</h1>
          <p className="text-gray-500">Current Status: <strong className="text-indigo-600">{assessment.status}</strong></p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => router.push(`/manage/assessments/${params.assessmentId}/questions`)}
            className="px-4 py-2 border rounded"
          >
            Back to Questions
          </button>
        </div>
      </div>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-4">Readiness Check</h3>
            {readiness?.ready ? (
              <div className="text-green-600 bg-green-50 p-4 rounded mb-4">
                ✅ Assessment is ready for publication!
              </div>
            ) : (
              <div className="text-red-600 bg-red-50 p-4 rounded mb-4">
                ❌ Assessment cannot be published. Fix the blockers below.
              </div>
            )}

            {readiness?.blockers?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-red-700">Blockers</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-600">
                  {readiness.blockers.map((b: any, i: number) => (
                    <li key={i}>{b.message} ({b.code})</li>
                  ))}
                </ul>
              </div>
            )}
            
            {readiness?.warnings?.length > 0 && (
              <div>
                <h4 className="font-semibold text-yellow-700">Warnings</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-yellow-700">
                  {readiness.warnings.map((w: any, i: number) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-4">Actions</h3>
            
            {assessment.status === 'DRAFT' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Publishing will make this assessment available based on its visibility settings.
                </p>
                <button
                  onClick={handlePublish}
                  disabled={!readiness?.ready || actionLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Publish Assessment'}
                </button>
              </div>
            )}

            {assessment.status === 'PUBLISHED' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This assessment is currently published. To edit its structure, you must archive it first.
                </p>
                <button
                  onClick={handleArchive}
                  disabled={actionLoading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Archive Assessment'}
                </button>
              </div>
            )}

            {assessment.status === 'ARCHIVED' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This assessment is archived. It is not available to candidates.
                </p>
                <button
                  onClick={handlePublish}
                  disabled={!readiness?.ready || actionLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Republish Assessment'}
                </button>
              </div>
            )}
            
            {assessment.status === 'RETIRED' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-red-600">
                  This assessment is retired and can no longer be modified or published.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
