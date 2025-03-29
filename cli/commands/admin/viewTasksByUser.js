// cli/commands/admin/viewTasksByUser.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadTasks } from "../../../utils/storage.js";
import { printSeparator, printAdminHeader } from "../../helpers.js";

const viewTasksByUser = async () => {
  const tasks = await loadTasks();
  let assignedUsers = [...new Set(tasks.map((task) => task.assignedTo))];
  assignedUsers.push("🔙 Back");

  if (assignedUsers.length === 1) {
    console.log(chalk.yellow("No tasks are assigned to any user."));
    await inquirer.prompt([
      {
        name: "continue",
        message: "Press ENTER to return to menu",
        type: "input",
      },
    ]);
    return;
  }

  const { user } = await inquirer.prompt([
    {
      type: "list",
      name: "user",
      message: "Select a user to view tasks:",
      choices: assignedUsers,
    },
  ]);

  if (user === "🔙 Back") {
    return;
  }

  const filteredTasks = tasks.filter((task) => task.assignedTo === user);
  printAdminHeader("TASKS BY USER");
  console.log(chalk.bold(`Tasks assigned to: ${user}`));
  printSeparator();
  if (filteredTasks.length === 0) {
    console.log(chalk.yellow("No tasks found for this user."));
  } else {
    filteredTasks.forEach((task, index) => {
      console.log(
        `${chalk.cyan(index + 1)}. ${chalk.white(task.title)} - Deadline: ${
          task.deadline
        }`
      );
    });
  }
  await inquirer.prompt([
    {
      name: "continue",
      message: "Press ENTER to return to menu",
      type: "input",
    },
  ]);
};

export default viewTasksByUser;
