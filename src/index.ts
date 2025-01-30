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

const INVOICE_NO = 25;

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
    
		if (url.pathname === "/favicon.ico") {
		  return new Response(null, { status: 204 }); // No content, avoids unnecessary processing
		}
	console.log("START");
	const RESPONSE = await moneybird.f_getAPIdata('documents/purchase_invoices.json', 'filter=period:prev_year,state:new', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, true);
	const INVOICE_DATA = f_parseInvoiceData(RESPONSE);
	const i = INVOICE_NO;
	//for (let i = INVOICE_NO; i < INVOICE_DATA.length; i++) {
		const RESPONSE_FILE = await moneybird.f_getAPIdata(`documents/purchase_invoices/${INVOICE_DATA[i].invoice_attachment_id}/attachments/${INVOICE_DATA[i].invoice_attachment_id}/download`, '', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, false);
		const FILE_ID = await openai.f_uploadFile(RESPONSE_FILE, env);
	
		const ASSISTANT_RESPONSE: any = await openai.f_updateAssistant(FILE_ID, env);
		const MSG_RESPONSE: interfaces.parsedInvoiceData = await openai.f_queryAssistant(FILE_ID, env);
		if (!MSG_RESPONSE || !INVOICE_DATA || MSG_RESPONSE.length === 0 || INVOICE_DATA.length === 0) {
			return new Response("ERROR", { status: 500 });
		};
		const MAPPED_DATA = await moneybird.f_mapData(MSG_RESPONSE, INVOICE_DATA[i].invoice_id, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		console.log("MAPPED_DATA: ", MAPPED_DATA);
		const UPDATE_RESPONSE = await moneybird.f_updateInvoice(INVOICE_DATA[i].invoice_id, MAPPED_DATA, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);
		// console.log("UPDATE_RESPONSE: ", UPDATE_RESPONSE);
		if (!UPDATE_RESPONSE || UPDATE_RESPONSE.length === 0) {
			return new Response("ERROR", { status: 500 });
		};
		//}
	//}


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
