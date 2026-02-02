import { Appointment } from '../types';

export const calculateFinancialsFromAppointments = (appointments: (Appointment & { servicePrice?: number })[]) => {
  let confirmedTotal = 0;
  let pendingTotal = 0;

  appointments.forEach(appt => {
    // Use servicePrice if available (for historical accuracy), fallback to service.price
    const price = appt.servicePrice ?? appt.service?.price ?? 0;
    
    if (appt.status === 'Confirmado') {
      confirmedTotal += price;
    } else if (appt.status === 'Pendente') {
      pendingTotal += price;
    }
  });

  return {
    confirmedTotal,
    pendingTotal,
    totalRevenue: confirmedTotal + pendingTotal
  };
};
