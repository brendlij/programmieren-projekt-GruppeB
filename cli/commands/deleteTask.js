// cli/commands/deleteTask.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadTasks, saveTasks } from "../../utils/storage.js";
import { printSeparator } from "../helpers.js";

const deleteTask = async (currentUser) => {
  console.clear();
  let tasks = await loadTasks();

  // For non-admin users, filter tasks by assigned username.
  if (currentUser.role !== "admin") {
    tasks = tasks.filter((task) => task.assignedTo === currentUser.username);
  }

  if (tasks.length === 0) {
    console.log(chalk.yellow("\n🚨 No tasks available to delete."));
    await inquirer.prompt([
      {
        name: "continue",
        message: "Press ENTER to return to menu",
        type: "input",
      },
    ]);
    return;
  }

  printSeparator();
  console.log(chalk.bold.red("🗑️ Delete a Task"));
  printSeparator();

  const taskChoices = tasks.map((task, index) => `${index + 1}. ${task.title}`);
  taskChoices.push(" ⬅️ Back");

  const { taskIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "taskIndex",
      message: chalk.cyan("🔢 Select task to delete:"),
      choices: taskChoices,
    },
  ]);

  if (taskIndex === " ⬅️ Back") {
    return;
  }

  const index = parseInt(taskIndex.split(".")[0]) - 1;
  const task = tasks[index];

  const { confirmDelete } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDelete",
      message: chalk.red(`⚠️ Are you sure you want to delete "${task.title}"?`),
      default: false,
    },
  ]);

  if (!confirmDelete) {
    console.log(chalk.yellow("❌ Task deletion cancelled."));
    await inquirer.prompt([
      {
        name: "continue",
        message: "Press ENTER to return to menu",
        type: "input",
      },
    ]);
    return;
  }

  tasks.splice(index, 1);
  await saveTasks(tasks);
  console.log(chalk.green("\n✅ Task deleted successfully."));
  await inquirer.prompt([
    {
      name: "continue",
      message: "Press ENTER to return to menu",
      type: "input",
    },
  ]);
};

export default deleteTask;
