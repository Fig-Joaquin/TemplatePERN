/**
 * Utility functions for date handling with Chilean timezone
 */

/**
 * Gets the current date-time in Chile's timezone (Santiago)
 * @returns Date object set to Chile's timezone
 */
export const getChileanDateTime = (): Date => {
  // Create a date representing the current moment
  const now = new Date();
  
  // Get the Chilean time parts
  const chileanDateParts = now.toLocaleString("en-US", { 
    timeZone: "America/Santiago",
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).split(', ');
  
  // Parse date parts
  const [month, day, year] = chileanDateParts[0].split('/').map(Number);
  const [hour, minute, second] = chileanDateParts[1].split(':').map(Number);
  
  // Create a new Date object with Chilean time parts
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Returns a UTC ISO string that will represent Chilean time when stored in the database.
 * 
 * This works by calculating the UTC time that corresponds to the current Chilean time,
 * so when the backend stores it as UTC, it represents the actual Chilean time.
 * 
 * @returns ISO string with adjusted UTC time to represent Chilean time
 */
export const getChileanISOString = (): string => {
  const now = new Date();
  
  // Get the Chilean time parts
  const chileanDateParts = now.toLocaleString("en-US", { 
    timeZone: "America/Santiago",
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).split(', ');
  
  // Parse date parts
  const [month, day, year] = chileanDateParts[0].split('/').map(Number);
  const [hour, minute, second] = chileanDateParts[1].split(':').map(Number);
  
  // Create a UTC Date object but with the Chile local time values
  // By not applying timezone offset, we ensure the time stored in the database
  // is exactly the Chilean time we want
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  
  return utcDate.toISOString();
};

/**
 * Formats a date to Chilean format
 * @param date - The date to format
 * @returns Formatted date string in Chilean format
 */
export const formatChileanDate = (date: Date | string): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("es-CL", { 
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Formats a date to Chilean short date format (without time)
 * @param date - The date to format
 * @returns Formatted date string in Chilean short format
 */
export const formatChileanShortDate = (date: Date | string): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("es-CL", { 
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};
