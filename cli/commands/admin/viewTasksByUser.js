// cli/commands/admin/viewTasksByUser.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadTasks } from "../../../utils/storage.js";
import { printSeparator, printAdminHeader } from "../../helpers.js";
import { loadUsers } from "../../../utils/auth.js";
import dayjs from "dayjs";

// Display task details function (similar to the one in listTasks.js)
const displayTaskDetails = async (task, users) => {
  console.clear();
  printSeparator();
  console.log(chalk.bold.blue.bgWhite(`\n 📝 TASK DETAILS \n`));
  printSeparator();

  // Get user details for better display
  const taskOwner = users.find((u) => u.username === task.assignedTo);
  const ownerDisplay = taskOwner
    ? `${chalk.bold(task.assignedTo)} (${chalk.italic(taskOwner.name)})`
    : chalk.bold(task.assignedTo);

  // Task details section
  console.log(chalk.bgCyan.black(" TASK SUMMARY "));
  console.log(chalk.bold.white(`📌 ${task.title}`));
  console.log(chalk.gray(`ID: ${task.id}`));
  printSeparator();

  // Assignment information
  console.log(chalk.bgYellow.black(" ASSIGNMENT "));
  console.log(chalk.cyan(`👤 Assigned to: ${ownerDisplay}`));
  printSeparator();

  // Task details
  console.log(chalk.bgMagenta.black(" DETAILS "));
  console.log(chalk.cyan(`📄 Description: ${chalk.italic(task.description)}`));

  // Calculate deadline information
  const now = dayjs();
  const deadline = dayjs(task.deadline);
  const daysLeft = deadline.diff(now, "day");
  let deadlineStatus = "🟢 On Time";
  let deadlineColor = chalk.green;

  if (daysLeft < 0) {
    deadlineStatus = "⚠️ OVERDUE";
    deadlineColor = chalk.red.bold;
  } else if (daysLeft < 3) {
    deadlineStatus = "🔴 URGENT";
    deadlineColor = chalk.red.bold;
  } else if (daysLeft < 7) {
    deadlineStatus = "🟡 Due Soon";
    deadlineColor = chalk.yellow.bold;
  }

  console.log(
    chalk.cyan(`📂 Category: ${chalk.magenta(task.categories.join(", "))}`)
  );
  console.log(
    chalk.cyan(
      `⏳ Deadline: ${deadlineColor(
        deadline.format("YYYY-MM-DD HH:mm")
      )} ${deadlineStatus}`
    )
  );
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

  // Time information
  const creationDate = new Date(parseInt(task.id)).toLocaleString();
  console.log(chalk.cyan(`🕒 Created: ${chalk.gray(creationDate)}`));

  if (daysLeft >= 0) {
    console.log(chalk.cyan(`⏰ Time remaining: ${chalk.bold(daysLeft)} days`));
  } else {
    console.log(
      chalk.cyan(`⏰ Overdue by: ${chalk.bold.red(Math.abs(daysLeft))} days`)
    );
  }

  printSeparator();
};

const viewTasksByUser = async () => {
  const tasks = await loadTasks();
  const users = await loadUsers();
  let assignedUsers = [...new Set(tasks.map((task) => task.assignedTo))];
  assignedUsers.push(" ⬅️ Back");

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

  if (user === " ⬅️ Back") {
    return;
  }

  const filteredTasks = tasks.filter((task) => task.assignedTo === user);

  while (true) {
    printAdminHeader("TASKS BY USER");
    console.log(chalk.bold(`Tasks assigned to: ${user}`));
    printSeparator();

    if (filteredTasks.length === 0) {
      console.log(chalk.yellow("No tasks found for this user."));
      await inquirer.prompt([
        {
          name: "continue",
          message: "Press ENTER to return to menu",
          type: "input",
        },
      ]);
      return;
    } else {
      // Display tasks with more details
      const now = dayjs();

      filteredTasks.forEach((task, index) => {
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

        console.log(
          chalk.bgBlue.white(` ${index + 1} `) +
            " " +
            chalk.white.bold(task.title) +
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

      // Option to view task details
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: chalk.cyan("What would you like to do?"),
          choices: ["👁️ View Task Details", " ⬅️ Return to Menu"],
        },
      ]);

      if (action === "👁️ View Task Details") {
        // Create task choices for selection
        const taskChoices = filteredTasks.map((task, index) => ({
          name: `${index + 1}. ${task.title}`,
          value: index,
          short: task.title,
        }));

        taskChoices.push({
          name: " ⬅️ Back",
          value: -1,
          short: "Back",
        });

        const { taskIndex } = await inquirer.prompt([
          {
            type: "list",
            name: "taskIndex",
            message: chalk.cyan("Select a task to view details:"),
            choices: taskChoices,
            pageSize: 10,
          },
        ]);

        if (taskIndex !== -1) {
          await displayTaskDetails(filteredTasks[taskIndex], users);

          // After viewing details, ask for next action
          const { nextAction } = await inquirer.prompt([
            {
              type: "list",
              name: "nextAction",
              message: chalk.cyan("What would you like to do next?"),
              choices: ["📋 Back to Task List", " ⬅️ Return to Menu"],
            },
          ]);

          if (nextAction === "📋 Back to Task List") {
            // Just continue the loop to show the task list again
            continue;
          } else {
            // Return to admin menu
            return;
          }
        }
      } else {
        // Return to menu
        return;
      }
    }
  }
};

export default viewTasksByUser;
