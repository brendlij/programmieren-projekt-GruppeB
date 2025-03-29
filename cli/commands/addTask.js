// cli/commands/addTask.js
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

const addTask = async (currentUser) => {
  console.clear();
  const tasks = await loadTasks();
  const data = await loadData();

  printSeparator();
  console.log(chalk.bold.green("✨ Add a New Task"));
  printSeparator();

  const taskInput = await inquirer.prompt([
    { name: "title", message: chalk.cyan("📝 Task Title:") },
    { name: "description", message: chalk.cyan("📄 Task Description:") },
  ]);

  // Use registered users for assignment
  const users = await loadUsers();
  const userChoices = users.map((user) => `${user.username} (${user.name})`);
  userChoices.push("➕ Add New Person", "🔙 Back");

  const { assignedTo } = await inquirer.prompt([
    {
      type: "list",
      name: "assignedTo",
      message: chalk.cyan("👤 Assign to:"),
      choices: userChoices,
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
    const usersList = await loadUsers();
    usersList.push(newUser);
    await saveUsers(usersList);
    finalAssignedTo = newUser.username;
  } else {
    finalAssignedTo = assignedTo.split(" ")[0];
  }

  // Select or create a category
  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: chalk.cyan("📂 Select Category:"),
      choices: [...data.categories, "➕ Add New Category", "🔙 Back"],
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

  // Save updated categories & people
  await saveData(data);

  // Deadline input
  const { deadline } = await inquirer.prompt([
    {
      name: "deadline",
      message: chalk.cyan(
        "⏳ Deadline (e.g., 'tomorrow 15:30', 'next Monday 10:00'):"
      ),
    },
  ]);

  console.log(chalk.blue("\n🤖 AI analyzing task & correcting spelling..."));

  try {
    const aiResult = await classifyTaskAI(
      taskInput.title,
      taskInput.description,
      deadline
    );

    const newTask = new Task(
      aiResult.correctedTitle,
      aiResult.correctedDescription,
      finalAssignedTo,
      aiResult.deadline,
      aiResult.priority,
      [finalCategory]
    );

    tasks.push(newTask);
    await saveTasks(tasks);

    printSeparator();
    console.log(chalk.green("✅ Task Added Successfully!"));
    console.log(
      chalk.yellow(
        `📂 Category: ${finalCategory} | 🔥 Priority: ${aiResult.priority}`
      )
    );
    console.log(chalk.magenta(`⏳ Deadline: ${aiResult.deadline}`));
    printSeparator();

    await inquirer.prompt([
      {
        name: "continue",
        message: chalk.gray("Press ENTER to return to menu"),
        type: "input",
      },
    ]);
  } catch (error) {
    console.log(chalk.red("❌ Error adding task:", error));
  }
};

export default addTask;
