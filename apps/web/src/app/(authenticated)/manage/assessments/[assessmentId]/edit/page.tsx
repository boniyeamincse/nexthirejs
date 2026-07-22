'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getManagedAssessment, updateAssessment } from '@/lib/api-client';

export default function EditAssessmentPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter();
  const { session } = useAuth();
  
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      try {
        const assessment = await getManagedAssessment(session.accessToken, params.assessmentId);
        setFormData({
          categoryId: assessment.categoryId,
          title: assessment.title,
          slug: assessment.slug,
          shortDescription: assessment.shortDescription,
          description: assessment.description || '',
          instructions: assessment.instructions || '',
          type: assessment.type,
          difficulty: assessment.difficulty,
          visibility: assessment.visibility,
          availability: assessment.availability,
          estimatedDurationMinutes: assessment.estimatedDurationMinutes,
          passingScorePercentage: assessment.passingScorePercentage,
          maximumAttempts: assessment.maximumAttempts || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, params.assessmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!session?.accessToken) throw new Error('Not authenticated');
      
      const payload: any = { ...formData };
      if (!payload.description) payload.description = null;
      if (!payload.instructions) payload.instructions = null;
      if (!payload.maximumAttempts) payload.maximumAttempts = null;
      else payload.maximumAttempts = Number(payload.maximumAttempts);
      payload.estimatedDurationMinutes = Number(payload.estimatedDurationMinutes);
      payload.passingScorePercentage = Number(payload.passingScorePercentage);

      await updateAssessment(session.accessToken, params.assessmentId, payload);
      router.push(`/manage/assessments/${params.assessmentId}/questions`);
    } catch (err: any) {
      setError(err.message || 'Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!formData) return <div className="p-8 text-red-600">Error loading assessment</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white shadow rounded-lg mt-8">
      <h1 className="text-2xl font-bold mb-6">Edit Assessment</h1>
      {error && <div className="mb-4 text-red-600 bg-red-50 p-4 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category ID (UUID)</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={formData.categoryId}
            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={200}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            required
            pattern="[a-z0-9-]+"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
            value={formData.slug}
            onChange={e => setFormData({ ...formData, slug: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Short Description</label>
          <textarea
            required
            minLength={10}
            maxLength={500}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={formData.shortDescription}
            onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Instructions</label>
          <textarea
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-32"
            value={formData.instructions}
            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="PRACTICE">Practice</option>
              <option value="CERTIFICATION">Certification</option>
              <option value="SCREENING">Screening</option>
              <option value="SKILL_CHECK">Skill Check</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.difficulty}
              onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
            <input
              type="number"
              required
              min={1}
              max={480}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.estimatedDurationMinutes}
              onChange={e => setFormData({ ...formData, estimatedDurationMinutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
            <input
              type="number"
              required
              min={1}
              max={100}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.passingScorePercentage}
              onChange={e => setFormData({ ...formData, passingScorePercentage: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Attempts</label>
            <input
              type="number"
              min={1}
              max={100}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.maximumAttempts}
              onChange={e => setFormData({ ...formData, maximumAttempts: e.target.value ? Number(e.target.value) : '' })}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
