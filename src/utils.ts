import pg from 'pg';

export function parseCustomDate(dateString: string) {
  // try do regex for format '1723821134 (2024-08-16 15:12:14)'
  // result will be [] | null
  const format1Match = dateString.match(/\((.*?)\)$/);
  if (format1Match) {
    return new Date(format1Match[1]);
  }

  // Check if the date string is in the format 'Thursday, August 8, 2024 1:40:40 AM'
  const format2Match = Date.parse(dateString);
  if (!isNaN(format2Match)) {
    return new Date(format2Match);
  }

  throw new Error(`Invalid date string passed: ${dateString}`);
}

export function getPgClient() {
  return new pg.Client({
    database: process.env.DATABASE,
    host: process.env.DB_HOST,
    port: Number(process.env.PG_PORT),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  });
}
