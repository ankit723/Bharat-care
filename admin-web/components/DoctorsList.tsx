'use client';

import { useEffect, useState } from 'react';
import { doctorsApi } from '@/lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  email: string;
}

export default function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await doctorsApi.getAll();
        setDoctors(response.data.doctors || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch doctors');
        console.error('Error fetching doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorsApi.delete(id);
        // Filter out the deleted doctor from the state
        setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete doctor');
        console.error('Error deleting doctor:', err);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-5">Loading doctors...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-5">Error: {error}</div>;
  }

  if (doctors.length === 0) {
    return <div className="text-center p-5">No doctors found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Doctors Directory</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg">{doctor.name}</h3>
            <p className="text-gray-600">{doctor.specialization}</p>
            <p className="text-sm text-gray-500">Hospital: {doctor.hospital}</p>
            <p className="text-sm text-gray-500">Email: {doctor.email}</p>
            
            <div className="mt-4 flex gap-2">
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                onClick={() => window.location.href = `/doctors/edit/${doctor.id}`}
              >
                Edit
              </button>
              <button 
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                onClick={() => handleDelete(doctor.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 