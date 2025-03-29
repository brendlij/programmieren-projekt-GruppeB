import chalk from "chalk";

export const printSeparator = () =>
  console.log(chalk.magenta("\n────────────────────────────────────────\n"));

export const printAdminHeader = (title) => {
  console.clear();
  console.log(chalk.bgRed.white.bold("\n=== " + title + " ===\n"));
  printSeparator();
};

// Validation helpers
export const validateNotEmpty = (value) => {
  if (!value || value.trim() === "") {
    return "This field cannot be empty";
  }
  return true;
};

export const validateUsername = (value) => {
  if (!value || value.trim() === "") {
    return "Username cannot be empty";
  }
  // You could add more username validation rules here
  return true;
};

export const validatePassword = (value) => {
  if (!value || value.trim() === "") {
    return "Password cannot be empty";
  }
  if (value.length < 4) {
    return "Password must be at least 4 characters long";
  }
  return true;
};

export const validateEmail = (value) => {
  if (!value || value.trim() === "") {
    return "Email cannot be empty";
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Please enter a valid email address";
  }
  return true;
};

export const validateDate = (value) => {
  if (!value || value.trim() === "") {
    return "Date cannot be empty";
  }
  // Check for common date formats (YYYY-MM-DD or YYYY-MM-DD HH:MM)
  const dateRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/;
  if (!dateRegex.test(value)) {
    return "Please enter a valid date in YYYY-MM-DD or YYYY-MM-DD HH:MM format";
  }
  return true;
};
