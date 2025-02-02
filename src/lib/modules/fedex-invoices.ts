import * as interfaces from "../interfaces";
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as fedex from "../integrations/fedex.js";
import Papa from 'papaparse';

export async function getCSVFileList() {
    const FILE_LIST: any = await fedex.getFileList();
    console.log("FILE_LIST: ", FILE_LIST);
    let invoice_data = [];
    for (let i = 0; i < FILE_LIST.length; i++) {
        const CSV_FILE = await fedex.getFile(FILE_LIST[i]);
        invoice_data.push(await parseInvoiceCSV(CSV_FILE));
    }
    
    return invoice_data;
}

function fixCSVData(csvData: string): string {
    let rows = csvData.split("\n").map(row => row.trim());

    // Remove extra commas & fix unbalanced quotes
    rows = rows.map(row => {
        row = row.replace(/,+$/, ""); // Remove trailing commas
        row = row.replace(/^"+|"+$/g, ""); // Trim leading/trailing unbalanced quotes
        row = row.replace(/\s*,\s*/g, ","); // Remove unnecessary spaces around commas
        row = row.replace(/""/g, "null"); // Replace empty quotes with "null" for consistency

        return row;
    });

    // Get the number of columns based on the header row
    const headerCount = rows[0].split(",").length;

    // Normalize row lengths
    rows = rows.map((row, index) => {
        let columns = row.split(",");

        if (columns.length > headerCount) {
            console.warn(`⚠️ Row ${index + 1} has ${columns.length} columns (expected ${headerCount}). Trimming extra values.`);
            columns = columns.slice(0, headerCount);
        } else if (columns.length < headerCount) {
            console.warn(`⚠️ Row ${index + 1} has ${columns.length} columns (expected ${headerCount}). Padding missing values.`);
            while (columns.length < headerCount) {
                columns.push("null");
            }
        }

        return columns.join(",");
    });

    return rows.join("\n");
}



function debugCSV(csvData: string): void {
    const rows = csvData.split("\n");
    const headerCount = rows[0].split(",").length;

    console.log(`✅ Expected columns: ${headerCount}`);
    rows.forEach((row, index) => {
        const columnCount = row.split(",").length;
        if (columnCount !== headerCount) {
            console.warn(`⚠️ Row ${index + 1} has ${columnCount} columns (expected ${headerCount})`);
            console.warn("Problematic Row:", row);

            // Print all columns for debugging
            console.warn("🔍 Splitting columns:", row.split(","));
        }
    });
}




export async function parseInvoiceCSV(csvData: any): Promise<any> {
    return new Promise((resolve, reject) => {
        if (csvData instanceof ArrayBuffer) {
            csvData = new TextDecoder().decode(csvData);
        } else if (typeof csvData !== "string") {
            console.error("CSV data type:", typeof csvData);
            return reject(new Error("CSV data is not a valid string or ArrayBuffer"));
        }

        if (!csvData.trim()) {
            return reject(new Error("CSV data is empty"));
        }

        // Step 1: Normalize line endings and remove trailing commas
        csvData = csvData
            .replace(/\r\n/g, "\n")  // Convert CRLF to LF
            .replace(/\r/g, "\n")    // Convert CR to LF
            .split("\n")
            .map(row => row.replace(/,+$/, "")) // Remove trailing commas
            .join("\n");

        // Step 2: Parse CSV using PapaParse
        const parsed = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimiter: ",",
            quoteChar: '"',
            escapeChar: '"',
            transformHeader: (header, index, headers = []) => {  
                let count = 0;
                let newHeader = header.trim();
        
                // Ensure unique headers
                while (headers.slice(0, index).includes(newHeader)) {
                    count++;
                    newHeader = `${header.trim()}_${count}`;
                }
                return newHeader;
            }
        });

        // Step 3: Validate row consistency
        const expectedColumnCount = parsed.meta.fields.length;

        parsed.data = parsed.data.filter((row, index) => {
            const fieldCount = Object.keys(row).length;
            if (fieldCount !== expectedColumnCount) {
                console.warn(`⚠️ Row ${index + 1} has ${fieldCount} fields, expected ${expectedColumnCount}. Removing this row.`);
                return false; // Exclude invalid rows
            }
            return true;
        });

        // Step 4: Handle errors
        if (parsed.errors.length > 0) {
            console.error("CSV Parsing Errors:", parsed.errors);
            return reject(new Error("CSV data has formatting issues"));
        }

        if (parsed.data.length === 0) {
            return reject(new Error("CSV data is empty or not formatted correctly"));
        }

        // Step 5: Convert parsed data into structured format
        const firstRow = parsed.data[0];

        const parsedData: any = {
            company_info: {
                name: firstRow["Factureren op accountnummer"] || "Unknown",
                KvK_number: "N/A",
                address: "N/A",
            },
            invoice_details: {
                invoice_number: firstRow["FedEx-factuurnummer"],
                invoice_date: firstRow["Factuurdatum"],
                exp_date: firstRow["Vervaldatum"],
                total_price: firstRow["Oorspronkelijk verschuldigd bedrag"],
            },
            items: parsed.data.map(row => ({
                description: `Invoice ${row["FedEx-factuurnummer"]}`,
                ledger_account: "verzendkosten",
                quantity: 1,
                tax: row["Totaal belastingen"] ?? 0,
                price: row["Oorspronkelijk verschuldigd bedrag"],
            }))
        };

        resolve(parsedData);
    });
}




function checkForTax(TAX_AMOUNT: number) {
  if (TAX_AMOUNT > 0) {
    return '21%';
  } else {
    return '0%';
  }
}
