function calculateClassesNeeded(attended, total) {
  if (!total || total <= 0) return 0;

  const currentPercentage = (attended / total) * 100;
  if (currentPercentage >= 75) {
    return 0;
  }

  const rawX = 3 * total - 4 * attended;
  return Math.max(0, Math.ceil(rawX));
}

function getAttendanceMetrics(attended, total) {
  const attendedCount = Number(attended) || 0;
  const totalCount = Number(total) || 0;

  const percentage = totalCount > 0 ? ((attendedCount / totalCount) * 100) : 0;
  const roundedPercentage = Number(percentage.toFixed(1));
  const isShortage = totalCount > 0 && roundedPercentage < 75;
  const classesNeeded = calculateClassesNeeded(attendedCount, totalCount);

  let message = 'No classes held yet';
  if (totalCount > 0) {
    if (isShortage) {
      message = `Attend next ${classesNeeded} consecutive class${classesNeeded > 1 ? 'es' : ''} to reach 75%`;
    } else {
      message = 'Attendance is on track (≥ 75%)';
    }
  }

  return {
    total: totalCount,
    attended: attendedCount,
    percentage: roundedPercentage,
    isShortage,
    classesNeeded,
    message,
  };
}

module.exports = {
  calculateClassesNeeded,
  getAttendanceMetrics,
};
