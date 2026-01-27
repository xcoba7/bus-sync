'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

export default function AdminDashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard/overview');
  }, [router]);

  return (
    <Loader />
  );
}