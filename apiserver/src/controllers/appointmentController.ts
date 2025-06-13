import { Request, Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

// Get appointments for patient
export const getPatientAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can access their appointments' });
      return;
    }

    // Get doctor appointments
    const doctorAppointments = await prisma.doctorNextVisit.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            id: true,
            userId: true,
            name: true,
            specialization: true,
            phone: true,
            email: true,
            addressLine: true,
            city: true,
            state: true,
            verificationStatus: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
    });

    // Get checkup center appointments
    const checkupAppointments = await prisma.checkupCenterNextVisit.findMany({
      where: { patientId },
      include: {
        checkupCenter: {
          select: {
            id: true,
            userId: true,
            name: true,
            phone: true,
            email: true,
            addressLine: true,
            city: true,
            state: true,
            verificationStatus: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
    });

    // Combine and format appointments
    const appointments = [
      ...doctorAppointments.map(apt => ({
        id: apt.id,
        type: 'DOCTOR_VISIT',
        appointmentDate: apt.nextVisit,
        status: new Date(apt.nextVisit) > new Date() ? 'UPCOMING' : 'PAST',
        provider: {
          id: apt.doctor.id,
          userId: apt.doctor.userId,
          name: apt.doctor.name,
          type: 'doctor',
          specialization: apt.doctor.specialization,
          phone: apt.doctor.phone,
          email: apt.doctor.email,
          address: apt.doctor.addressLine,
          city: apt.doctor.city,
          state: apt.doctor.state,
          verificationStatus: apt.doctor.verificationStatus,
        },
        patient: apt.patient,
      })),
      ...checkupAppointments.map(apt => ({
        id: apt.id,
        type: 'CHECKUP',
        appointmentDate: apt.nextVisit,
        status: new Date(apt.nextVisit) > new Date() ? 'UPCOMING' : 'PAST',
        provider: {
          id: apt.checkupCenter.id,
          userId: apt.checkupCenter.userId,
          name: apt.checkupCenter.name,
          type: 'checkup_center',
          phone: apt.checkupCenter.phone,
          email: apt.checkupCenter.email,
          address: apt.checkupCenter.addressLine,
          city: apt.checkupCenter.city,
          state: apt.checkupCenter.state,
          verificationStatus: apt.checkupCenter.verificationStatus,
        },
        patient: apt.patient,
      })),
    ].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    res.status(200).json({
      appointments,
      upcoming: appointments.filter(apt => apt.status === 'UPCOMING'),
      past: appointments.filter(apt => apt.status === 'PAST'),
      total: appointments.length,
    });
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
};

// Get next visits for patient (alias for mobile app compatibility)
export const getNextVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can access their next visits' });
      return;
    }

    const now = new Date();

    // Get upcoming doctor visits
    const doctorVisits = await prisma.doctorNextVisit.findMany({
      where: {
        patientId,
        nextVisit: {
          gte: now,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            phone: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
      take: 10,
    });

    // Get upcoming checkup visits
    const checkupVisits = await prisma.checkupCenterNextVisit.findMany({
      where: {
        patientId,
        nextVisit: {
          gte: now,
        },
      },
      include: {
        checkupCenter: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
      take: 10,
    });

    const nextVisits = [
      ...doctorVisits.map(visit => ({
        id: visit.id,
        type: 'DOCTOR_VISIT',
        nextVisit: visit.nextVisit,
        provider: visit.doctor,
        providerType: 'doctor',
      })),
      ...checkupVisits.map(visit => ({
        id: visit.id,
        type: 'CHECKUP',
        nextVisit: visit.nextVisit,
        provider: visit.checkupCenter,
        providerType: 'checkup_center',
      })),
    ].sort((a, b) => new Date(a.nextVisit).getTime() - new Date(b.nextVisit).getTime());

    res.status(200).json(nextVisits);
  } catch (error) {
    console.error('Error getting next visits:', error);
    res.status(500).json({ error: 'Failed to get next visits' });
  }
};

// Schedule doctor appointment
export const scheduleDoctorAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, nextVisit } = req.body;
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can schedule appointments' });
      return;
    }

    if (!doctorId || !nextVisit) {
      res.status(400).json({ error: 'Doctor ID and appointment date are required' });
      return;
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    // Verify appointment date is in the future
    if (new Date(nextVisit) <= new Date()) {
      res.status(400).json({ error: 'Appointment date must be in the future' });
      return;
    }

    // Check if appointment already exists for this date/time
    const existingAppointment = await prisma.doctorNextVisit.findFirst({
      where: {
        doctorId,
        nextVisit: new Date(nextVisit),
      },
    });

    if (existingAppointment) {
      res.status(409).json({ error: 'This time slot is already booked' });
      return;
    }

    // Create appointment
    const appointment = await prisma.doctorNextVisit.create({
      data: {
        doctorId,
        patientId,
        nextVisit: new Date(nextVisit),
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            phone: true,
            email: true,
            city: true,
            state: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Add patient to doctor's patient list if not already added
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        patients: {
          connect: { id: patientId },
        },
      },
    }).catch(() => {
      // Patient might already be connected, ignore error
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error scheduling doctor appointment:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
};

// Schedule checkup center appointment
export const scheduleCheckupAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { checkupCenterId, nextVisit } = req.body;
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can schedule appointments' });
      return;
    }

    if (!checkupCenterId || !nextVisit) {
      res.status(400).json({ error: 'Checkup center ID and appointment date are required' });
      return;
    }

    // Verify checkup center exists
    const checkupCenter = await prisma.checkupCenter.findUnique({
      where: { id: checkupCenterId },
    });

    if (!checkupCenter) {
      res.status(404).json({ error: 'Checkup center not found' });
      return;
    }

    // Verify appointment date is in the future
    if (new Date(nextVisit) <= new Date()) {
      res.status(400).json({ error: 'Appointment date must be in the future' });
      return;
    }

    // Check if appointment already exists for this date/time
    const existingAppointment = await prisma.checkupCenterNextVisit.findFirst({
      where: {
        checkupCenterId,
        nextVisit: new Date(nextVisit),
      },
    });

    if (existingAppointment) {
      res.status(409).json({ error: 'This time slot is already booked' });
      return;
    }

    // Create appointment
    const appointment = await prisma.checkupCenterNextVisit.create({
      data: {
        checkupCenterId,
        patientId,
        nextVisit: new Date(nextVisit),
      },
      include: {
        checkupCenter: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Add patient to checkup center's patient list if not already added
    await prisma.checkupCenter.update({
      where: { id: checkupCenterId },
      data: {
        patients: {
          connect: { id: patientId },
        },
      },
    }).catch(() => {
      // Patient might already be connected, ignore error
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error scheduling checkup appointment:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
};

// Cancel doctor appointment
export const cancelDoctorAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can cancel their appointments' });
      return;
    }

    // Find and verify appointment belongs to patient
    const appointment = await prisma.doctorNextVisit.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (appointment.patientId !== patientId) {
      res.status(403).json({ error: 'You can only cancel your own appointments' });
      return;
    }

    // Delete appointment
    await prisma.doctorNextVisit.delete({
      where: { id: appointmentId },
    });

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling doctor appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Cancel checkup appointment
export const cancelCheckupAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || userRole !== Role.PATIENT) {
      res.status(403).json({ error: 'Only patients can cancel their appointments' });
      return;
    }

    // Find and verify appointment belongs to patient
    const appointment = await prisma.checkupCenterNextVisit.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (appointment.patientId !== patientId) {
      res.status(403).json({ error: 'You can only cancel your own appointments' });
      return;
    }

    // Delete appointment
    await prisma.checkupCenterNextVisit.delete({
      where: { id: appointmentId },
    });

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling checkup appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get doctor's appointments (for doctor dashboard)
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.userId;
    const userRole = req.user?.role;

    if (!doctorId || userRole !== Role.DOCTOR) {
      res.status(403).json({ error: 'Only doctors can access their appointments' });
      return;
    }

    const appointments = await prisma.doctorNextVisit.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error getting doctor appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
};

// Get checkup center's appointments (for checkup center dashboard)
export const getCheckupCenterAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const checkupCenterId = req.user?.userId;
    const userRole = req.user?.role;

    if (!checkupCenterId || userRole !== Role.CHECKUP_CENTER) {
      res.status(403).json({ error: 'Only checkup centers can access their appointments' });
      return;
    }

    const appointments = await prisma.checkupCenterNextVisit.findMany({
      where: { checkupCenterId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        nextVisit: 'asc',
      },
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error getting checkup center appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
}; 