

interface ApiResponse {
    status?: string;
    error?: string;
    [key: string]: any;
}

interface ContactDataResponse extends ApiResponse {
    id?: string;
}

/**
 * Get data from the Moneybird API.
 * @param ENDPOINT - The API endpoint to fetch.
 * @param PARAMETERS - Query parameters for the API call.
 */
export async function f_getAPIdata(ENDPOINT: string, PARAMETERS: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string, JSON: boolean): Promise<ApiResponse> {
    console.log("ID: ", MONEYBIRD_ID, "Token: ", MONEYBIRD_TOKEN);
    const OPTIONS = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${MONEYBIRD_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const RESPONSE = await fetch(`https://moneybird.com/api/v2/${MONEYBIRD_ID}/${ENDPOINT}?${PARAMETERS}`, OPTIONS);

        if (!RESPONSE.ok) {
            return { status: "ERROR", error: `${RESPONSE.status} - ${RESPONSE.statusText}` };
        }

        if (JSON) {
            const DATA = await RESPONSE.json();
            return DATA;
        }else{
        const DATA = await RESPONSE.arrayBuffer();
        return DATA;
        }

    } catch (err) {
        console.error('Error:', err);
        return { status: "ERROR", error: String(err) };
    }
}

/**
 * Post data to the Moneybird API.
 * @param ENDPOINT - The API endpoint to post to.
 * @param DATA - The data to send in the request body.
 */
export async function f_postAPIdata(ENDPOINT: string, DATA: object, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): Promise<ApiResponse> {
    const OPTIONS = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${MONEYBIRD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(DATA)
    };

    try {
        const RESPONSE = await fetch(`https://moneybird.com/api/v2/${MONEYBIRD_ID}/${ENDPOINT}`, OPTIONS);

        if (!RESPONSE.ok || ![200, 201, 202].includes(RESPONSE.status)) {
            return { status: "ERROR", error: `${RESPONSE.status} - ${RESPONSE.statusText}` };
        }

        const RESPONSE_DATA = await RESPONSE.json();
        return RESPONSE_DATA;

    } catch (err) {
        console.error('Error:', err);
        return { status: "ERROR", error: String(err) };
    }
}

/**
 * Get contact data from Moneybird API.
 * @param SELLER_COMPANY - The name of the seller company to search for.
 */
async function f_getContactData(SELLER_COMPANY: string): Promise<ContactDataResponse> {
    const ENDPOINT = "contacts.json";
    const PARAMETERS = `query=${SELLER_COMPANY}`;

    try {
        const DATA = await f_getAPIdata(ENDPOINT, PARAMETERS);
        if (Array.isArray(DATA) && DATA.length > 0) {
            return { id: DATA[0].id };
        } else {
            return { status: "ERROR", error: "No contacts found." };
        }
    } catch (err) {
        console.error('Error:', err);
        return { status: "ERROR", error: String(err) };
    }
}


export async function f_mapData(MSG_RESPONSE: any, INVOICE_ID: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string) {
    // Map the data to the required format from Moneybird: https://developer.moneybird.com/api/documents_purchase_invoices/#patch_documents_purchase_invoices_id 
    const detailsAttributes = await Promise.all(MSG_RESPONSE.items.map(async (item: any) => ({
        "description": item.description,
        "price": item.price,
        "amount": item.quantity || 0,
        "tax_rate_id": f_getTaxRateId(item.tax),
        "ledger_account_id": await f_getLedgerAccountID(item.ledger_account, MONEYBIRD_ID, MONEYBIRD_TOKEN)
    })));
    
    const MAPPED_DATA = {
        "id": INVOICE_ID,
        "reference": MSG_RESPONSE.invoice_number,
        "date": MSG_RESPONSE.invoice_date,
        "due_date": MSG_RESPONSE.exp_date,
        "contact_id": await f_getContactID(MSG_RESPONSE.company_info.name, MSG_RESPONSE.company_info.KVK, MONEYBIRD_ID, MONEYBIRD_TOKEN),
        "currency": "EUR",
        "prices_are_incl_tax": false,
        "details_attributes": detailsAttributes
    };

    return MAPPED_DATA;
}


function f_getTaxRateId(TAX_RATE: string): string {
    switch (TAX_RATE) {
        case "0%":
            return "331380232039696188";
        case "9%":
            return "331380232038647611";
        case "21%":
            return "331380232042841917";
        default:
            return "331380232042841917";
    }
}

async function f_getLedgerAccountID(LEDGER_aCCOUNT: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): string {
    const RESPONSE = await f_getAPIdata('ledger_accounts.json', '', MONEYBIRD_ID, MONEYBIRD_TOKEN, true);
    for (let i = 0; i < RESPONSE.length; i++) {
        if (RESPONSE[i].name === LEDGER_aCCOUNT) {
            return RESPONSE[i].id;
        }
    }
    return "0";
}

async function f_getContactID(COMPANY_NAME: string, KvK: string, MONEYBIRD_ID: string, MONEYBIRD_TOKEN: string): string {
    const RESPONSE = await f_getAPIdata('contacts.json', '', MONEYBIRD_ID, MONEYBIRD_TOKEN, true);
    console.log("contact: ", COMPANY_NAME);
    for (let i = 0; i < RESPONSE.length; i++) {
        console.log("contact: ", RESPONSE[i].company_name, " | KvK: ", RESPONSE[i].chamber_of_commerce);
        if (RESPONSE[i].chamber_of_commerce = (KvK) || (RESPONSE[i].company_name === COMPANY_NAME)) {
            console.log("contact id: ", RESPONSE[i].id);
            return RESPONSE[i].id;
        }
    }
    return "0";
}