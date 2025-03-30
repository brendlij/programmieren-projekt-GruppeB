// utils/ai.js
import OpenAI from "openai";
import dayjs from "dayjs";

const openai = new OpenAI();

export const classifyTaskAI = async (title, description, deadline) => {
  try {
    let input = `Task Title: "${title}"\nTask Description: "${description}"\nDeadline: "${deadline}"`;
    const currentYear = dayjs().year();
    const today = dayjs().format("YYYY-MM-DD");

    console.log("🟡 Sending request to OpenAI...");

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "developer",
          content:
            `You are an AI assistant for a task manager. You will:\n` +
            `- **Suggest a suitable category for the task** based on title and description\n` +
            `- Categorize tasks\n` +
            `- Set priority\n` +
            `- Convert deadlines to **the correct format: YYYY-MM-DD HH:mm**\n` +
            `- **Ensure deadlines are in the future (at least today: ${today})**\n` +
            `- **Strictly use the current year (${currentYear}) or later**\n` +
            `- If the provided deadline is in the past, adjust it to the **next available date**\n\n` +
            `Respond strictly in JSON format:\n` +
            `{\n` +
            `"correctedTitle": "Fixed title",\n` +
            `"correctedDescription": "Fixed description",\n` +
            `"category": "Suggested category",\n` +
            `"priority": "low | medium | high",\n` +
            `"deadline": "YYYY-MM-DD HH:mm",\n` +
            `"analysis": "Brief explanation of category and priority choice"\n` +
            `}`,
        },
        { role: "user", content: input },
      ],
    });

    console.log("🟢 AI Response Received:", response.output_text);

    let rawResponse = response.output_text.trim();
    rawResponse = rawResponse.replace(/^```json|```$/g, "");
    const parsedResult = JSON.parse(rawResponse);

    let aiDeadline = dayjs(parsedResult.deadline);
    if (!aiDeadline.isValid() || aiDeadline.isBefore(dayjs())) {
      aiDeadline = dayjs().add(1, "day").hour(12).minute(0);
    }

    parsedResult.deadline = aiDeadline.format("YYYY-MM-DD HH:mm");
    return parsedResult;
  } catch (error) {
    console.log("❌ AI Processing Error:", error);
    return {
      correctedTitle: title,
      correctedDescription: description,
      category: "General", // Default category suggestion
      priority: "low",
      deadline: dayjs()
        .add(1, "day")
        .hour(12)
        .minute(0)
        .format("YYYY-MM-DD HH:mm"),
      analysis: "Could not analyze task.",
    };
  }
};
