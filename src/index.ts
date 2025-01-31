/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;

import * as moneybird from "./lib/integrations/moneybird";
import * as openai from "./lib/integrations/openai";
import * as interfaces from "./lib/interfaces";


export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
    
		if (url.pathname === "/favicon.ico") {
		  return new Response(null, { status: 204 }); // No content, avoids unnecessary processing
		}
	console.log("START");
	const RESPONSE = await moneybird.f_getAPIdata('documents/purchase_invoices.json', 'filter=contact_id:414810225214752506,state:new', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, true);
	const INVOICE_DATA = f_parseInvoiceData(RESPONSE);
	for (let i = 0; i < INVOICE_DATA.length ; i++) { //INVOICE_DATA.length
		const RESPONSE_FILE = await moneybird.f_getAPIdata(`documents/purchase_invoices/${INVOICE_DATA[i].invoice_attachment_id}/attachments/${INVOICE_DATA[i].invoice_attachment_id}/download`, '', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, false);
		const FILE_ID = await openai.f_uploadFile(RESPONSE_FILE, env);
	
		const ASSISTANT_RESPONSE: any = await openai.f_updateAssistant(FILE_ID, env);
		
		let msg_response: interfaces.parsedInvoiceData = await openai.f_queryAssistant(FILE_ID, env, `Analyze the PDF file (${FILE_ID}) carefully and completely and provide me with the following info in JSON-format (see example.json (file-WWUxrf3rho67fCRH1q5qJh) for the correct format) -company info (where the invoice is send from, can be found in the top left corner, but can also be found in the bottom left corner and it should NOT contain hammertech or instantpack)) -invoice date -exp. date (30 days from invoice dateif not specified) -invoice number -KvK number -per item a description -per item a relevant ledger account (use one from ledgers.txt, file-662HzvcLRrvD9yLyvX7f7P) -per item a relevant tax (either 0% or 21%) -per item the correct price (can not be 0). Notes: Make sure to include all the items and use the context.txt file (file-9XCDCnoeYX4tosZP78QMrz) as context/reference `);
		if (!msg_response || !INVOICE_DATA || msg_response.length === 0 || INVOICE_DATA.length === 0) {
			return new Response("ERROR", { status: 500 });
		};

		let sumOfItemPrices: number = 0;
		for (let i = 0; i < msg_response.items.length; i++) {
			sumOfItemPrices = sumOfItemPrices + parseFloat(msg_response.items[i].price);
		}
		console.log("Total price string: ", msg_response.invoice_details.total_price);
		let totalPrice: number = parseFloat(msg_response.invoice_details.total_price);
		console.log("sumOfItemPrices: ", sumOfItemPrices);
		console.log("Total price: ", totalPrice);
		
		while (sumOfItemPrices != totalPrice) {
			msg_response = await openai.f_queryAssistant(FILE_ID, env, `The sum of items prices (${sumOfItemPrices}) 'subtotaal' is not equal to the total price (${totalPrice}) 'totaalbedrag'. This means that not all items have been found, please try to Analyze the PDF file (${FILE_ID}) carefully and completely again in JSON-format (see example.json (file-WWUxrf3rho67fCRH1q5qJh)`);
		if (!msg_response || !INVOICE_DATA || msg_response.length === 0 || INVOICE_DATA.length === 0) {
			return new Response("ERROR", { status: 500 });
		};
		for (let i = 0; i < msg_response.items.length; i++) {
			sumOfItemPrices = sumOfItemPrices + parseFloat(msg_response.items[i].price);
		}
			console.log("sumOfItemPrices: ", sumOfItemPrices);
			console.log("Total price: ", totalPrice);
		}


		const MAPPED_DATA = await moneybird.f_mapData(msg_response, INVOICE_DATA[i].invoice_id, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		if (MAPPED_DATA?.contact_id === 0 || MAPPED_DATA?.details_attributes[0].ledger_account_id === 0) {
			// skip this invoice
			console.log("DATA: ", JSON.stringify(MAPPED_DATA));
			continue;
		}
		console.log("reference: ", MAPPED_DATA.reference);
		const UPDATE_RESPONSE = await moneybird.f_updateInvoice(INVOICE_DATA[i].invoice_id, MAPPED_DATA, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		// console.log("UPDATE_RESPONSE: ", UPDATE_RESPONSE);
		if (!UPDATE_RESPONSE || UPDATE_RESPONSE.length === 0) {
			return new Response("ERROR", { status: 500 });
		};
	}


	return new Response("OK", { status: 200 });
	},

  };
  
// loop trough all the documents and get the ID and the ID of the first attachment (the invoice PDF)
  function f_parseInvoiceData(DATA: interfaces.InvoiceDataResponse): interfaces.InvoiceData[] | null {
	try{
		let INVOICE_DATA = [];
		for (let i = 0; i < DATA.length; i++) {
			const INVOICE_ID: string = DATA[i].id;
			const INVOICE_ATTACHMENTS: interfaces.InvoiceAttachment[] = DATA[i].attachments;
			const INVOICE_ATTACHMENT_ID: string = INVOICE_ATTACHMENTS[0].id;
			INVOICE_DATA.push({
				"invoice_id": INVOICE_ID,
				"invoice_attachment_id": INVOICE_ATTACHMENT_ID
			});
		}
		return INVOICE_DATA;
	}catch(ERROR: any){
		console.log("f_parseInvoiceData: ", ERROR);
		return null;
	}

  };
