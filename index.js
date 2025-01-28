const readlineSync = require("readline-sync");
const dotenv = require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { dbConnection } = require("./db/connection.js");
const { userTodoSchema } = require("./db/todoSchema.js");

const GoogleGenerativeAIKey = process.env.GOOGLE_GENERATIVE_AI_KEY;

// CRUD TOOLS

const createTodo = async (todo) => {
    try {
        const payload = { todo };
        const record = await userTodoSchema.create(payload);
        const response = await record.save();
        return response?.id;
    } catch (error) {
        console.error("Error in createTodo:", error);
    }
};

const deleteTodo = async (id) => {
    try {
        const result = await userTodoSchema.deleteOne({ id });
        return result.deletedCount > 0 ? true : false;
    } catch (error) {
        console.error("Error in deleteTodo:", error);
    }
};

const updateTodo = async (id, updatedTodo) => {
    try {
        const result = await userTodoSchema.findOneAndUpdate(
            { id },
            { todo: updatedTodo, updatedAt: new Date() },
            { new: true }
        );
        return result ? true : false;
    } catch (error) {
        console.error("Error in updateTodo:", error);
    }
};

const searchTodo = async (searchText) => {
    try {
        const results = await userTodoSchema.find({
            todo: { $regex: searchText, $options: "i" },
        });
        return results.length ? results : "No TODOs found.";
    } catch (error) {
        console.error("Error in searchTodo:", error);
    }
};

const tools = {
    createTodo: createTodo,
    searchTodo: searchTodo,
    deleteTodo: deleteTodo,
    updateTodo: updateTodo
}

// System Prompt
const System_prompt = `
Hi, You are an AI assistant designed to help users manage their TODO tasks.
You can strictly follow the JSON output format

You have access to the following tools:
1. **createTodo**  
   - Functionality: This function allows you to create a new TODO item.  
   - Parameters:  
     - todo (string): A string describing the TODO task.  
   - Returns: The ID of the newly created TODO item.  

   ### Example:
   User: "Add a task to prepare a project report."
   Assistant: "Sure, let me create the TODO for you."
   (createTodo("Prepare a project report") is called internally.)
   Response: "Your TODO has been created successfully with ID: 123."

2. **deleteTodo**  
   - Functionality: This function deletes an existing TODO item by its ID.  
   - Parameters:  
     - id (number): The ID of the TODO item to delete.  
   - Returns: true if the item was deleted successfully, false otherwise.  

   ### Example:
   User: "Delete the task with ID 123."
   Assistant: "Sure, let me delete the TODO for you."
   (deleteTodo(123) is called internally.)
   Response: "The TODO with ID 123 has been deleted successfully."

3. **updateTodo**  
   - Functionality: This function updates an existing TODO item.  
   - Parameters:  
     - id (number): The ID of the TODO item to update.  
     - updatedTodo (string): The new description for the TODO task.  
   - Returns: true if the update was successful, false otherwise.  

   ### Example:
   User: "Update the task with ID 123 to 'Complete the project presentation.'"
   Assistant: "Let me update the TODO for you."
   (updateTodo(123, "Complete the project presentation") is called internally.)
   Response: "The TODO with ID 123 has been updated successfully."

4. **searchTodo**  
   - Functionality: This function searches for TODO items containing specific text.  
   - Parameters:  
     - searchText (string): The text to search for in TODO tasks.  
   - Returns: A list of matching TODO items or a message if no items are found.  

   ### Example:
`;

async function main() {
    try {
        await dbConnection();
        console.log("Please enter your prompt:");
        while (true) {
            const query = await readlineSync.question(">>");
            const userMessage = {
                type : "user",
                user : query
            }

            // Convert user message to a format that is acceptable to the Google AI API
            const message = [{
                "parts": [
                    {
                        "text": JSON.stringify(userMessage)
                    }
                ]
            }];

            const genAI = new GoogleGenerativeAI(GoogleGenerativeAIKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent({ contents: message });
            // console.log("Response in JSON format:", JSON.stringify(result, null, 2));
            console.log("\n\t", result.response.text());
        }
    } catch (error) {
        console.error("Something went wrong:", error);
    }
}

main();
