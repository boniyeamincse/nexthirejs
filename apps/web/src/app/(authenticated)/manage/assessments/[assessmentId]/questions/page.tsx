'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  getManagedAssessment,
  createAssessmentSection,
  assignAssessmentQuestions,
  deleteAssessmentSection,
  deleteAssessmentQuestionAssignment
} from '@/lib/api-client';

export default function QuestionsBuilderPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter();
  const { session } = useAuth();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await getManagedAssessment(session.accessToken, params.assessmentId);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session, params.assessmentId]);

  const handleCreateSection = async () => {
    const title = prompt('Enter section title:');
    if (!title) return;
    try {
      await createAssessmentSection(session!.accessToken, params.assessmentId, {
        title,
        isRequired: true,
      });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteAssessmentSection(session!.accessToken, params.assessmentId, sectionId);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddQuestion = async (sectionId: string) => {
    const questionId = prompt('Enter Question ID (UUID):');
    if (!questionId) return;
    try {
      await assignAssessmentQuestions(session!.accessToken, params.assessmentId, {
        sectionId,
        questionIds: [questionId],
        points: 1,
      });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveQuestion = async (assignmentId: string) => {
    if (!confirm('Remove question from section?')) return;
    try {
      await deleteAssessmentQuestionAssignment(session!.accessToken, params.assessmentId, assignmentId);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && !assessment) return <div className="p-8">Loading...</div>;
  if (!assessment) return <div className="p-8 text-red-600">Error loading assessment</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assessment.title} - Structure</h1>
          <p className="text-gray-500">Total Points: {assessment.totalPoints} | Questions: {assessment.questionCount}</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => router.push(`/manage/assessments/${params.assessmentId}/edit`)}
            className="px-4 py-2 border rounded"
          >
            Edit Metadata
          </button>
          <button
            onClick={() => router.push(`/manage/assessments/${params.assessmentId}/preview`)}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Preview & Publish
          </button>
        </div>
      </div>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-4 rounded">{error}</div>}

      <div className="mb-6">
        <button onClick={handleCreateSection} className="bg-blue-600 text-white px-4 py-2 rounded">
          + Add Section
        </button>
      </div>

      <div className="space-y-6">
        {assessment.sections.map((section: any) => (
          <div key={section.id} className="bg-white shadow rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{section.title}</h3>
              <div className="space-x-2">
                <button onClick={() => handleAddQuestion(section.id)} className="text-blue-600 text-sm">
                  + Add Question
                </button>
                <button onClick={() => handleDeleteSection(section.id)} className="text-red-600 text-sm">
                  Delete Section
                </button>
              </div>
            </div>
            
            {section.questions.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No questions assigned.</p>
            ) : (
              <ul className="divide-y border-t mt-4">
                {section.questions.map((q: any) => (
                  <li key={q.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{q.question.prompt}</p>
                      <p className="text-xs text-gray-500">ID: {q.question.id} | Points: {q.points}</p>
                    </div>
                    <button onClick={() => handleRemoveQuestion(q.id)} className="text-red-600 text-sm">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {assessment.sections.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-gray-500">No sections added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
