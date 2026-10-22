import { listBookings } from './api.js';

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

/**
 * One booking from the server (GET /api/bookings, summary fields only) as a
 * transaction record. The server saves no price, so `cost` is null.
 */
function normalizeBooking(booking) {
  return {
    code: booking.code,
    from: booking.from,
    to: booking.to,
    pickupDate: booking.date,
    payment: booking.paymentMethod?.trim() || 'Not provided',
    cost: null,
    status: booking.status || 'Booking Placed',
    trackable: true,
    eta: null,
    carrier: 'Carrier match pending',
    createdAt: booking.createdAt,
    booking,
  };
}

/**
 * Saved bookings from the server and the demo records, once each, with saved
 * data taking precedence. If the server can't be reached, only the demo
 * records are returned so the pages still work.
 * @returns {Promise<object[]>}
 */
export async function getTransactionRecords() {
  let savedBookings = [];
  try {
    savedBookings = (await listBookings()).map(normalizeBooking);
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
  const savedCodes = new Set(savedBookings.map(({ code }) => code));
  return [
    ...savedBookings,
    ...SAMPLE_TRANSACTIONS.filter(({ code }) => !savedCodes.has(code)),
  ];
}
