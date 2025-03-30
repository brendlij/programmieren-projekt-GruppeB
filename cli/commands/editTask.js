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

  // Display current task details in a nice format
  console.clear();
  printSeparator();
  console.log(chalk.bold.yellow.bgBlue("\n ✏️  EDITING TASK \n"));
  printSeparator();
  console.log(chalk.bold.white("📌 Current Task:"));
  console.log(chalk.cyan(`Title: ${chalk.bold.white(task.title)}`));
  console.log(chalk.cyan(`Description: ${chalk.italic(task.description)}`));
  console.log(chalk.cyan(`Assigned to: ${chalk.bold(task.assignedTo)}`));
  console.log(chalk.cyan(`Category: ${chalk.magenta(task.categories[0])}`));
  console.log(chalk.cyan(`Deadline: ${chalk.yellow(task.deadline)}`));
  console.log(
    chalk.cyan(
      `Priority: ${
        task.priority === "high"
          ? chalk.bold.red("HIGH")
          : task.priority === "medium"
          ? chalk.yellow("MEDIUM")
          : chalk.green("LOW")
      }`
    )
  );
  printSeparator();
  console.log(
    chalk.bold(
      "📝 Enter new task details (press Enter to keep current values):"
    )
  );
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

  // --- Assignment: Use registered users ---
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

  // --- Category Selection ---
  printSeparator();
  console.log(chalk.bold.white("📂 CATEGORY"));
  printSeparator();

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

  // Deadline input
  printSeparator();
  console.log(chalk.bold.white("⏱️ DEADLINE"));
  printSeparator();

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
    const aiResult = await classifyTaskAI(
      updatedTaskInput.title,
      updatedTaskInput.description,
      deadline
    );

    // Priority selection with both current and AI suggestion
    printSeparator();
    console.log(chalk.bold.white("🔥 PRIORITY SETTING"));
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

    console.log(chalk.cyan(`Current priority: ${currentPriorityDisplay}`));
    console.log(chalk.cyan(`AI suggested priority: ${aiPriorityDisplay}`));

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
      priority, // Use the manually selected priority
      [finalCategory]
    );

    await saveTasks(tasks);

    // Success message with detailed feedback
    console.clear();
    printSeparator();
    console.log(chalk.bgGreen.black("\n ✅ TASK UPDATED SUCCESSFULLY! \n"));
    printSeparator();

    console.log(chalk.bold.white("📌 Updated Task Details:"));
    console.log(
      chalk.cyan(`Title: ${chalk.bold.white(aiResult.correctedTitle)}`)
    );
    console.log(
      chalk.cyan(`Description: ${chalk.italic(aiResult.correctedDescription)}`)
    );
    console.log(chalk.cyan(`Assigned to: ${chalk.bold(finalAssignedTo)}`));
    console.log(chalk.cyan(`Category: ${chalk.magenta(finalCategory)}`));
    console.log(chalk.cyan(`Deadline: ${chalk.yellow(aiResult.deadline)}`));
    console.log(
      chalk.cyan(
        `Priority: ${
          aiResult.priority === "high"
            ? chalk.bold.red("HIGH")
            : aiResult.priority === "medium"
            ? chalk.yellow("MEDIUM")
            : chalk.green("LOW")
        }`
      )
    );

    if (aiResult.analysis) {
      printSeparator();
      console.log(chalk.bold.blue("🤖 AI Analysis:"));
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
