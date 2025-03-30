// utils/auth.js
import fs from "fs-extra";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dayjs from "dayjs";
import OpenAI from "openai";
import { validateUsername, validatePassword } from "../cli/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const USERS_FILE = join(__dirname, "../users.json");
const openai = new OpenAI();

// Get a motivational quote - either from the API or from a predefined list
const getMotivationalQuote = async () => {
  try {
    // Option 1: Use OpenAI to generate a quote (using your existing API key)
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "system",
          content:
            "Generate a short, inspiring motivational quote about productivity, work, or task management (under 120 characters). No attribution needed.",
        },
      ],
    });
    return response.output_text.trim().replace(/^"|"$/g, "");
  } catch (error) {
    // Option 2: Fallback to predefined quotes if API call fails
    const quotes = [
      "The key to productivity is not working harder, but working smarter.",
      "Don't count the days, make the days count.",
      "The way to get started is to quit talking and begin doing.",
      "Focus on being productive instead of busy.",
      "Your daily choices define your success.",
      "Small progress is still progress.",
      "The best time to start was yesterday, the next best time is now.",
      "Discipline is choosing between what you want now and what you want most.",
      "Great things are done by a series of small things brought together.",
      "Productivity is never an accident. It's the result of a commitment to excellence.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
};

export const loadUsers = async () => {
  try {
    if (await fs.exists(USERS_FILE)) {
      return await fs.readJson(USERS_FILE);
    } else {
      await fs.writeJson(USERS_FILE, [], { spaces: 2 });
      return [];
    }
  } catch (error) {
    console.log("Error loading users:", error);
    return [];
  }
};

export const saveUsers = async (users) => {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
};

export const login = async () => {
  console.clear();
  const users = await loadUsers();

  // Get current time information
  const now = dayjs();
  const dateStr = now.format("MMMM D, YYYY");
  const timeStr = now.format("HH:mm");
  const weekdayStr = now.format("dddd");

  // Get motivational quote
  const quote = await getMotivationalQuote();

  // Display the enhanced login screen header
  console.log(
    chalk.bold.blue(`
  ████████╗ █████╗ ███████╗██╗  ██╗
  ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
     ██║   ███████║███████╗█████╔╝ 
     ██║   ██╔══██║╚════██║██╔═██╗ 
     ██║   ██║  ██║███████║██║  ██╗
     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
  `)
  );
  console.log(
    chalk.bold.magenta.bgBlue("\n       📝 Task Manager CLI       \n")
  );

  // Date and time section
  console.log(chalk.yellow("┌─────────────────────────────────────────┐"));
  console.log(
    chalk.yellow("│ ") +
      chalk.bold.white(
        `Today is ${chalk.cyan(weekdayStr)}, ${chalk.cyan(dateStr)}`
      ) +
      chalk.yellow(" │")
  );
  console.log(
    chalk.yellow("│ ") +
      chalk.bold.white(`Current time: ${chalk.cyan(timeStr)}`) +
      chalk.yellow("            │")
  );
  console.log(chalk.yellow("└─────────────────────────────────────────┘"));

  // Motivational quote
  console.log(chalk.green("\n✨ " + chalk.italic(quote) + " ✨\n"));

  // Login section header
  console.log(chalk.bold.yellow("👤 PLEASE LOG IN"));
  console.log(chalk.gray("─────────────────────────────────────────"));

  // Handle first-time setup (no users)
  if (users.length === 0) {
    console.log(chalk.bold.green("\n🚀 FIRST-TIME SETUP"));
    console.log(chalk.gray("─────────────────────────────────────────"));
    console.log(
      chalk.cyan("No users exist yet. Please create an admin account.")
    );

    const newAdmin = await inquirer.prompt([
      {
        name: "username",
        message: chalk.cyan("Username:"),
        validate: validateUsername,
      },
      {
        name: "password",
        message: chalk.cyan("Password:"),
        type: "password",
        validate: validatePassword,
      },
      {
        name: "name",
        message: chalk.cyan("Full Name:"),
        validate: (input) => input.trim() !== "" || "Name cannot be empty",
      },
      {
        name: "birthday",
        message: chalk.cyan("Birthday (YYYY-MM-DD):"),
        validate: (input) => {
          const date = dayjs(input);
          return (
            date.isValid() || "Please enter a valid date in YYYY-MM-DD format"
          );
        },
      },
      {
        name: "email",
        message: chalk.cyan("Email:"),
        validate: (input) => {
          return (
            /\S+@\S+\.\S+/.test(input) || "Please enter a valid email address"
          );
        },
      },
    ]);

    newAdmin.role = "admin";
    users.push(newAdmin);
    await saveUsers(users);

    console.log(
      chalk.green(
        `\n✅ Admin user ${chalk.bold(newAdmin.username)} created successfully!`
      )
    );
    return newAdmin;
  }

  // Regular login flow
  const { username } = await inquirer.prompt([
    {
      name: "username",
      message: chalk.cyan("Username:"),
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

  const { password } = await inquirer.prompt([
    {
      name: "password",
      message: chalk.cyan("Password:"),
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

  console.log(chalk.green(`\n✅ Welcome, ${chalk.bold(username)}!`));
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
