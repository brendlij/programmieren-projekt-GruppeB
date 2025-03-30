// cli/commands/admin/manageCategories.js
import inquirer from "inquirer";
import chalk from "chalk";
import { loadData, saveData, loadTasks } from "../../../utils/storage.js";
import {
  printSeparator,
  printAdminHeader,
  validateNotEmpty,
} from "../../helpers.js";

const listCategories = async () => {
  const data = await loadData();
  printAdminHeader("CATEGORY LIST");
  data.categories.forEach((cat, index) => {
    console.log(chalk.cyan(`${index + 1}. ${cat}`));
  });
  printSeparator();
};

const addCategory = async () => {
  const data = await loadData();

  // Add a Back option before creating a new category
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.cyan("What would you like to do?"),
      choices: ["➕ Add New Category", " ⬅️ Back"],
    },
  ]);

  if (action === " ⬅️ Back") {
    return;
  }

  const { newCategory } = await inquirer.prompt([
    {
      name: "newCategory",
      message: "Enter new category name:",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Category name cannot be empty";
        }
        if (data.categories.includes(input)) {
          return "Category already exists";
        }
        return true;
      },
    },
  ]);
  data.categories.push(newCategory);
  await saveData(data);
  console.log(chalk.green("✅ Category added successfully!"));
};

const editCategory = async () => {
  const data = await loadData();

  // Add Back option to category list
  const choices = [...data.categories, " ⬅️ Back"];

  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "Select category to edit:",
      choices: choices,
    },
  ]);

  if (category === " ⬅️ Back") {
    return;
  }

  const { newCategoryName } = await inquirer.prompt([
    {
      name: "newCategoryName",
      message: `Enter new name for category "${category}":`,
      default: category,
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Category name cannot be empty";
        }
        if (input !== category && data.categories.includes(input)) {
          return "Category already exists";
        }
        return true;
      },
    },
  ]);
  data.categories = data.categories.map((cat) =>
    cat === category ? newCategoryName : cat
  );
  await saveData(data);
  console.log(chalk.green("✅ Category updated successfully!"));
};

const deleteCategory = async () => {
  const data = await loadData();

  // Add Back option to category list
  const choices = [...data.categories, " ⬅️ Back"];

  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "Select category to delete:",
      choices: choices,
    },
  ]);

  if (category === " ⬅️ Back") {
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to delete "${category}"?`,
    },
  ]);
  if (confirm) {
    data.categories = data.categories.filter((cat) => cat !== category);
    await saveData(data);
    console.log(chalk.green("✅ Category deleted successfully!"));
  }
};

const viewTasksByCategory = async () => {
  const data = await loadData();
  const tasks = await loadTasks();
  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "Select category to view tasks:",
      choices: [...data.categories, " ⬅️ Back"],
    },
  ]);

  if (category === " ⬅️ Back") {
    return;
  }

  const filteredTasks = tasks.filter((task) =>
    task.categories.includes(category)
  );

  printAdminHeader("TASKS BY CATEGORY");
  console.log(chalk.bold(`Tasks in Category: ${category}`));
  printSeparator();

  if (filteredTasks.length === 0) {
    console.log(chalk.yellow("No tasks found in this category."));
  } else {
    filteredTasks.forEach((task, index) => {
      console.log(
        `${chalk.cyan(index + 1)}. ${chalk.white(task.title)} - Assigned to: ${
          task.assignedTo
        }`
      );
    });

    // Add option to view a task or go back
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.cyan("What would you like to do?"),
        choices: ["👁️ View Task Details", " ⬅️ Back to Categories"],
      },
    ]);

    if (action === "👁️ View Task Details") {
      // Add task selection with Back option
      const taskChoices = filteredTasks.map((task, index) => ({
        name: `${index + 1}. ${task.title}`,
        value: index,
      }));

      taskChoices.push({
        name: " ⬅️ Back",
        value: -1,
      });

      const { taskIndex } = await inquirer.prompt([
        {
          type: "list",
          name: "taskIndex",
          message: "Select a task to view details:",
          choices: taskChoices,
        },
      ]);

      if (taskIndex !== -1) {
        // Display task details
        printSeparator();
        const task = filteredTasks[taskIndex];
        console.log(chalk.bold.white(`Title: ${task.title}`));
        console.log(chalk.cyan(`Description: ${task.description}`));
        console.log(chalk.cyan(`Assigned to: ${task.assignedTo}`));
        console.log(chalk.cyan(`Deadline: ${task.deadline}`));
        console.log(chalk.cyan(`Priority: ${task.priority}`));
        printSeparator();
      }
    }
  }
};

const manageCategories = async () => {
  while (true) {
    printAdminHeader("MANAGE CATEGORIES");
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select an action:",
        choices: [
          "List Categories",
          "Add Category",
          "Edit Category",
          "Delete Category",
          "View Tasks by Category",
          " ⬅️ Back",
        ],
      },
    ]);
    if (action === "List Categories") await listCategories();
    else if (action === "Add Category") await addCategory();
    else if (action === "Edit Category") await editCategory();
    else if (action === "Delete Category") await deleteCategory();
    else if (action === "View Tasks by Category") await viewTasksByCategory();
    else if (action === " ⬅️ Back") break;
    await inquirer.prompt([
      { name: "continue", message: "Press ENTER to continue", type: "input" },
    ]);
  }
};

export default manageCategories;
