

import * as interfaces from "../interfaces";
import BigNumber from '../bignumber.js';


/**
 * Fetches data from a Moneybird API endpoint.
 * @param ENDPOINT The API endpoint to fetch data from.
 * @param PARAMETERS Query string parameters for the API request.
 * @param MONEYBIRD_ID The Moneybird administration ID.
 * @param MONEYBIRD_TOKEN The Moneybird API token.
 * @param JSON If true, the response is expected to be JSON, otherwise it is expected to be a PDF.
 * @returns The API response or an error object if the response was not OK.
 * @throws Error if the API request failed.
 */
export async function f_getAPIdata(ENDPOINT: string, PARAMETERS: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string, JSON: boolean): Promise<interfaces.ApiResponse | ArrayBuffer | null> {
    const OPTIONS: RequestInit = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${MONEYBIRD_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const RESPONSE: Response = await fetch(`https://moneybird.com/api/v2/${MONEYBIRD_ID}/${ENDPOINT}?${PARAMETERS}`, OPTIONS);

        if (!RESPONSE.ok) {
            console.log("Error: ", RESPONSE.status, RESPONSE.statusText, "Response: ", await RESPONSE.text());
            return { status: "ERROR", error: `${RESPONSE.status} - ${RESPONSE.statusText}` };
        }

        if (JSON) {
            const DATA: interfaces.ApiResponse = await RESPONSE.json();
            return DATA;
        }else{
            // Check if response header content-type is application/pdf
            if (RESPONSE.headers.get('Content-Type') === 'application/pdf') {
                const DATA: ArrayBuffer = await RESPONSE.arrayBuffer();
                return DATA;
            }else{
                return null;
            }
        }

    } catch (ERROR: any) {
        console.error('Error:', ERROR);
        return null;
    }
}


/**
 * Posts data to a Moneybird API endpoint.
 * @param ENDPOINT The API endpoint to post data to.
 * @param DATA The data to post in the request body.
 * @param MONEYBIRD_ID The Moneybird administration ID.
 * @param MONEYBIRD_TOKEN The Moneybird API token.
 * @returns The API response or an error object if the response was not OK.
 * @throws Error if the API request failed.
 */
