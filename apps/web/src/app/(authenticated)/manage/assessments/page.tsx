'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { publicEnv } from '@/lib/env';
import { useAuth } from '@/providers/auth-context';
import type { AssessmentManagementDetail } from '@nexthire/types';

export default function AssessmentListPage() {
  const { getAccessToken } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentManagementDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${publicEnv.apiBaseUrl}/manage/assessments`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAssessments(data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch assessments', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [getAccessToken]);

  if (loading) return <div className="p-8">Loading assessments...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assessment Management</h1>
        <Link href="/manage/assessments/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Assessment
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Questions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <tr key={assessment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                  <div className="text-sm text-gray-500">{assessment.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {assessment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {assessment.questionCount} Qs ({assessment.totalPoints} pts)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <Link
                    href={`/manage/assessments/${assessment.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/manage/assessments/${assessment.id}/questions`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Questions
                  </Link>
                  <Link
                    href={`/manage/assessments/${assessment.id}/preview`}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    Publish
                  </Link>
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No assessments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
