// utils/auth.js
import fs from "fs-extra";
import inquirer from "inquirer";
import chalk from "chalk";
import {
  validateNotEmpty,
  validateUsername,
  validatePassword,
  validateEmail,
  validateDate,
} from "../cli/helpers.js";

const USERS_FILE = "users.json";

export const loadUsers = async () => {
  try {
    const users = await fs.readJson(USERS_FILE);
    if (!users || users.length === 0) {
      throw new Error("No users found");
    }
    return users;
  } catch (error) {
    console.log(chalk.yellow("No users found. Let's create an admin user."));
    const adminUser = await inquirer.prompt([
      {
        name: "username",
        message: "Enter admin username:",
        validate: validateUsername,
      },
      {
        name: "password",
        message: "Enter admin password:",
        type: "password",
        validate: validatePassword,
      },
      {
        name: "name",
        message: "Enter admin full name:",
        validate: validateNotEmpty,
      },
      {
        name: "birthday",
        message: "Enter admin birthday (YYYY-MM-DD):",
        validate: validateDate,
      },
      {
        name: "email",
        message: "Enter admin email address:",
        validate: validateEmail,
      },
    ]);
    adminUser.role = "admin";
    await fs.writeJson(USERS_FILE, [adminUser], { spaces: 2 });
    console.log(chalk.green("Admin user created successfully!"));
    return [adminUser];
  }
};

export const saveUsers = async (users) => {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
};

export const login = async () => {
  const users = await loadUsers();

  // Prompt for username only.
  const { username } = await inquirer.prompt([
    {
      name: "username",
      message: "Username:",
      validate: validateUsername,
    },
  ]);
  const user = users.find((u) => u.username === username);
  if (!user) {
    console.log(
      chalk.red(`Username "${username}" doesn't exist. Please try again.`)
    );
    return await login();
  }

  // Prompt for password.
  const { password } = await inquirer.prompt([
    {
      name: "password",
      message: "Password:",
      type: "password",
      validate: validatePassword,
    },
  ]);
  if (user.password !== password) {
    console.log(
      chalk.red(`Incorrect password for "${username}". Please try again.`)
    );
    return await login();
  }

  console.log(chalk.green(`Welcome, ${username}!`));
  return user;
};

// Added helper function for authentication - useful for API integration later
export const authenticateUser = async (username, password) => {
  const users = await loadUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
};
