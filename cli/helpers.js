// cli/helpers.js
import chalk from "chalk";

export const printSeparator = () =>
  console.log(chalk.magenta("\n────────────────────────────────────────\n"));

export const printAdminHeader = (title) => {
  console.clear();
  console.log(chalk.bgRed.white.bold("\n=== " + title + " ===\n"));
  printSeparator();
};
