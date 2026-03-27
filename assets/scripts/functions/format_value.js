export function convert_decimal_place(value, decimal) {
  const value_float = parseFloat(value);
  const converted_value = value_float.toLocaleString(undefined, {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
  return converted_value;
}

export function formate_date(date_value, format) {
  const current_date = new Date(date_value);
  const month = (current_date.getMonth() + 1).toString().padStart(2, "0");
  const day = current_date.getDate().toString().padStart(2, "0");
  const year = current_date.getFullYear();
  if (format === "mm/dd/yyyy") {
    const formatted_date = `${month}/${day}/${year}`;
    return formatted_date;
  } else if (format === "mm-dd-yyyy") {
    const formatted_date = `${month}-${day}-${year}`;
    return formatted_date;
  } else {
    return "";
  }
}

export function format_date(date_value) {
  const current_date = new Date(date_value);
  const month = (current_date.getMonth() + 1).toString().padStart(2, "0");
  const day = current_date.getDate().toString().padStart(2, "0");
  const year = current_date.getFullYear();
  const formatted_date = `${month}/${day}/${year}`;
  return formatted_date;
}

// export function convert_string_to_date(dateString) {
//   const [month, day, year] = dateString.split("/");
//   return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
// }

export function convert_string_to_date(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("/");

  if (parts.length !== 3) return null;

  const [month, day, year] = parts.map((part) => parseInt(part));

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

  return new Date(year, month - 1, day);
}

export function format_deploy_status(value) {
  switch (value) {
    case 0:
      return "Select Deployment Status";
    case 1:
      return "On-Board";
    case 2:
      return "AWOL";
    case 3:
      return "Resigned";
    case 4:
      return "Vacant";
  }
}

export function format_attendance_status(value) {
  switch (value) {
    case 0:
      return "Select Attendance Status";
    case 1:
      return "Present";
    case 2:
      return "Absent";
    case 3:
      return "Present - Late";
    case 4:
      return "Present - Changed Schedule";
    case 5:
      return "Present - Roving";
  }
}

export function convert_date_to_unix(dateString) {
  // Split the date string into components
  const parts = dateString.split("/");
  if (parts.length !== 3) {
    throw new Error("Invalid date format. Please use MM/DD/YYYY.");
  }

  // Extract month, day, and year from the parts
  const month = parseInt(parts[0], 10) - 1; // Months are zero-indexed in JavaScript Date
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Create a new Date object with the specified time set to 00:00:00
  const date = new Date(year, month, day, 0, 0, 0);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date. Please ensure the date is correct.");
  }

  // Convert the date to a Unix timestamp (in seconds)
  const unixTimestamp = Math.floor(date.getTime() / 1000);

  return unixTimestamp;
}

export function format_date_with_time(date_value) {
  const currentDate = new Date(date_value);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const year = currentDate.getFullYear();

  const formattedDate = `${month}/${day}/${year}`;

  const customDate = new Date(date_value);
  const hours = customDate.getHours();
  const minutes = customDate.getMinutes();
  const seconds = customDate.getSeconds();
  const amOrPm = hours >= 12 ? "PM" : "AM";
  const formattedHours = String(hours % 12 === 0 ? 12 : hours % 12).padStart(
    2,
    "0",
  );
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const formattedTime = `${formattedHours}:${formattedMinutes} ${amOrPm}`;

  return `${formattedDate} - ${formattedTime}`;
}

export function format_diser_time_sched(date_value) {
  const currentDate = new Date(date_value);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const year = currentDate.getFullYear();

  const formattedDate = `${month}/${day}/${year}`;

  const customDate = new Date(date_value);
  const hours = customDate.getHours().toString().padStart(2, "0"); // Military time hour
  const minutes = customDate.getMinutes().toString().padStart(2, "0");
  const seconds = customDate.getSeconds().toString().padStart(2, "0");

  const formattedTime = `${hours}:${minutes}:${seconds}`; // Military time format

  return `${formattedDate} ${formattedTime}`;
}

export function get_time(date_value) {
  const now = new Date(date_value);
  let hours = now.getHours();
  const minutes = now.getMinutes();

  // Determine AM or PM suffix
  const amPm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12 || 12; // If hours is 0, set it to 12

  // Format minutes to be two digits
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes} ${amPm}`;
}
