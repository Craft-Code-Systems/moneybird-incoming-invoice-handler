import fs from "fs";
import OpenAI from "openai";
import { Buffer } from "buffer"; // Import Buffer explicitly for environments that need it


const OPEN_AI = new OpenAI({
    apiKey: '', // Replace with your actual API key
    organization: 'org-Vjk3ht4hqVulK9W0CXYZeXhI', // Replace with the correct organization ID if applicable
    project: 'proj_iJdGTnAVNpuqoecCNqzKw2Us' // Ensure this is the correct project ID
});








export async function f_uploadFile(fileBuffer, fileName = "document.pdf") {
  try {
    console.log("Type of content:", typeof fileBuffer); // Should be 'object'
    console.log("Is Buffer:", Buffer.isBuffer(fileBuffer)); // Should be true
    console.log("Size of file:", fileBuffer.length, "bytes");

    // Create a FormData object
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), fileName); // Wrap Buffer in Blob
    formData.append("purpose", "assistants"); // Adjust the purpose if needed

    // Send the request using fetch
    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: ``, // Replace with your API key
      },
      body: formData, // Pass FormData directly
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Upload failed:", errorData);
      return null;
    }

    const responseData = await response.json();
    console.log("Uploaded File ID:", responseData.id);
    return responseData.id;
  } catch (error) {
    console.error("f_uploadFile Error:", error.message);
    return null;
  }
//   try{

//     const fileBuffer = Buffer.from(pdfContent); // Ensure binary format
//     console.log("File size:", pdfContent.length, "bytes");

//     console.log("Type of content:", typeof fileBuffer); // Should be 'object'
//     console.log("Is Buffer:", Buffer.isBuffer(fileBuffer)); // Should be true
//     console.log("Size of file:", Buffer.from(fileBuffer).length, "bytes");
//     // Upload the file to OpenAI
//     const response = await OPEN_AI.files.create({
//       file: fileBuffer,
//       purpose: "assistants", // Use the appropriate purpose for your use case
//     });

//     console.log("response: ", await response);

//   console.log(file);
//   return file.id;
// } catch (error) {
//   console.error("f_uploadFile: ", error);
//   return null;
// }
}

// export async function f_updateAssistant(FILE_ID) {
  export async function f_updateAssistant(fileId, assistantId = "asst_QfBs7taU8moqvUO4mPt6nfzt") {
    try {
      const url = `https://api.openai.com/v1/assistants/${assistantId}`;
  
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
          Authorization: `Bearer `, // Replace with your actual OpenAI API key
        },
        body: JSON.stringify({
          file_ids: [fileId, 'file-662HzvcLRrvD9yLyvX7f7P', 'file-AQtg9bELjriRDBSQFmJP57'], // Array of file IDs to associate with the assistant
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update assistant:", errorData);
        return null;
      }
  
      const responseData = await response.json();
      console.log("Updated Assistant:", responseData);
      return responseData;
    } catch (error) {
      console.error("f_updateAssistant Error:", error.message);
      return null;
    }
  }
  
//     try{
//     const myUpdatedAssistant = await OPEN_AI.beta.assistants.update(
//       "asst_QfBs7taU8moqvUO4mPt6nfzt",
//       {
//         file_ids: [FILE_ID],
//       }
//     );
  
//     console.log(JSON.stringify(myUpdatedAssistant));
// } catch (error) {
//     console.error(error);
// }
 // }

 export async function f_queryAssistant(FILE_ID, assistantId = "asst_QfBs7taU8moqvUO4mPt6nfzt") {
  try {
    const emptyThread = await OPEN_AI.beta.threads.create();

    console.log("emptyThread: ", emptyThread);

    const threadMessages = await OPEN_AI.beta.threads.messages.create(
      emptyThread.id,
      { role: "user", content: `Analyze the PDF file (${FILE_ID}) carefully and completely and provide me with the following info in JSON-format -company info (where the invoice is send from, can be found in the top left corner, but can also be found in the bottom left corner and it should NOT contain hammertech or instantpack)) -invoice date -exp. date -invoice number -per item a description -per item a relevant ledger account (use one from ledgers.txt, file-662HzvcLRrvD9yLyvX7f7P) -per item a relevant tax (either 0% or 21%) -per item the correct price Notes: Make sure to include all the items and use the context.txtx file (file-AQtg9bELjriRDBSQFmJP57) as context/reference `, attachments:[{file_id: FILE_ID, tools: [{type: "file_search"}]}, {file_id: 'file-662HzvcLRrvD9yLyvX7f7P', tools: [{type: "file_search"}]}, {file_id: 'file-AQtg9bELjriRDBSQFmJP57', tools: [{type: "file_search"}]}] });
  
    console.log("threadMessages: ", threadMessages);

    const run = await OPEN_AI.beta.threads.runs.create(
      emptyThread.id,
      { assistant_id: assistantId }
    );
  
    console.log("run: ", run);


let run_status = "";
while (run_status !== "completed") {
  const runs = await OPEN_AI.beta.threads.runs.retrieve(
    emptyThread.id,
    run.id
  );
  run_status = runs.status;
  console.log("run_status: ", run_status);
}


      const threadMessages2 = await OPEN_AI.beta.threads.messages.list(
        emptyThread.id
      );
    const last_msg = threadMessages2.data.filter((message) => run.id === message.run_id && message.role === "assistant");
      const match = last_msg[0].content[0].text.value.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        const jsonString = match[1];
        const jsonData = JSON.parse(jsonString);
        console.log(jsonData);
        return jsonData;
      }

      return "FAILED";
  } catch (error) {
    console.error("f_queryAssistant Error:", error.message);
    return null;
  }
}

