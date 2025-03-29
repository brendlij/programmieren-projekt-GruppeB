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
  const currentUser = await login();

  while (true) {
    console.clear();
    printSeparator();
    console.log(chalk.bold.red("📌 Task Manager"));
    printSeparator();

    const choices = [
      "➕ Add Task",
      "📋 List Tasks",
      "✏️ Edit Task",
      "🗑️ Delete Task",
    ];

    if (currentUser.role === "admin") {
      choices.push("🛠️ Admin Panel");
    }
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
    else if (action === "✏️ Edit Task") await editTask(currentUser);
    else if (action === "🗑️ Delete Task") await deleteTask(currentUser);
    else if (action === "🛠️ Admin Panel" && currentUser.role === "admin") {
      await adminMenu();
    } else if (action === "❌ Exit") {
      break;
    }
  }
};

export { mainMenu };
