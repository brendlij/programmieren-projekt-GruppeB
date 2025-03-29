// utils/storage.js
import fs from "fs-extra";

const TASKS_FILE = "tasks.json";
const DATA_FILE = "data.json";

export const loadTasks = async () => {
  try {
    return await fs.readJson(TASKS_FILE);
  } catch (error) {
    return [];
  }
};

export const saveTasks = async (tasks) => {
  await fs.writeJson(TASKS_FILE, tasks, { spaces: 2 });
};

export const loadData = async () => {
  try {
    return await fs.readJson(DATA_FILE);
  } catch (error) {
    return { categories: [] };
  }
};

export const saveData = async (data) => {
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
};
