import * as interfaces from "../interfaces";
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as fedex from "../integrations/fedex.js";

export async function getCSVFileList() {
    const FILE_LIST: any = await fedex.getFileList();
    console.log("FILE_LIST: ", FILE_LIST);
    let invoice_data = [];
    for (let i = 0; i < FILE_LIST.length; i++) {
        const CSV_FILE = fedex.getFile(FILE_LIST[i].documentId);
        console.log("CSV_FILE: ", CSV_FILE);
        invoice_data.push(await parseInvoiceCSV(CSV_FILE));
    }
    
    return invoice_data;
}

export async function parseInvoiceCSV(csvData: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        
        if (csvData instanceof ArrayBuffer) {
            csvData = new TextDecoder().decode(csvData);
        } else if (typeof csvData !== 'string') {
            return reject(new Error('CSV data is not a valid string or ArrayBuffer'));
        }

        const csvRows = csvData.split('\n');
        const headers = csvRows[0].split(',');

        for (let i = 1; i < csvRows.length; i++) {
            const row = csvRows[i].split(',');
            if (row.length !== headers.length) continue;

            const rowData: any = {};
            headers.forEach((header, index) => {
                rowData[header.trim()] = row[index]?.trim() || '';
            });
            results.push(rowData);
        }

        if (results.length === 0) {
            return reject(new Error('CSV data is empty or not formatted correctly'));
        }

        const firstRow = results[0];

        const parsedData: any = {
            company_info: {
                name: firstRow['Land/gebied van facturatie'] || 'Unknown',
                KvK_number: firstRow['Rijksregisternummer (BE)/Burgerservicenummer (NL)'] || 'Unknown',
                address: 'N/A'
            },
            invoice_details: {
                invoice_number: firstRow['FedEx-factuurnummer'],
                invoice_date: firstRow['Factuurdatum'],
                exp_date: firstRow['Vervaldatum'],
                total_price: parseFloat(firstRow['Oorspronkelijk verschuldigd bedrag'])
            },
            items: results.map(row => ({
                description: `${row['Luchtvrachtbriefnummer']} - ${row['Referentie 1 verzender']} - ${row['SvcPkg-label']} - ${row['Werkelijk gewicht']}KG` || 'Unknown',
                ledger_account: 'verzendkosten',
                quantity: row['Stuks'] || 1,
                tax: row['In rekening gebrachte valuta'] || '0%',
                price: parseFloat(row['Totale bedrag luchtvrachtbrief']) - (parseFloat(row['Totale kosten luchtvrachtbrief']) || 0)
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
