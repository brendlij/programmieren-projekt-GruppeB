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
import {
  printSeparator,
  validateNotEmpty,
  validateDate,
  validateUsername,
  validatePassword,
  validateEmail,
} from "../helpers.js";
import { loadUsers, saveUsers } from "../../utils/auth.js";

const addTask = async (currentUser) => {
  console.clear();
  const tasks = await loadTasks();
  const data = await loadData();

  printSeparator();
  console.log(chalk.bold.green("✨ Add a New Task"));
  printSeparator();

  // First step - allow backing out before starting task creation
  const { confirmCreate } = await inquirer.prompt([
    {
      type: "list",
      name: "confirmCreate",
      message: chalk.cyan("Do you want to create a new task?"),
      choices: ["✅ Yes, create task", "🔙 Back to menu"],
    },
  ]);

  if (confirmCreate === "🔙 Back to menu") {
    return;
  }

  // Clear screen before task details input
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ TASK DETAILS"));
  printSeparator();

  // Now proceed with task creation
  const taskInput = await inquirer.prompt([
    {
      name: "title",
      message: chalk.cyan("📝 Task Title:"),
      validate: validateNotEmpty,
    },
    {
      name: "description",
      message: chalk.cyan("📄 Task Description:"),
      validate: validateNotEmpty,
    },
  ]);

  // Clear screen before assignment section
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ TASK ASSIGNMENT"));
  printSeparator();

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
      {
        name: "username",
        message: chalk.cyan("👤 Enter new username:"),
        validate: validateUsername,
      },
      {
        name: "password",
        message: chalk.cyan("Enter password:"),
        type: "password",
        validate: validatePassword,
      },
      {
        name: "name",
        message: chalk.cyan("Enter full name:"),
        validate: validateNotEmpty,
      },
      {
        name: "birthday",
        message: chalk.cyan("Enter birthday (YYYY-MM-DD):"),
        validate: validateDate,
      },
      {
        name: "email",
        message: chalk.cyan("Enter email address:"),
        validate: validateEmail,
      },
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

  // Clear screen before deadline and category
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ DEADLINE & CATEGORY"));
  printSeparator();

  // Deadline input
  const { deadline } = await inquirer.prompt([
    {
      name: "deadline",
      message: chalk.cyan(
        "⏳ Deadline (e.g., 'tomorrow 15:30', 'next Monday 10:00'):"
      ),
      validate: validateNotEmpty,
    },
  ]);

  // Clear the screen while AI is processing
  console.clear();
  printSeparator();
  console.log(chalk.bold.blue("🤖 AI ANALYSIS"));
  printSeparator();
  console.log("Processing your task... Please wait.");

  console.log(chalk.blue("\n🤖 AI analyzing task & correcting spelling..."));

  let aiResult;
  try {
    aiResult = await classifyTaskAI(
      taskInput.title,
      taskInput.description,
      deadline
    );
  } catch (error) {
    console.log(chalk.red("❌ Error analyzing task:", error));
    aiResult = {
      correctedTitle: taskInput.title,
      correctedDescription: taskInput.description,
      category: "General",
      priority: "low",
      deadline: dayjs()
        .add(1, "day")
        .hour(12)
        .minute(0)
        .format("YYYY-MM-DD HH:mm"),
    };
  }

  // Clear screen before category selection
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ CATEGORY SELECTION"));
  printSeparator();

  // Now handle category selection with AI suggestion
  let categoryChoices = [...data.categories];
  const aiSuggestedCategory = aiResult.category;

  // Add AI suggestion if it's not already in the list
  const aiCategoryOption = `🤖 AI Suggested: ${aiSuggestedCategory}`;
  if (!categoryChoices.includes(aiSuggestedCategory)) {
    categoryChoices = [aiCategoryOption, ...categoryChoices];
  } else {
    // If category already exists, still show it's AI recommended
    const index = categoryChoices.indexOf(aiSuggestedCategory);
    categoryChoices[index] = `${aiSuggestedCategory} (🤖 AI Suggested)`;
  }

  // Add other options
  categoryChoices.push("➕ Add New Category", "🔙 Back");

  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: chalk.cyan("📂 Select Category:"),
      choices: categoryChoices,
    },
  ]);

  if (category === "🔙 Back") {
    return;
  }

  let finalCategory;
  if (category === aiCategoryOption) {
    // User selected the AI suggestion
    finalCategory = aiSuggestedCategory;

    // Add to categories if it's new
    if (!data.categories.includes(aiSuggestedCategory)) {
      data.categories.push(aiSuggestedCategory);
      console.log(
        chalk.green(
          `✅ Added new AI-suggested category: ${chalk.bold(
            aiSuggestedCategory
          )}`
        )
      );
    }
  } else if (category === "➕ Add New Category") {
    const { newCategory } = await inquirer.prompt([
      {
        name: "newCategory",
        message: chalk.cyan("📂 Enter new category name:"),
        validate: validateNotEmpty,
      },
    ]);
    finalCategory = newCategory;
    data.categories.push(newCategory);
  } else {
    // User selected an existing category (remove the AI suggestion notation if present)
    finalCategory = category.replace(" (🤖 AI Suggested)", "");
  }

  // Save updated categories
  await saveData(data);

  // Clear screen before priority selection
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ PRIORITY SELECTION"));
  printSeparator();

  // Show AI-suggested priority with color coding
  const aiPriorityDisplay =
    aiResult.priority === "high"
      ? chalk.bold.red("HIGH")
      : aiResult.priority === "medium"
      ? chalk.yellow("MEDIUM")
      : chalk.green("LOW");

  console.log(chalk.cyan(`👉 AI suggested priority: ${aiPriorityDisplay}`));
  console.log(); // Add a little space before the prompt

  const { priority } = await inquirer.prompt([
    {
      type: "list",
      name: "priority",
      message: chalk.cyan("🔥 Select task priority:"),
      choices: [
        {
          name: `${chalk.bold.red(
            "HIGH"
          )} - Urgent, requires immediate attention`,
          value: "high",
          short: "High",
        },
        {
          name: `${chalk.yellow("MEDIUM")} - Important, but can wait a bit`,
          value: "medium",
          short: "Medium",
        },
        {
          name: `${chalk.green("LOW")} - Not time-sensitive`,
          value: "low",
          short: "Low",
        },
        {
          name: `🤖 Use AI suggestion (${aiPriorityDisplay})`,
          value: aiResult.priority,
          short: "AI suggestion",
        },
      ],
      default: aiResult.priority,
    },
  ]);

  // Create the task object using the selected priority (not the AI one)
  const newTask = new Task(
    aiResult.correctedTitle,
    aiResult.correctedDescription,
    finalAssignedTo,
    aiResult.deadline,
    priority, // Use the manually selected priority
    [finalCategory]
  );

  tasks.push(newTask);
  await saveTasks(tasks);

  // Clear screen for the success message (make it compact)
  console.clear();
  printSeparator();
  console.log(chalk.bgGreen.black("\n ✅ TASK ADDED SUCCESSFULLY \n"));

  // Make the success summary more compact
  console.log(chalk.bold(`📝 "${aiResult.correctedTitle}"`));
  console.log(`👤 Assigned to: ${chalk.cyan(finalAssignedTo)}`);
  console.log(`📂 Category: ${chalk.magenta(finalCategory)}`);
  console.log(`⏳ Deadline: ${chalk.yellow(aiResult.deadline)}`);
  console.log(
    `🔥 Priority: ${
      priority === "high"
        ? chalk.red("HIGH")
        : priority === "medium"
        ? chalk.yellow("MEDIUM")
        : chalk.green("LOW")
    }`
  );

  if (aiResult.analysis) {
    printSeparator();
    console.log(chalk.blue("🤖 AI Analysis:"));
    console.log(chalk.italic(aiResult.analysis));
  }

  printSeparator();

  await inquirer.prompt([
    {
      name: "continue",
      message: chalk.gray("Press ENTER to return to menu"),
      type: "input",
    },
  ]);
};

export default addTask;
