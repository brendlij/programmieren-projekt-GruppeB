// cli/commands/admin/manageUsers.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadUsers, saveUsers } from "../../../utils/auth.js";
import {
  printSeparator,
  printAdminHeader,
  validateNotEmpty,
  validateUsername,
  validatePassword,
  validateEmail,
  validateDate,
} from "../../helpers.js";

const loadUserList = async () => {
  try {
    const users = await loadUsers();
    return users;
  } catch (error) {
    return [];
  }
};

const listUsers = async () => {
  const users = await loadUserList();
  printAdminHeader("USER LIST");
  users.forEach((user, index) => {
    console.log(
      `${chalk.cyan(index + 1)}. ${chalk.white.bold(
        user.username
      )} | ${chalk.green(user.name)} | ${chalk.yellow(user.role)} | Birthday: ${
        user.birthday
      } | Email: ${user.email}`
    );
  });
  printSeparator();
};

const addUser = async () => {
  // Ask if the admin wants to proceed or go back.
  const { confirmAdd } = await inquirer.prompt([
    {
      type: "list",
      name: "confirmAdd",
      message: "Do you want to add a new user?",
      choices: ["Yes", "🔙 Back"],
    },
  ]);
  if (confirmAdd === "🔙 Back") {
    return;
  }

  const users = await loadUserList();

  // Add validation to all fields
  const answers = await inquirer.prompt([
    {
      name: "username",
      message: "Enter username:",
      validate: validateUsername,
    },
    {
      name: "password",
      message: "Enter password:",
      type: "password",
      validate: validatePassword,
    },
    {
      name: "name",
      message: "Enter full name:",
      validate: validateNotEmpty,
    },
    {
      name: "birthday",
      message: "Enter birthday (YYYY-MM-DD):",
      validate: validateDate,
    },
    {
      name: "email",
      message: "Enter email address:",
      validate: validateEmail,
    },
    {
      type: "list",
      name: "role",
      message: "Select role:",
      choices: ["admin", "user"],
    },
  ]);

  // Check for duplicate usernames
  if (users.some((user) => user.username === answers.username)) {
    console.log(
      chalk.red(
        `Username "${answers.username}" already exists. Please choose another username.`
      )
    );
    return await addUser();
  }

  users.push(answers);
  await saveUsers(users);
  console.log(chalk.green("✅ User added successfully!"));
};

const editUser = async () => {
  let users = await loadUserList();
  const choices = users.map((user, index) => `${index + 1}. ${user.username}`);
  choices.push("🔙 Back");

  const { userIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "userIndex",
      message: "Select user to edit:",
      choices,
    },
  ]);

  if (userIndex === "🔙 Back") {
    return;
  }

  const index = parseInt(userIndex.split(".")[0]) - 1;
  const user = users[index];
  const originalUsername = user.username;

  // Add validation to all input fields
  const answers = await inquirer.prompt([
    {
      name: "username",
      message: `Enter new username (current: ${user.username}):`,
      default: user.username,
      validate: validateUsername,
    },
    {
      name: "password",
      message: "Enter new password:",
      type: "password",
      default: user.password,
      validate: validatePassword,
    },
    {
      name: "name",
      message: `Enter full name (current: ${user.name}):`,
      default: user.name,
      validate: validateNotEmpty,
    },
    {
      name: "birthday",
      message: `Enter birthday (current: ${user.birthday}):`,
      default: user.birthday,
      validate: validateDate,
    },
    {
      name: "email",
      message: `Enter email (current: ${user.email}):`,
      default: user.email,
      validate: validateEmail,
    },
    {
      type: "list",
      name: "role",
      message: "Select role:",
      choices: ["admin", "user"],
      default: user.role,
    },
  ]);

  // Check for duplicate username only if username was changed
  if (
    answers.username !== originalUsername &&
    users.some((u) => u.username === answers.username)
  ) {
    console.log(
      chalk.red(
        `Username "${answers.username}" already exists. Please choose another username.`
      )
    );
    return await editUser();
  }

  users[index] = answers;
  await saveUsers(users);
  console.log(chalk.green("✅ User updated successfully!"));
};

const deleteUser = async (currentUser) => {
  let users = await loadUserList();
  // Build choices including a "Back" option.
  const choices = users.map((user, index) => `${index + 1}. ${user.username}`);
  choices.push("🔙 Back");

  const { userIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "userIndex",
      message: "Select user to delete:",
      choices,
    },
  ]);

  // If "Back" is selected, return immediately.
  if (userIndex === "🔙 Back") {
    return;
  }

  // Extract the index from the selection string.
  const index = parseInt(userIndex.split(".")[0]) - 1;
  if (index < 0 || index >= users.length) {
    console.log(chalk.red("❌ Invalid selection."));
    return;
  }

  // Prevent deletion if the selected user is the current admin.
  if (users[index].username === currentUser.username) {
    console.log(chalk.red("❌ You cannot delete your own account."));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to delete ${users[index].username}?`,
    },
  ]);

  if (confirm) {
    users.splice(index, 1);
    await saveUsers(users);
    console.log(chalk.green("✅ User deleted successfully!"));
  }
};

const manageUsers = async (currentUser) => {
  while (true) {
    printAdminHeader("MANAGE USERS");
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select an action:",
        choices: [
          "List Users",
          "Add User",
          "Edit User",
          "Delete User",
          "🔙 Back",
        ],
      },
    ]);
    if (action === "List Users") await listUsers();
    else if (action === "Add User") await addUser();
    else if (action === "Edit User") await editUser();
    else if (action === "Delete User") await deleteUser(currentUser);
    else if (action === "🔙 Back") break;

    await inquirer.prompt([
      { name: "continue", message: "Press ENTER to continue", type: "input" },
    ]);
  }
};

export default manageUsers;
