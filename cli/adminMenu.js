// cli/adminMenu.js
import inquirer from "inquirer";
import chalk from "chalk";
import { printSeparator, printAdminHeader } from "./helpers.js";
import manageUsers from "./commands/admin/manageUsers.js";
import manageCategories from "./commands/admin/manageCategories.js";
import viewTasksByUser from "./commands/admin/viewTasksByUser.js";
import listTasks from "./commands/listTasks.js";

const adminMenu = async (currentUser) => {
  while (true) {
    printAdminHeader("ADMIN PANEL");
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.yellow("Select an action:"),
        choices: [
          "Manage Users",
          "Manage Categories",
          "View Tasks by User",
          "View All Tasks",
          "🔙 Back",
        ],
      },
    ]);

    if (action === "Manage Users") await manageUsers(currentUser);
    else if (action === "Manage Categories") await manageCategories();
    else if (action === "View Tasks by User") await viewTasksByUser();
    else if (action === "View All Tasks")
      await listTasks(currentUser, true); // show all tasks
    else if (action === "🔙 Back") break;

    await inquirer.prompt([
      {
        name: "continue",
        message: chalk.gray("Press ENTER to continue"),
        type: "input",
      },
    ]);
  }
};

export default adminMenu;
