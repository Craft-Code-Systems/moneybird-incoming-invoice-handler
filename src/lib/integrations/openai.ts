import OpenAI from "openai";
import { Buffer } from "buffer"; // Import Buffer explicitly for environments that need it
import * as interfaces from "../interfaces";



/**
 * Uploads a file to the OpenAI API as a Buffer and returns the file ID.
 * @param {Buffer} FILE_BUFFER The file buffer to upload.
 * @param {any} env The environment object containing the OPENAI_KEY.
 * @returns {string | null} The file ID if successful, or null if not.
 * @throws Error when uploading fails.
 */
export async function f_uploadFile(FILE_BUFFER: Buffer, env: any): Promise<string | null> {
  try {
    const FILE_NAME = "document.pdf"

    if (!FILE_BUFFER || FILE_BUFFER.length === 0) {
      console.error("No file buffer provided");
      return null;
    }

    // Create a FormData object
    const formData = new FormData();
    formData.append("file", new Blob([FILE_BUFFER]), FILE_NAME); // Wrap Buffer in Blob
    formData.append("purpose", "assistants"); // Adjust the purpose if needed

    // Send the request using fetch
    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_KEY}`, // Replace with your API key
      },
      body: formData, // Pass FormData directly
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Upload failed:", errorData);
      return null;
    }

    const RESPONSE_DATA: OpenAI.FileObject = await response.json();
    console.log("Uploaded File ID:", RESPONSE_DATA.id);
    return RESPONSE_DATA.id;
  } catch (ERROR: any) {
    console.error("f_uploadFile Error:", ERROR.message);
    return null;
  }

}


  /**
   * Updates an OpenAI assistant with a given file ID, associating it with the assistant.
   * @param {string} FILE_ID - The ID of the file to associate with the assistant.
   * @param {any} env - The environment object, containing the OpenAI API key.
   * @returns {Promise<OpenAI.Beta.Assistant | null>} - The response from the update request, or null if an error occurred.
   */
  export async function f_updateAssistant(FILE_ID: string, env: any): Promise<OpenAI.Beta.Assistant | null> {
    try {
      if (!FILE_ID || FILE_ID.length === 0) {
        console.error("No file ID provided");
        return null;
      }
      const ASSISTANT_ID: string = "asst_QfBs7taU8moqvUO4mPt6nfzt"
      const URL: string = `https://api.openai.com/v1/assistants/${ASSISTANT_ID}`;
  
      const RESPONSE: any = await fetch(URL, {
        method: "POST",
        headers: {
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_KEY}`, // Replace with your actual OpenAI API key
        },
        body: JSON.stringify({
          file_ids: [FILE_ID, 'file-662HzvcLRrvD9yLyvX7f7P', 'file-3ouxWDDopRb4WE6kntmFD9', 'file-PUPSdrpLr4DK2FHvBrRVaX'], // Array of file IDs to associate with the assistant
        }),
      });
  
      if (!RESPONSE.ok) {
        const ERROR_DATA = await RESPONSE.json();
        console.error("Failed to update assistant:", ERROR_DATA);
        return null;
      }
  
      const RESPONSE_DATA: OpenAI.Beta.Assistant = await RESPONSE.json();
      return RESPONSE_DATA;
    } catch (ERROR: any) {
      console.error("f_updateAssistant Error:", ERROR.message);
      return null;
    }
  }
  

/**
 * Queries the OpenAI assistant for a given file ID, and returns the assistant's response in the expected JSON format.
 * @param {string} FILE_ID - The ID of the file to analyze.
 * @param {any} env - The environment object, containing the necessary OpenAI API keys and organization/project IDs.
 * @returns {Promise<interfaces.parsedInvoiceData | null>} - The parsed JSON response from the assistant, or null if an error occurred.
 */
 export async function f_queryAssistant(FILE_ID: string, env: any): Promise<interfaces.parsedInvoiceData | null> {
  try {
    const ASSISTANT_ID: string = "asst_QfBs7taU8moqvUO4mPt6nfzt"

    if (!FILE_ID || FILE_ID.length === 0) {
      console.error("No file ID provided");
      return null;
    }
    
    const OPEN_AI: OpenAI = new OpenAI({
      apiKey: env.OPENAI_KEY,
      organization: env.OPENAI_ORG,
      project: env.OPENAI_PROJD,
  });

    const EMPTY_THREAD: OpenAI.Beta.Thread = await OPEN_AI.beta.threads.create();

    const threadMessages = await OPEN_AI.beta.threads.messages.create(
      EMPTY_THREAD.id,
      { role: "user", content: `Analyze the PDF file (${FILE_ID}) carefully and completely and provide me with the following info in JSON-format (see example.json (file-PUPSdrpLr4DK2FHvBrRVaX) for the correct format) -company info (where the invoice is send from, can be found in the top left corner, but can also be found in the bottom left corner and it should NOT contain hammertech or instantpack)) -invoice date -exp. date (30 days from invoice dateif not specified) -invoice number -KvK number -per item a description -per item a relevant ledger account (use one from ledgers.txt, file-662HzvcLRrvD9yLyvX7f7P) -per item a relevant tax (either 0% or 21%) -per item the correct price (can not be 0). Notes: Make sure to include all the items and use the context.txt file (file-3ouxWDDopRb4WE6kntmFD9) as context/reference `, attachments:[{file_id: FILE_ID, tools: [{type: "file_search"}]}, {file_id: 'file-662HzvcLRrvD9yLyvX7f7P', tools: [{type: "file_search"}]}, {file_id: 'file-3ouxWDDopRb4WE6kntmFD9', tools: [{type: "file_search"}]}, {file_id: 'file-PUPSdrpLr4DK2FHvBrRVaX', tools: [{type: "file_search"}]}] });

    const STARTED_RUN: OpenAI.Beta.Threads.Run = await OPEN_AI.beta.threads.runs.create(
      EMPTY_THREAD.id,
      { assistant_id: ASSISTANT_ID }
    );
  
let run_status = "";
while (run_status !== "completed") {
  const RUN: OpenAI.Beta.Threads.Run = await OPEN_AI.beta.threads.runs.retrieve(
    EMPTY_THREAD.id,
    STARTED_RUN.id
  );
  run_status = RUN.status;
  console.log("run_status: ", run_status);
}


      const THREAD_MSGS: any = await OPEN_AI.beta.threads.messages.list(
        EMPTY_THREAD.id
      );
    const LAST_MSG: any = THREAD_MSGS.data.filter((message: any) => STARTED_RUN.id === message.run_id && message.role === "assistant");
      const MATCH: any = LAST_MSG[0].content[0].text.value.match(/```json\n([\s\S]*?)\n```/);
      if (MATCH) {
        const JSON_STRING: string = MATCH[1];
        const JSON_DATA: interfaces.parsedInvoiceData = JSON.parse(JSON_STRING);
        console.log(JSON_DATA);
        return JSON_DATA;
      }

      return "FAILED";
  } catch (ERROR: any) {
    console.error("f_queryAssistant Error:", ERROR.message);
    return null;
  }
}



