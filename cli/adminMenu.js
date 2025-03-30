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
    console.clear();
    printAdminHeader("ADMIN PANEL");
    console.log(
      chalk.cyan(
        `👤 Logged in as: ${chalk.bold(currentUser.username)} (${
          currentUser.role
        })`
      )
    );
    printSeparator();

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.yellow("Select an action:"),
        choices: [
          "👥 Manage Users",
          "📂 Manage Categories",
          "👤 View Tasks by User",
          "📋 View All Tasks",
          " ⬅️ Back to Main Menu",
        ],
      },
    ]);

    if (action === "👥 Manage Users") await manageUsers(currentUser);
    else if (action === "📂 Manage Categories") await manageCategories();
    else if (action === "👤 View Tasks by User") await viewTasksByUser();
    else if (action === "📋 View All Tasks")
      await listTasks(currentUser, true); // show all tasks
    else if (action === " ⬅️ Back to Main Menu") break;

    if (action !== " ⬅️ Back to Main Menu") {
      await inquirer.prompt([
        {
          name: "continue",
          message: chalk.gray("Press ENTER to return to admin menu"),
          type: "input",
        },
      ]);
    }
  }
};

export default adminMenu;
