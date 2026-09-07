export const cities = ['Manila', 'Batangas', 'Baguio', 'Cebu', 'Davao', 'Pampanga'];

export const routes = [
  { id: 1, from: 'Manila', to: 'Batangas', carrier: 'Southbound Logistics', vehicle: 'Closed van', capacity: 800, price: 850, duration: '2–3 hours', schedule: 'Weekdays' },
  { id: 2, from: 'Manila', to: 'Baguio', carrier: 'Northline Transport', vehicle: '6-wheel truck', capacity: 1500, price: 1450, duration: '5–6 hours', schedule: 'Daily' },
  { id: 3, from: 'Cebu', to: 'Davao', carrier: 'Island Link Cargo', vehicle: 'RoRo cargo truck', capacity: 2000, price: 2200, duration: '2–3 days', schedule: 'Mon, Wed, Fri' },
  { id: 4, from: 'Manila', to: 'Pampanga', carrier: 'Central Luzon Express', vehicle: 'Closed van', capacity: 500, price: 650, duration: '1–2 hours', schedule: 'Daily' },
  { id: 5, from: 'Batangas', to: 'Manila', carrier: 'Southbound Logistics', vehicle: 'Closed van', capacity: 1000, price: 850, duration: '2–3 hours', schedule: 'Weekdays' },
];

export function findRoutes({ from = '', to = '', weight = '' } = {}) {
  const minimumCapacity = Number(weight);
  if (!Number.isFinite(minimumCapacity) || minimumCapacity < 0) return [];
  return routes.filter(route => (!from || route.from === from) && (!to || route.to === to) && route.capacity >= minimumCapacity);
}
