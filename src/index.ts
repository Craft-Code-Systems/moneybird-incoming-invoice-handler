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
import * as fedex from "./lib/modules/fedex-invoices";
import * as fedexInterface from "./lib/integrations/fedex_interface.js";

export default {
	async fetch(request: Request, env: { MY_BROWSER: Fetcher }): Promise<Response> {
		const url = new URL(request.url);
    
		if (url.pathname === "/favicon.ico") {
		  return new Response(null, { status: 204 }); // No content, avoids unnecessary processing
		}
	console.log("START");

	// Get data from .env file
const AUTH: fedexInterface.auth = Object.freeze({
    api_client_id: env.FEDEX_CLIENT_API_ID ?? '',
    web_bearer_token: env.FEDEX_WEB_TOKEN ?? '',
    api_client_secret: env.FEDEX_CLIENT_SECRET ?? '',
    web_client_id: env.FEDEX_CLIENT_WEB_ID ?? '',
    web_client_username: env.FEDEX_USERNAME ?? '',
    web_client_password: env.FEDEX_PASSWORD ?? '',
    web_client_cookie: '',
    web_account_number: env.FEDEX_ACCOUNT_NUMBER ?? '',
    web_transaction_id: env.FEDEX_TRANSACTION_ID ?? '',
    api_bearer_token: '',
    api_bearer_token_expires_at: 0,
  });
    // 1) Check for existence
    // if (typeof env.MY_BROWSER === "undefined") {
	// 	return new Response("❌ MY_BROWSER is undefined — binding not configured", { status: 500 });
	//   }
	//   // 2) Check that it has the fetch() method
	//   if (typeof (env.MY_BROWSER as any).fetch !== "function") {
	// 	return new Response(
	// 	  `❌ MY_BROWSER.fetch is not a function (got: ${typeof (env.MY_BROWSER as any).fetch})`,
	// 	  { status: 500 }
	// 	);
	//   }
	  // If you get here, the binding is present
	//   console.log("✅ MY_BROWSER is set up correctly", { status: 200 });
	// const RESPONSE = await fedex.getCSVFileList(AUTH, env.MY_BROWSER); 
	// //filter=contact_id:414810225214752506
	const RESPONSE = await moneybird.f_getAPIdata('documents/purchase_invoices.json', 'state:new', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, true);
	const INVOICE_DATA = f_parseInvoiceData(RESPONSE);
	console.log(`✅ Found ${INVOICE_DATA.length} new invoices`);
	for (let i = 0; i < INVOICE_DATA.length ; i++) { //INVOICE_DATA.length
		// console.log(`INVOICE_DATA (${i}): `, INVOICE_DATA[i]);
		const RESPONSE_FILE = await moneybird.f_getAPIdata(`documents/purchase_invoices/${INVOICE_DATA[i].invoice_attachment_id}/attachments/${INVOICE_DATA[i].invoice_attachment_id}/download`, '', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, false);
		const FILE_ID = await openai.f_uploadFile(RESPONSE_FILE, env);
	
		const ASSISTANT_RESPONSE: any = await openai.f_updateAssistant(FILE_ID, env);
		
		let msg_response: interfaces.parsedInvoiceData = await openai.f_queryAssistant(FILE_ID, env, `Analyze the PDF file (${FILE_ID}) carefully and completely and provide me with the following info in JSON-format (see example.json (file-WWUxrf3rho67fCRH1q5qJh) for the correct format) -company info (where the invoice is send from, can be found in the top left corner, but can also be found in the bottom left corner and it should NOT contain hammertech or instantpack)) -invoice date -exp. date (30 days from invoice dateif not specified) -invoice number -KvK number -per item a description -per item a relevant ledger account (use one from ledgers.txt, file-662HzvcLRrvD9yLyvX7f7P) -per item a relevant tax (either 0% or 21%) -per item the correct price (can not be 0). Notes: Make sure to include all the items and use the context.txt file (file-L7qRsifZZndeU2iYSgjnWt) as context/reference `);
		if (!msg_response || !INVOICE_DATA || INVOICE_DATA.length === 0) {
			console.log("ERROR at document: ", INVOICE_DATA[i]);
			continue;
			//return new Response("ERROR", { status: 500 });
		};

		let sumOfItemPrices: number = 0;
		for (let i = 0; i < msg_response.items.length; i++) {
			sumOfItemPrices = sumOfItemPrices + parseFloat(msg_response.items[i].price);
		}
		console.log("company_info: ", msg_response.company_info);
		console.log("invoice_details: ", msg_response.invoice_details);
		console.log("items: ", msg_response.items);
		console.log("Total price string: ", msg_response.invoice_details.total_price);
		let totalPrice: number = parseFloat(msg_response.invoice_details.total_price);
		console.log("sumOfItemPrices: ", sumOfItemPrices);
		console.log("Total price: ", totalPrice);
		
		// while (sumOfItemPrices != totalPrice) {
		// 	msg_response = await openai.f_queryAssistant(FILE_ID, env, `The sum of items prices (${sumOfItemPrices}) 'subtotaal' is not equal to the total price (${totalPrice}) 'totaalbedrag'. This means that not all items have been found, please try to Analyze the PDF file (${FILE_ID}) carefully and completely again in JSON-format (see example.json (file-WWUxrf3rho67fCRH1q5qJh)`);
		// if (!msg_response || !INVOICE_DATA || msg_response.length === 0 || INVOICE_DATA.length === 0) {
		// 	return new Response("ERROR", { status: 500 });
		// };
		// for (let i = 0; i < msg_response.items.length; i++) {
		// 	sumOfItemPrices = sumOfItemPrices + parseFloat(msg_response.items[i].price);
		// }
		// 	console.log("sumOfItemPrices: ", sumOfItemPrices);
		// 	console.log("Total price: ", totalPrice);
		// }


		const MAPPED_DATA = await moneybird.f_mapData(msg_response, INVOICE_DATA[i].invoice_id, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		if (MAPPED_DATA?.contact_id === 0 || MAPPED_DATA?.details_attributes[0].ledger_account_id === 0) {
			// skip this invoice
			console.log("DATA: ", JSON.stringify(MAPPED_DATA));
			continue;
		}
		console.log("reference: ", MAPPED_DATA.reference);
		// const UPDATE_RESPONSE = await moneybird.f_updateInvoice(INVOICE_DATA[i].invoice_id, MAPPED_DATA, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		// // console.log("UPDATE_RESPONSE: ", UPDATE_RESPONSE);
		// if (!UPDATE_RESPONSE || UPDATE_RESPONSE.length === 0) {
		// 	return new Response("ERROR", { status: 500 });
		// };
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
