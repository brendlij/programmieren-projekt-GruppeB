// models/task.js
class Task {
  constructor(title, description, assignedTo, deadline, priority, categories) {
    this.id = Date.now();
    this.title = title;
    this.description = description;
    this.assignedTo = assignedTo;
    this.deadline = deadline;
    this.priority = priority;
    this.categories = categories;
  }
}

export default Task;
