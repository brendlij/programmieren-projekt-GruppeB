// cli/commands/listTasks.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadTasks } from "../../utils/storage.js";
import dayjs from "dayjs";
import { printSeparator } from "../helpers.js";
import { loadUsers } from "../../utils/auth.js";

const listTasks = async (currentUser, showAll = false) => {
  console.clear();
  let tasks = await loadTasks();

  // If showAll is false then filter tasks by currentUser.username.
  if (!showAll) {
    tasks = tasks.filter((task) => task.assignedTo === currentUser.username);
  }

  printSeparator();
  console.log(
    chalk.bold.blue("📋 Task List") +
      (showAll ? chalk.yellow(" (All Users)") : "")
  );
  printSeparator();

  // --- Filtering and Sorting Section ---
  const { filterChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "filterChoice",
      message: chalk.cyan("🔍 Would you like to sort or filter your tasks?"),
      choices: [
        "✅ Show All",
        "⏱️  Sort by Deadline",
        "🔥 Sort by Priority",
        "📂 Filter by Category",
        "🔙 Back to Menu",
      ],
    },
  ]);

  if (filterChoice === "🔙 Back to Menu") {
    return;
  }

  if (filterChoice === "⏱️  Sort by Deadline") {
    tasks.sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));
    console.log(chalk.green("✓ Tasks sorted by deadline (earliest first)"));
  } else if (filterChoice === "🔥 Sort by Priority") {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    console.log(chalk.green("✓ Tasks sorted by priority (highest first)"));
  } else if (filterChoice === "📂 Filter by Category") {
    const categories = [...new Set(tasks.flatMap((task) => task.categories))];
    if (categories.length === 0) {
      console.log(chalk.yellow("⚠️ No categories available to filter by."));
      await inquirer.prompt([
        { name: "continue", message: "Press ENTER to continue", type: "input" },
      ]);
    } else {
      const { chosenCategory } = await inquirer.prompt([
        {
          type: "list",
          name: "chosenCategory",
          message: "Select a category:",
          choices: [...categories, "🔙 Back"],
        },
      ]);
      if (chosenCategory === "🔙 Back") {
        return await listTasks(currentUser, showAll); // Return to the start of list tasks
      }
      tasks = tasks.filter((task) => task.categories.includes(chosenCategory));
      console.log(
        chalk.green(
          `✓ Showing tasks in category: ${chalk.bold(chosenCategory)}`
        )
      );
    }
  }
  // --- End of Filtering and Sorting Section ---

  if (tasks.length === 0) {
    printSeparator();
    console.log(chalk.yellow("\n🚨 No tasks available with current filters."));
    printSeparator();
  } else {
    printSeparator();

    const now = dayjs();
    const users = await loadUsers();

    // Task count summary
    const overdueCount = tasks.filter(
      (task) => dayjs(task.deadline).diff(now) < 0
    ).length;
    const urgentCount = tasks.filter((task) => {
      const daysLeft = dayjs(task.deadline).diff(now, "day");
      return daysLeft >= 0 && daysLeft < 3;
    }).length;

    console.log(
      chalk.bold(`📊 Summary: ${chalk.white(tasks.length)} total tasks, `) +
        chalk.red.bold(`${overdueCount} overdue, `) +
        chalk.yellow.bold(`${urgentCount} urgent`)
    );
    printSeparator();

    tasks.forEach((task, index) => {
      const deadline = dayjs(task.deadline);
      const daysLeft = deadline.diff(now, "day");
      let deadlineColor = chalk.green;
      let urgencyLabel = "🟢 On Time";

      if (daysLeft < 0) {
        deadlineColor = chalk.red.bold;
        urgencyLabel = "⚠️ OVERDUE";
      } else if (daysLeft < 3) {
        deadlineColor = chalk.red.bold;
        urgencyLabel = "🔴 URGENT";
      } else if (daysLeft < 7) {
        deadlineColor = chalk.yellow.bold;
        urgencyLabel = "🟡 Due Soon";
      }

      const userDetail = users.find((u) => u.username === task.assignedTo);
      const assignedInfo = userDetail
        ? `${userDetail.username} (${userDetail.name})`
        : task.assignedTo;

      console.log(
        chalk.bgBlue.white(` ${index + 1} `) +
          " " +
          chalk.white.bold(task.title) +
          chalk.gray(" - " + assignedInfo) +
          "\n" +
          `   📂 ${chalk.magenta(task.categories[0])} | 🔥 ${
            task.priority === "high"
              ? chalk.red.bold("HIGH")
              : task.priority === "medium"
              ? chalk.yellow.bold("MEDIUM")
              : chalk.green.bold("LOW")
          } | ` +
          `⏳ ${deadlineColor(
            deadline.format("YYYY-MM-DD HH:mm")
          )} ${urgencyLabel}\n`
      );
    });

    printSeparator();
  }

  await inquirer.prompt([
    {
      name: "continue",
      message: chalk.gray("Press ENTER to return to menu"),
      type: "input",
    },
  ]);
};

export default listTasks;
