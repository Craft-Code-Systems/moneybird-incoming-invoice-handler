

// Interface for invoice data extracted from PDF by OpenAI
export interface parsedInvoiceData {
    company_info: CompanyInfo;
    invoice_details: InvoiceDetails;
    items: Item[];
}

export interface Item {
    description: string;
    ledger_account: string;
    quantity: number;
    tax: string;
    price: string;
}

export interface CompanyInfo {
    name: string;
    KvK_number: string;
    address: string;
}

export interface InvoiceDetails {
    invoice_number: string;
    invoice_date: string;
    exp_date: string;
}

//Moneybird API responses
export interface ApiResponse {
    status?: string;
    error?: string;
    [key: string]: any;
}

export interface ContactDataResponse extends ApiResponse {
    id?: string;
}

// Moneybird invoice mapped data
export interface InvoiceData {
    id: number;
    reference: string;
    date: string;
    due_date: string;
    contact_id: number;
    contact: string;
    currency: string;
    prices_are_incl_tax: boolean;
    revenue_invoice: boolean;
    details_attributes: InvoiceDataAttributes[];
}

export interface InvoiceDataAttributes {
    description: string;
    price: number;
    amount: number;
    tax_rate_id: number;
    tax_rate: string;
    ledger_account_id: number;
    ledger_account: string;
}