'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WorkflowAnalytics from '@/components/analytics/WorkflowAnalytics';
import AppLayout from '@/components/layout/AppLayout';

export default function WorkflowAnalyticsPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const workflowName = params.workflowName as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // Only Manager and Owner can access
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      if (!['manager', 'owner'].includes(role)) {
        router.push('/unauthorized?reason=manager_only');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return null;
  }

  if (!session?.user?.tenantId) {
    return null;
  }

  return (
    <AppLayout>
      <WorkflowAnalytics 
        workflowName={workflowName} 
        tenantId={session.user.tenantId}
      />
    </AppLayout>
  );
}
