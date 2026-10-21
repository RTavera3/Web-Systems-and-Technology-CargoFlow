import { listBookings } from './storage.js';

/**
 * Shared demo records used by the transaction history, profile summary,
 * and booking conversations so every page presents the same set.
 */
export const SAMPLE_TRANSACTIONS = [
  {
    code: 'CF-24810293',
    from: 'Manila',
    to: 'Cebu',
    pickupDate: '2026-09-10',
    payment: 'GCash',
    cost: 8450,
    status: 'In Transit',
    trackable: true,
    eta: '2026-09-15',
    carrier: 'LBC Express',
    booking: null,
  },
  {
    code: 'CF-24750118',
    from: 'Quezon City',
    to: 'Davao',
    pickupDate: '2026-08-28',
    payment: 'Credit or debit card',
    cost: 12300,
    status: 'Delivered',
    trackable: true,
    carrier: 'Carrier support',
    booking: null,
  },
  {
    code: 'CF-24690457',
    from: 'Pasig',
    to: 'Iloilo',
    pickupDate: '2026-08-12',
    payment: 'Cash on pickup',
    cost: 6900,
    status: 'Delivered',
    trackable: true,
    carrier: 'Carrier support',
    booking: null,
  },
  {
    code: 'CF-24610932',
    from: 'Makati',
    to: 'Baguio',
    pickupDate: '2026-07-30',
    payment: 'GCash',
    cost: 3750,
    status: 'Delivered',
    trackable: true,
    carrier: 'Carrier support',
    booking: null,
  },
];

function normalizeBooking(code, booking) {
  return {
    code,
    from: booking.from,
    to: booking.to,
    pickupDate: booking.pickupDate,
    payment: booking.paymentMethod?.trim() || 'Not provided',
    cost: null,
    status: 'Booking Placed',
    trackable: true,
    eta: null,
    carrier: 'Carrier match pending',
    booking,
  };
}

/** Returns saved bookings and demo records once each, with saved data taking precedence. */
export function getTransactionRecords() {
  const savedBookings = listBookings().map(({ code, ...booking }) => normalizeBooking(code, booking));
  const savedCodes = new Set(savedBookings.map(({ code }) => code));
  return [
    ...savedBookings,
    ...SAMPLE_TRANSACTIONS.filter(({ code }) => !savedCodes.has(code)),
  ];
}
