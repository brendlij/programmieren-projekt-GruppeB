// cli/commands/editTask.js
import inquirer from "inquirer";
import chalk from "chalk";
import {
  loadTasks,
  saveTasks,
  loadData,
  saveData,
} from "../../utils/storage.js";
import { classifyTaskAI } from "../../utils/ai.js";
import Task from "../../models/task.js";
import dayjs from "dayjs";
import { printSeparator } from "../helpers.js";
import { loadUsers, saveUsers } from "../../utils/auth.js";

const editTask = async (currentUser) => {
  console.clear();
  const tasks = await loadTasks();
  const data = await loadData();
  const users = await loadUsers();

  if (tasks.length === 0) {
    console.log(chalk.yellow("\n🚨 No tasks available to edit."));
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
  console.log(chalk.bold.yellow("✏️ Edit a Task"));
  printSeparator();

  // Build choices list with a Back option
  const taskChoices = tasks.map((task, index) => `${index + 1}. ${task.title}`);
  taskChoices.push("🔙 Back");
  const { taskIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "taskIndex",
      message: chalk.cyan("🔢 Select task to edit:"),
      choices: taskChoices,
    },
  ]);

  if (taskIndex === "🔙 Back") {
    return;
  }

  const index = parseInt(taskIndex.split(".")[0]) - 1;
  const task = tasks[index];

  const updatedTaskInput = await inquirer.prompt([
    {
      name: "title",
      message: chalk.cyan(`📝 Task Title (${task.title}):`),
      default: task.title,
    },
    {
      name: "description",
      message: chalk.cyan(`📄 Task Description (${task.description}):`),
      default: task.description,
    },
  ]);

  // --- Assignment: Use registered users ---
  const userChoices = users.map((user) => `${user.username} (${user.name})`);
  userChoices.push("➕ Add New Person", "🔙 Back");

  // Determine default assignment using task.assignedTo.
  const assignedUser = users.find((u) => u.username === task.assignedTo);
  const defaultAssignment = assignedUser
    ? `${assignedUser.username} (${assignedUser.name})`
    : task.assignedTo;

  const { assignedTo } = await inquirer.prompt([
    {
      type: "list",
      name: "assignedTo",
      message: chalk.cyan("👤 Assign to:"),
      choices: userChoices,
      default: defaultAssignment,
    },
  ]);

  if (assignedTo === "🔙 Back") {
    return;
  }

  let finalAssignedTo = "";
  if (assignedTo === "➕ Add New Person") {
    const newUser = await inquirer.prompt([
      { name: "username", message: chalk.cyan("👤 Enter new username:") },
      {
        name: "password",
        message: chalk.cyan("Enter password:"),
        type: "password",
      },
      { name: "name", message: chalk.cyan("Enter full name:") },
      { name: "birthday", message: chalk.cyan("Enter birthday (YYYY-MM-DD):") },
      { name: "email", message: chalk.cyan("Enter email address:") },
      {
        type: "list",
        name: "role",
        message: chalk.cyan("Select role:"),
        choices: ["admin", "user"],
        default: "user",
      },
    ]);
    users.push(newUser);
    await saveUsers(users);
    finalAssignedTo = newUser.username;
  } else {
    finalAssignedTo = assignedTo.split(" ")[0];
  }
  // --- End Assignment ---

  // --- Category Selection ---
  const categoryChoices = [
    ...data.categories,
    "➕ Add New Category",
    "🔙 Back",
  ];
  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: chalk.cyan("📂 Select Category:"),
      choices: categoryChoices,
      default: task.categories[0],
    },
  ]);

  if (category === "🔙 Back") {
    return;
  }

  let finalCategory = category;
  if (category === "➕ Add New Category") {
    const { newCategory } = await inquirer.prompt([
      {
        name: "newCategory",
        message: chalk.cyan("📂 Enter new category name:"),
      },
    ]);
    finalCategory = newCategory;
    data.categories.push(newCategory);
  }
  await saveData(data);
  // --- End Category Selection ---

  // Deadline input
  const { deadline } = await inquirer.prompt([
    {
      name: "deadline",
      message: chalk.cyan(`⏳ Deadline (${task.deadline}):`),
      default: task.deadline,
    },
  ]);

  console.log(chalk.blue("\n🤖 AI analyzing task & correcting spelling..."));

  try {
    const aiResult = await classifyTaskAI(
      updatedTaskInput.title,
      updatedTaskInput.description,
      deadline
    );

    tasks[index] = new Task(
      aiResult.correctedTitle,
      aiResult.correctedDescription,
      finalAssignedTo,
      aiResult.deadline,
      aiResult.priority,
      [finalCategory]
    );

    await saveTasks(tasks);

    printSeparator();
    console.log(chalk.green("✅ Task Updated Successfully!"));
    printSeparator();

    await inquirer.prompt([
      {
        name: "continue",
        message: chalk.gray("Press ENTER to return to menu"),
        type: "input",
      },
    ]);
  } catch (error) {
    console.log(chalk.red("❌ Error updating task:", error));
  }
};

export default editTask;
