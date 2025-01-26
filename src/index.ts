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

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {

	const RESPONSE = await moneybird.f_getAPIdata('documents/purchase_invoices.json', 'filter/period:prev_year,state:new/', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, true);
	const INVOICE_DATA = f_parseInvoiceData(RESPONSE);
	
	const RESPONSE_FILE = await moneybird.f_getAPIdata(`documents/purchase_invoices/${INVOICE_DATA[4].invoice_attachment_id}/attachments/${INVOICE_DATA[4].invoice_attachment_id}/download`, '', env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN, false);
	const FILE_ID = await openai.f_uploadFile(RESPONSE_FILE);
	
	const ASSISTANT_RESPONSE = await openai.f_updateAssistant(FILE_ID);
	const MSG_RESPONSE = await openai.f_queryAssistant(FILE_ID);
	const MAPPED_DATA = await moneybird.f_mapData(MSG_RESPONSE, INVOICE_DATA[4].id, env.MONEYBIRD_ID, env.MONEYBIRD_TOKEN);

	return new Response(JSON.stringify(MAPPED_DATA), { status: 200 });
	},

  };
  
// loop trough all the documents and get the ID and the ID of the first attachment (the invoice PDF)
  function f_parseInvoiceData(DATA: any) {
	try{
		let INVOICE_DATA = [];
		for (let i = 0; i < DATA.length; i++) {
			const INVOICE_ID = DATA[i].id;
			const INVOICE_ATTACHMENTS = DATA[i].attachments;
			const INVOICE_ATTACHMENT_ID = INVOICE_ATTACHMENTS[0].id;
			INVOICE_DATA.push({
				"invoice_id": INVOICE_ID,
				"invoice_attachment_id": INVOICE_ATTACHMENT_ID
			});
		}
		return INVOICE_DATA;
	}catch(ERROR){
		console.log("f_parseInvoiceData: ", ERROR);
		return null;
	}

  };
