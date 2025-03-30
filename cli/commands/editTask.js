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
import {
  printSeparator,
  validateNotEmpty,
  validateDate,
  validateUsername,
  validatePassword,
  validateEmail,
} from "../helpers.js";
import { loadUsers, saveUsers } from "../../utils/auth.js";

const editTask = async (currentUser) => {
  console.clear();
  let tasks = await loadTasks();
  const data = await loadData();
  const users = await loadUsers();

  // Filter tasks by assigned username for non-admin users
  if (currentUser.role !== "admin") {
    tasks = tasks.filter((task) => task.assignedTo === currentUser.username);
  }

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
  console.log(chalk.bold.yellow.bgBlue("\n ✏️  EDIT TASK \n"));
  printSeparator();

  // Enhanced task selection UI with colored priority indicators and deadline info
  const now = dayjs();

  const taskChoices = tasks.map((task, index) => {
    const deadline = dayjs(task.deadline);
    const daysLeft = deadline.diff(now, "day");
    let statusIndicator = "🟢"; // Default green for tasks with plenty of time

    if (daysLeft < 0) {
      statusIndicator = "⚠️"; // Overdue tasks
    } else if (daysLeft < 3) {
      statusIndicator = "🔴"; // Urgent tasks (due within 3 days)
    } else if (daysLeft < 7) {
      statusIndicator = "🟡"; // Soon tasks (due within a week)
    }

    // Priority indicator
    const priorityDisplay =
      task.priority === "high"
        ? chalk.bold.red("HIGH")
        : task.priority === "medium"
        ? chalk.yellow("MEDIUM")
        : chalk.green("LOW");

    return {
      name: `${statusIndicator} ${task.title} - Due: ${deadline.format(
        "YYYY-MM-DD"
      )} (${priorityDisplay})`,
      value: `${index + 1}. ${task.title}`,
      short: task.title,
    };
  });

  taskChoices.push({
    name: "🔙 Back to Menu",
    value: "🔙 Back to Menu",
    short: "Back",
  });

  const { taskIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "taskIndex",
      message: chalk.cyan("🔢 Select task to edit:"),
      choices: taskChoices,
      pageSize: 10, // Show more items at once for better navigation
    },
  ]);

  if (taskIndex === "🔙 Back to Menu") {
    return;
  }

  const index = parseInt(taskIndex.split(".")[0]) - 1;
  const task = tasks[index];

  // Clear screen before showing task details
  console.clear();
  printSeparator();
  console.log(chalk.bold.yellow.bgBlue("\n ✏️  EDITING TASK \n"));
  printSeparator();

  // Display current task details in a nice format
  const taskOwner = users.find((u) => u.username === task.assignedTo);
  const ownerDisplay = taskOwner
    ? `${chalk.bold(task.assignedTo)} (${chalk.italic(taskOwner.name)})`
    : chalk.bold(task.assignedTo);

  // Task summary box
  console.log(chalk.bgCyan.black(" TASK SUMMARY "));
  console.log(chalk.bold.white(`📌 ${task.title}`));
  console.log(chalk.gray(`ID: ${task.id}`));
  printSeparator();

  // Assignment information highlighted
  console.log(chalk.bgYellow.black(" ASSIGNMENT "));
  console.log(chalk.cyan(`👤 Assigned to: ${ownerDisplay}`));
  printSeparator();

  // Task details section
  console.log(chalk.bgMagenta.black(" DETAILS "));
  console.log(chalk.cyan(`📄 Description: ${chalk.italic(task.description)}`));
  console.log(chalk.cyan(`📂 Category: ${chalk.magenta(task.categories[0])}`));
  console.log(chalk.cyan(`⏳ Deadline: ${chalk.yellow(task.deadline)}`));
  console.log(
    chalk.cyan(
      `🔥 Priority: ${
        task.priority === "high"
          ? chalk.bold.red("HIGH")
          : task.priority === "medium"
          ? chalk.yellow("MEDIUM")
          : chalk.green("LOW")
      }`
    )
  );
  printSeparator();
  console.log(chalk.bold("📝 EDIT TASK INFORMATION"));
  console.log(chalk.gray("Press Enter to keep current values"));
  printSeparator();

  const updatedTaskInput = await inquirer.prompt([
    {
      name: "title",
      message: chalk.cyan(`📝 Task Title (${task.title}):`),
      default: task.title,
      validate: validateNotEmpty,
    },
    {
      name: "description",
      message: chalk.cyan(`📄 Task Description (${task.description}):`),
      default: task.description,
      validate: validateNotEmpty,
    },
  ]);

  // Clear screen before showing assignment section
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ USER ASSIGNMENT"));
  printSeparator();
  console.log(chalk.bold.white("👥 ASSIGNMENT"));

  const userChoices = users.map((user) => ({
    name: `${user.username} (${user.name})`,
    value: `${user.username} (${user.name})`,
    short: user.username,
  }));

  userChoices.push(
    { name: "➕ Add New Person", value: "➕ Add New Person", short: "Add New" },
    { name: "🔙 Back", value: "🔙 Back", short: "Back" }
  );

  // Determine default assignment using task.assignedTo.
  const assignedUser = users.find((u) => u.username === task.assignedTo);
  const defaultAssignment = assignedUser
    ? `${assignedUser.username} (${assignedUser.name})`
    : task.assignedTo;

  const { assignedTo } = await inquirer.prompt([
    {
      type: "list",
      name: "assignedTo",
      message: chalk.cyan(
        `👤 Assign to (currently: ${chalk.bold(task.assignedTo)}):`
      ),
      choices: userChoices,
      default: defaultAssignment,
    },
  ]);

  if (assignedTo === "🔙 Back") {
    return;
  }

  let finalAssignedTo = "";
  if (assignedTo === "➕ Add New Person") {
    printSeparator();
    console.log(chalk.bold.green("➕ ADD NEW USER"));
    printSeparator();

    const newUser = await inquirer.prompt([
      {
        name: "username",
        message: chalk.cyan("👤 Enter new username:"),
        validate: validateUsername,
      },
      {
        name: "password",
        message: chalk.cyan("🔑 Enter password:"),
        type: "password",
        validate: validatePassword,
      },
      {
        name: "name",
        message: chalk.cyan("📛 Enter full name:"),
        validate: validateNotEmpty,
      },
      {
        name: "birthday",
        message: chalk.cyan("🎂 Enter birthday (YYYY-MM-DD):"),
        validate: validateDate,
      },
      {
        name: "email",
        message: chalk.cyan("📧 Enter email address:"),
        validate: validateEmail,
      },
      {
        type: "list",
        name: "role",
        message: chalk.cyan("🛡️ Select role:"),
        choices: ["admin", "user"],
        default: "user",
      },
    ]);
    users.push(newUser);
    await saveUsers(users);
    finalAssignedTo = newUser.username;
    console.log(
      chalk.green(`✅ New user ${chalk.bold(newUser.username)} added!`)
    );
  } else {
    finalAssignedTo = assignedTo.split(" ")[0];
  }
  // --- End Assignment ---

  // Clear screen before category selection
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ CATEGORY SELECTION"));
  printSeparator();
  console.log(chalk.bold.white("📂 CATEGORY"));

  const categoryChoices = data.categories.map((cat) => ({
    name: cat,
    value: cat,
    short: cat,
  }));

  categoryChoices.push(
    {
      name: "➕ Add New Category",
      value: "➕ Add New Category",
      short: "Add New",
    },
    { name: "🔙 Back", value: "🔙 Back", short: "Back" }
  );

  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: chalk.cyan(
        `📂 Select Category (currently: ${chalk.magenta(task.categories[0])}):`
      ),
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
        validate: validateNotEmpty,
      },
    ]);
    finalCategory = newCategory;
    data.categories.push(newCategory);
    console.log(
      chalk.green(`✅ New category "${chalk.bold(newCategory)}" added!`)
    );
  }
  await saveData(data);
  // --- End Category Selection ---

  // Clear screen before deadline input
  console.clear();
  printSeparator();
  console.log(chalk.bold.green("✨ DEADLINE"));
  printSeparator();
  console.log(chalk.bold.white("⏱️ DEADLINE"));

  const { deadline } = await inquirer.prompt([
    {
      name: "deadline",
      message: chalk.cyan(`⏳ Deadline (${chalk.yellow(task.deadline)}):`),
      default: task.deadline,
      validate: validateNotEmpty,
    },
  ]);

  printSeparator();
  console.log(chalk.blue("\n🤖 AI analyzing task & correcting spelling..."));

  try {
    // Clear screen before AI processing
    console.clear();
    printSeparator();
    console.log(chalk.bold.blue("🤖 AI ANALYSIS"));
    printSeparator();
    console.log("Processing your task... Please wait.");

    const aiResult = await classifyTaskAI(
      updatedTaskInput.title,
      updatedTaskInput.description,
      deadline
    );

    // Clear screen before priority selection
    console.clear();
    printSeparator();
    console.log(chalk.bold.green("✨ PRIORITY SELECTION"));
    printSeparator();

    // Show current and AI-suggested priority with color coding
    const currentPriorityDisplay =
      task.priority === "high"
        ? chalk.bold.red("HIGH")
        : task.priority === "medium"
        ? chalk.yellow("MEDIUM")
        : chalk.green("LOW");

    const aiPriorityDisplay =
      aiResult.priority === "high"
        ? chalk.bold.red("HIGH")
        : aiResult.priority === "medium"
        ? chalk.yellow("MEDIUM")
        : chalk.green("LOW");

    console.log(chalk.cyan(`👉 Current priority: ${currentPriorityDisplay}`));
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
          {
            name: `📌 Keep current (${currentPriorityDisplay})`,
            value: task.priority,
            short: "Keep current",
          },
        ],
        default: task.priority,
      },
    ]);

    // Create the updated task using the selected priority
    tasks[index] = new Task(
      aiResult.correctedTitle,
      aiResult.correctedDescription,
      finalAssignedTo,
      aiResult.deadline,
      priority,
      [finalCategory]
    );

    await saveTasks(tasks);

    // Make success message more compact
    console.clear();
    printSeparator();
    console.log(chalk.bgGreen.black("\n ✅ TASK UPDATED SUCCESSFULLY \n"));
    printSeparator();

    // Get updated user info for better display
    const updatedTaskOwner = users.find((u) => u.username === finalAssignedTo);
    const updatedOwnerDisplay = updatedTaskOwner
      ? `${chalk.bold(finalAssignedTo)} (${chalk.italic(
          updatedTaskOwner.name
        )})`
      : chalk.bold(finalAssignedTo);

    // More compact success summary
    console.log(chalk.bold(`📝 "${aiResult.correctedTitle}"`));
    console.log(`👤 Assigned to: ${updatedOwnerDisplay}`);
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
  } catch (error) {
    console.log(chalk.bgRed.white("\n ❌ ERROR UPDATING TASK \n"));
    console.log(chalk.red(error));
    printSeparator();

    await inquirer.prompt([
      {
        name: "continue",
        message: chalk.gray("Press ENTER to return to menu"),
        type: "input",
      },
    ]);
  }
};

export default editTask;
