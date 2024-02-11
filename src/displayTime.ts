export function displayTime(time_ms: number): string | undefined {
  const s = Math.round(time_ms / 1000);
  const minutes = String(Math.floor(s / 60));
  const seconds = String(s % 60);

  return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}