export async function f_postAPIdata(ENDPOINT: string, DATA: object, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<interfaces.ApiResponse | null> {
    const OPTIONS: RequestInit = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${MONEYBIRD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(DATA)
    };

    try {
        const RESPONSE: Response = await fetch(`https://moneybird.com/api/v2/${MONEYBIRD_ID}/${ENDPOINT}`, OPTIONS);

        if (!RESPONSE.ok || ![200, 201, 202].includes(RESPONSE.status)) {
            console.log("Error: ", RESPONSE.status, RESPONSE.statusText, "Response: ", await RESPONSE.text());
            return { status: "ERROR", error: `${RESPONSE.status} - ${RESPONSE.statusText}` };
        }

        const RESPONSE_DATA: interfaces.ApiResponse = await RESPONSE.json();
        return RESPONSE_DATA;

    } catch (ERROR: any) {
        console.error('Error:', ERROR);
        return null;
    }
}

/**
 * Posts data to a Moneybird API endpoint.
 * @param ENDPOINT The API endpoint to post data to.
 * @param DATA The data to post in the request body.
 * @param MONEYBIRD_ID The Moneybird administration ID.
 * @param MONEYBIRD_TOKEN The Moneybird API token.
 * @returns The API response or an error object if the response was not OK.
 * @throws Error if the API request failed.
 */
export async function f_patchAPIdata(ENDPOINT: string, DATA: object, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<interfaces.ApiResponse | null> {
    const OPTIONS: RequestInit = {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${MONEYBIRD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(DATA, (_, value) =>
            typeof value === "bigint" ? value.toString() : value // Convert BigInt to string
        )
    };

    try {
        const RESPONSE: Response = await fetch(`https://moneybird.com/api/v2/${MONEYBIRD_ID}/${ENDPOINT}`, OPTIONS);

        if (!RESPONSE.ok || ![200, 201, 202].includes(RESPONSE.status)) {
            console.log("Error: ", RESPONSE.status, RESPONSE.statusText, "Response: ", await RESPONSE.text());
            return { status: "ERROR", error: `${RESPONSE.status} - ${RESPONSE.statusText}` };
        }

        const RESPONSE_DATA: interfaces.ApiResponse = await RESPONSE.json();
        return RESPONSE_DATA;

    } catch (ERROR: any) {
        console.error('Error:', ERROR);
        return null;
    }
}

function safeConvertBigInt(value: any): any {
    if (typeof value === "bigint") {
        return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString(); // Convert only safe numbers, keep large ones as strings
    }
    return value;
}



export async function f_mapData(MSG_RESPONSE: any, INVOICE_ID: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<interfaces.InvoiceData | null> {
    try {
        const ATTRIBUTES: interfaces.InvoiceDataAttributes[] = await Promise.all(MSG_RESPONSE.items.map(async (item: interfaces.Item) => ({
            "description": item.description,
            "price": parseFloat(item.price), // Convert price to float
            "amount": item.quantity || 1,
            "tax_rate_id": safeConvertBigInt(BigInt(f_getTaxRateId(item.tax))), // Convert safely
            "tax_rate": item.tax, // DEBUG
            "ledger_account_id": safeConvertBigInt(BigInt(await f_getLedgerAccountID(item.ledger_account, MONEYBIRD_ID, MONEYBIRD_TOKEN))), // Convert safely
            "ledger_account": item.ledger_account // DEBUG
        })));

        const MAPPED_DATA: interfaces.InvoiceData = {
            "id": safeConvertBigInt(BigInt(INVOICE_ID)), // Convert safely
            "reference": MSG_RESPONSE.invoice_details.invoice_number,
            "date": MSG_RESPONSE.invoice_details.invoice_date,
            "due_date": MSG_RESPONSE.invoice_details.exp_date,
            "contact_id": safeConvertBigInt(BigInt(await f_getContactID(MSG_RESPONSE.company_info.name, MSG_RESPONSE.company_info.KvK_number, MONEYBIRD_ID, MONEYBIRD_TOKEN))), // Convert safely
            "contact": MSG_RESPONSE.company_info.name, // DEBUG
            "currency": "EUR",
            "prices_are_incl_tax": false,
            "revenue_invoice": false,
            "details_attributes": ATTRIBUTES
        };

        return MAPPED_DATA;
    } catch (ERROR: any) {
        console.error('Error:', ERROR);
        return null;
    }
}







/**
 * Maps a tax rate percentage string to the corresponding Moneybird tax rate ID.
 * @param TAX_RATE The tax rate percentage string.
 * @returns The Moneybird tax rate ID.
 */
function f_getTaxRateId(TAX_RATE: string): string {
    switch (TAX_RATE) {
        case "0%":
            return "332927300977821308";
        case "9%":
            return "331380232044939070";
        case "21%":
            return "331380232042841917";
        default:
            return "331380232042841917";
    }
}

/**
 * Maps a ledger account name to the corresponding Moneybird ledger account ID.
 * @param LEDGER_aCCOUNT The ledger account name.
 * @param MONEYBIRD_ID The Moneybird administration ID.
 * @param MONEYBIRD_TOKEN The Moneybird API token.
 * @returns The Moneybird ledger account ID.
 */
async function f_getLedgerAccountID(LEDGER_aCCOUNT: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<string> {
    const RESPONSE: interfaces.ApiResponse = await f_getAPIdata('ledger_accounts.json', '', MONEYBIRD_ID, MONEYBIRD_TOKEN, true);
    for (let i = 0; i < RESPONSE.length; i++) {
        if (RESPONSE[i].name === LEDGER_aCCOUNT) {
            return RESPONSE[i].id;
        }
    }
    return "0";
}

/**
 * Finds the Moneybird contact ID for a contact with a given company name or KvK number.
 * @param COMPANY_NAME The company name of the contact.
 * @param KvK The KvK number of the contact.
 * @param MONEYBIRD_ID The Moneybird administration ID.
 * @param MONEYBIRD_TOKEN The Moneybird API token.
 * @returns The Moneybird contact ID.
 */
async function f_getContactID(COMPANY_NAME: string, KvK: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<string> {
    const RESPONSE: interfaces.ApiResponse = await f_getAPIdata('contacts.json', `query=${COMPANY_NAME}&query=${KvK}`, MONEYBIRD_ID, MONEYBIRD_TOKEN, true);
    for (let i = 0; i < RESPONSE.length; i++) {
        if (RESPONSE[i].chamber_of_commerce = (KvK) || (RESPONSE[i].company_name === COMPANY_NAME)) {
            return RESPONSE[i].id;
        }
    }
    return "0";
}

export async function f_updateInvoice(INVOICE_ID: string, MAPPED_DATA: interfaces.InvoiceData, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<interfaces.ApiResponse | null> {
    const RESPONSE: interfaces.ApiResponse = await f_patchAPIdata(`documents/purchase_invoices/${INVOICE_ID}.json`, {purchase_invoice: MAPPED_DATA}, MONEYBIRD_ID, MONEYBIRD_TOKEN);
    if(RESPONSE.status === "ERROR") return null;
    return RESPONSE;
}