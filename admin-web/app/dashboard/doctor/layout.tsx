import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctor Dashboard',
  description: 'Manage your patients, appointments, and medical records efficiently with BharatCare\'s doctor dashboard.',
  keywords: [
    'doctor dashboard',
    'patient management',
    'medical records',
    'appointments',
    'healthcare management',
    'doctor portal',
  ],
  openGraph: {
    title: 'Doctor Dashboard | BharatCare',
    description: 'Manage your patients, appointments, and medical records efficiently with BharatCare\'s doctor dashboard.',
  },
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 