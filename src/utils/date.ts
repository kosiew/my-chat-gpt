export function getHumanReadableTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function parseChatIdToDate(id: string) {
  const year = parseInt(id.slice(0, 4), 10);
  const month = parseInt(id.slice(4, 6), 10) - 1;
  const day = parseInt(id.slice(6, 8), 10);
  const hour = parseInt(id.slice(8, 10), 10);
  const minute = parseInt(id.slice(10, 12), 10);
  const second = parseInt(id.slice(12, 14), 10);

  const chatDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  return chatDate;
}
