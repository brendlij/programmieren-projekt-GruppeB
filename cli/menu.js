// cli/menu.js
import inquirer from "inquirer";
import chalk from "chalk";
import addTask from "./commands/addTask.js";
import editTask from "./commands/editTask.js";
import listTasks from "./commands/listTasks.js";
import deleteTask from "./commands/deleteTask.js";
import { printSeparator } from "./helpers.js";
import { login } from "../utils/auth.js";
import adminMenu from "./adminMenu.js";

const mainMenu = async () => {
  let currentUser = await login();

  while (true) {
    console.clear();
    printSeparator();
    console.log(chalk.bold.red("📌 Task Manager"));
    console.log(
      chalk.cyan(
        `👤 Logged in as: ${chalk.bold(currentUser.username)} (${
          currentUser.role
        })`
      )
    );
    printSeparator();

    const choices = [
      "➕ Add Task",
      "📋 List Tasks",
      "✏️  Edit Task",
      "🗑️  Delete Task",
    ];

    if (currentUser.role === "admin") {
      choices.push("🛠️  Admin Panel");
    }

    choices.push("👤 Switch User");
    choices.push("❌ Exit");

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.yellow("Select an action:"),
        choices,
      },
    ]);

    if (action === "➕ Add Task") await addTask(currentUser);
    else if (action === "📋 List Tasks") await listTasks(currentUser);
    else if (action === "✏️  Edit Task") await editTask(currentUser);
    else if (action === "🗑️  Delete Task") await deleteTask(currentUser);
    else if (action === "🛠️  Admin Panel" && currentUser.role === "admin") {
      await adminMenu(currentUser);
    } else if (action === "👤 Switch User") {
      console.clear();
      printSeparator();
      console.log(chalk.bold.blue("👤 SWITCH USER"));
      printSeparator();
      console.log(chalk.yellow(`Logging out: ${currentUser.username}`));

      // Re-authenticate with a new user
      currentUser = await login();

      console.log(chalk.green(`Switched to user: ${currentUser.username}`));
      await inquirer.prompt([
        {
          name: "continue",
          message: chalk.gray("Press ENTER to continue"),
          type: "input",
        },
      ]);
    } else if (action === "❌ Exit") {
      break;
    }
  }
};

export { mainMenu };
