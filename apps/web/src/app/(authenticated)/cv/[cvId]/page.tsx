'use client';

import { useParams } from 'next/navigation';
import { CvEditor } from '@/features/cv-builder/CvEditor';

export default function CvEditorPage() {
  const params = useParams<{ cvId: string }>();
  return <CvEditor cvId={params.cvId} />;
}
