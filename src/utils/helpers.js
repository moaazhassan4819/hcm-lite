// Get today's date string YYYY-MM-DD in local time
export const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

// Format any date to YYYY-MM-DD
export const toDateString = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Calculate working days between two dates (inclusive) based on workingDays array
export const countWorkingDays = (startDate, endDate, workingDays = [1, 2, 3, 4, 5]) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay(); // 0=Sun ... 6=Sat
    if (workingDays.includes(day)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Parse HH:mm to minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Simple distance calculation (Haversine) in meters
export const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
