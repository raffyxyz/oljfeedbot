/** True if `date`, viewed in `timeZone`, falls in [startHour, endHour). Handles wrap past midnight. */
export function isQuietHour(
  date: Date,
  timeZone: string,
  startHour: number,
  endHour: number,
): boolean {
  const hour =
    Number(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone }).format(date),
    ) % 24;
  return startHour <= endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
}
