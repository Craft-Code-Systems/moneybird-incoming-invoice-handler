import * as fedexInterface from './fedex_interface';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

// /**
//  * Gets the FedEx bearer TOKEN and saves it to the environment variable "FEDEX_BEARER_TOKEN"
//  * @returns {Promise<string>} The access TOKEN
//  */
// async function getFedExBearerToken(): Promise<string> {
//   const url = 'https://apis.fedex.com/oauth/TOKEN';

//   // Create URL-encoded form data
//   const formData = new URLSearchParams();
//   formData.append("grant_type", "client_credentials");
//   // Using non-null assertions for environment variables; adjust as needed.
//   formData.append("client_id", process.env.FEDEX_CLIENT_ID!);
//   formData.append("client_secret", process.env.FEDEX_CLIENT_SECRET!);

//   const headers = {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   };

//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       body: formData.toString(),
//       headers: headers,
//     });

//     const json: any = await response.json();
//     if (!response.ok) {
//       throw new Error(
//         'Failed to get FedEx bearer TOKEN: ' +
//           response.statusText +
//           ' (' +
//           response.status +
//           ')' +
//           ' Info: ' +
//           JSON.stringify(json)
//       );
//     }

//     FEDEX_BEARER_TOKEN = json.access_token;
//     FEDEX_TOKEN_EXPIRY = Date.now() + json.expires_in * 1000; // Calculate the expiry time

//     return json.access_token;
//   } catch (error) {
//     console.error('Error in GET request:', error);
//     throw error;
//   }
// }

// /**
//  * Returns a valid FedEx bearer TOKEN, refreshing it if expired.
//  * @returns {Promise<string>} The valid bearer TOKEN.
//  */
// async function getValidFedExBearerToken(): Promise<string> {
//   if (FEDEX_BEARER_TOKEN && FEDEX_TOKEN_EXPIRY && Date.now() < FEDEX_TOKEN_EXPIRY) {
//     return FEDEX_BEARER_TOKEN;
//   }
//   return await getFedExBearerToken();
// }

// /**
//  * Gets the FedEx shipping methods.
//  * @param postal_code - The recipient's postal code.
//  * @param country_code - The recipient's country code.
//  * @param order_weight - The weight of the package.
//  * @returns {Promise<any>} The rate reply details from FedEx.
//  */
// export async function getFedExShipMethods(
//   postal_code: string,
//   country_code: string,
//   order_weight: number
// ): Promise<any> {
//   const TOKEN = await getValidFedExBearerToken();

//   const accountNumber = '202992748';
//   const pickupType = 'USE_SCHEDULED_PICKUP';
//   const requestedPackageLineItems = [
//     {
//       weight: {
//         units: 'KG',
//         value: order_weight,
//       },
//     },
//   ];
//   const rateRequestType = ['ACCOUNT', 'LIST'];
//   const requestedShipment = {
//     shipper: {
//       address: {
//         postalCode: process.env.POSTALCODE!, // non-null assertion
//         countryCode: process.env.COUNTRY!, // non-null assertion
//       },
//     },
//     recipient: {
//       address: {
//         postalCode: postal_code,
//         countryCode: country_code,
//       },
//     },
//     pickupType: pickupType,
//     requestedPackageLineItems: requestedPackageLineItems,
//     rateRequestType: rateRequestType,
//   };
//   const rateRequest = {
//     accountNumber: {
//       value: accountNumber,
//     },
//     requestedShipment: requestedShipment,
//   };

//   const response = await fetchWithRetry(
//     'https://apis.fedex.com/rate/v1/rates/quotes',
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': 'Bearer ' + TOKEN,
//       },
//       body: JSON.stringify(rateRequest),
//     }
//   );

//   const contentType = response.headers.get('content-type');
//   let data: any;
//   if (contentType && contentType.includes('application/json')) {
//     data = await response.json();
//   } else {
//     data = await response.text(); // For XML or plain text error responses
//   }

//   if (!response.ok) {
//     throw new Error(
//       'Failed to get FedEx rates: ' +
//         response.statusText +
//         ' (' +
//         response.status +
//         ')' +
//         ' Info: ' +
//         JSON.stringify(data)
//     );
//   }

//   // Check if 'output' exists in the response
//   if (!data.output) {
//     throw new Error('Response does not contain output: ' + JSON.stringify(data));
//   }

//   // Check if 'rateReplyDetails' exists in the output
//   if (!data.output.rateReplyDetails) {
//     throw new Error(
//       'Response does not contain rateReplyDetails: ' + JSON.stringify(data.output)
//     );
//   }

//   return data.output.rateReplyDetails;
// }

/**
 * Performs a fetch request with retry logic.
 * @param url - The URL to fetch.
 * @param options - The fetch options.
 * @param retries - The maximum number of retries.
 * @param backoff - The initial backoff time in ms.
 * @returns {Promise<Response>} The fetch response.
 */
async function fetchWithRetry(
  url: string | URL | Request,
  options: RequestInit | undefined,
  retries: number = 5,
  backoff: number = 3000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        // Handle rate limiting
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : backoff * Math.pow(2, i); // Exponential backoff
        console.warn(`Rate limited. Retrying after ${waitTime} ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        const errorText = await response.text();
        console.error(`Request failed with status ${response.status}: ${errorText}`);
        throw new Error(`Request failed: ${response.statusText}`);
      }
    } catch (error: any) {
      if (i === retries - 1) {
        console.error("Max retries reached:", error);
        throw new Error("Request failed after maximum retries");
      }
      console.warn(`Attempt ${i + 1} failed with error: ${error.message}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, i))); // Exponential backoff
    }
  }

  throw new Error('Max retries reached. Request failed.');
}

export async function getCookie(AUTH: fedexInterface.auth): Promise<fedexInterface.auth | null> {
  const BROWSER: puppeteer.Browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',               // might help in some environments
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
    ]
  });

  // Close default pages (if any)
  const DEFAULT_PAGE = await BROWSER.pages();
  for (const PAGE of DEFAULT_PAGE) {
    if (PAGE.url() === 'about:blank') {
      await PAGE.close();
    }
  }

  // Use the default context for now
  const PAGE: puppeteer.Page = await BROWSER.newPage();
  await PAGE.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'
  );
  await PAGE.setViewport({ width: 1200, height: 720 });

  // Navigate to the login PAGE with adjusted wait conditions
  await PAGE.goto('https://www.fedex.com/secure-login/nl-nl/#/credentials', {
    waitUntil: 'networkidle2',
    timeout: 60000, // 60 seconds
  });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Fill in login form
  await PAGE.type('#username', CREDS.username);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await PAGE.type('#password', CREDS.password);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click and wait for navigation
    await Promise.all([
      PAGE.click('#login_button'),
      new Promise(resolve => setTimeout(resolve, 1000)),
      PAGE.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
  new Promise(resolve => setTimeout(resolve, 1000));
  await PAGE.click('text= Alle cookies accepteren');
  new Promise(resolve => setTimeout(resolve, 1000));
  // Navigate to the billing summary PAGE
    await PAGE.goto('https://www.fedex.com/online/billing/cbs/summary');
    new Promise(resolve => setTimeout(resolve, 5000));
  await PAGE.click('text=CONTINUE');

  // Extract cookies from the PAGE where login occurred
  const COOKIES: puppeteer.Cookie[] = await BROWSER.cookies();

  const COOKIE_STRING: string = COOKIES.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

  await BROWSER.close();
  const AUTH_EXP: fedexInterface.auth = {
    web_bearer_token: AUTH.web_bearer_token,
    web_client_cookie: COOKIE_STRING,
    web_transaction_id: AUTH.web_transaction_id,
    web_client_id: AUTH.web_client_id,  
    web_account_number: AUTH.web_account_number,
    api_bearer_token: AUTH.api_bearer_token,
    api_client_id: AUTH.api_client_id,
    api_client_secret: AUTH.api_client_secret,
    api_bearer_token_expires_at: AUTH.api_bearer_token_expires_at,
    web_client_username: AUTH.web_client_username,
    web_client_password: AUTH.web_client_password,
  };
  
  return AUTH_EXP;
}

/**
 * Retrieves a list of available files for download from FedEx.
 * @param AUTH - The authentication object returned from `fedexInterface.auth.getWebAuthentication()`.
 * @returns A list of file IDs, or `null` if no files are available.
 * @throws Error if the request fails or the response does not contain the expected fields.
 * @see https://developer.fedex.com/api/en/ship/v1/reports/retrieve.html
 */
export async function getDownloadFileList(AUTH: fedexInterface.auth): Promise<string[] | null> {
try{
  const RESPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/reports/retrieve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + AUTH.web_bearer_token,
      'Cookie': AUTH.web_client_cookie,
      'X-client-transaction-id': AUTH.web_transaction_id,
      'X-clientid': AUTH.web_client_id,
    },
    body: JSON.stringify({
      accountNumber: AUTH.web_account_number,
    }),
  });
  const CONTENT_TYPE  = RESPONSE.headers.get('content-type');
  let data: any;
  if (CONTENT_TYPE && CONTENT_TYPE.includes('application/json')) {
    data = await RESPONSE.json();
  } else {
    data = await RESPONSE.text(); // For XML or plain text error responses
  }

  if (!RESPONSE.ok) {
    console.error('Failed to get FedEx file list: ' + RESPONSE.statusText + ' (' + RESPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
    return null;
  }

  // Check if 'reportDetails' exists in the response
  if (!data.reportDetails || data.reportDetails.length === 0) {
    return null;
  } else {
    const FILE_LIST: string[] = [];
    for (let i = 0; i < data.reportDetails.length; i++) {
        FILE_LIST.push(data.reportDetails[i].reportId);
    }
    return FILE_LIST;
  }
}catch(ERROR: any){
    console.error(ERROR);
    return null;
}
}

/**
 * Downloads a FedEx document for a given file ID.
 * @param {string} FILE_ID - The ID of the document to download.
 * @param {fedexInterface.auth} AUTH - The authentication object containing web bearer token, client cookie, transaction ID, client ID, and account number.
 * @returns {Promise<string | null>} - The downloaded document content as a string, or null if an error occurred.
 * @throws Error if the download request fails.
 */

export async function getDownloadFile(FILE_ID: string, AUTH: fedexInterface.auth): Promise<string | null> {
    try{
  const RESPONSE: Response = await fetchWithRetry(
    'https://www.fedex.com/bill/v1/documents/reports/download',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AUTH.web_bearer_token,
        'Cookie': AUTH.web_client_cookie,
        // Note: Both "Cookie" and "cookie" headers are included as in the original code.
        'cookie': AUTH.web_client_cookie,
        'X-client-transaction-id': AUTH.web_transaction_id,
        'X-clientid': AUTH.web_client_id,
        'Accept': 'application/json, text/plain, */*',
        'Accept-encoding': 'gzip, deflate, br, zstd',
        'Origin': 'https://www.fedex.com',
        'Referer': 'https://www.fedex.com/online/billing/cbs/reporting/download-centre',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Dest': 'empty',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify({
        accountNumber: AUTH.web_account_number,
        documentId: FILE_ID,
      }),
    }
  );
  const DATA: string = await RESPONSE.text();

  if (!RESPONSE.ok) {
    console.error(
      'Failed to download FedEx file: ' +
      RESPONSE.statusText +
        ' (' +
        RESPONSE.status +
        ')'
    )
    return null;
  }
  return DATA;
}catch(ERROR: any){
    console.error(ERROR);
    return null;
}
}

/**
 * Gets the cost of a FedEx shipment given its TNT number.
 * @param {string} TNT - The TNT number of the shipment to get the cost for.
 * @param {fedexInterface.auth} AUTH - The authentication object containing web bearer token, client cookie, transaction ID, client ID, and account number.
 * @returns {Promise<fedexInterface.shipCost | null>} - The cost of the shipment as an object with properties `cost` (the cost in cents), `invoice_id` (the invoice ID), and `shipmenet_id` (the shipment ID), or null if an error occurred.
 * @throws Error if the request fails.
 */
export async function getShipCost(TNT: string, AUTH: fedexInterface.auth): Promise<fedexInterface.shipmentInfo | null> {

    const RESPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/shipments/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + AUTH.web_bearer_token,
            'Cookie': AUTH.web_client_cookie,
            'X-client-transaction-id': AUTH.web_transaction_id,
            'X-clientid': AUTH.web_client_id
        },
        body: JSON.stringify({
            "accountNumber": AUTH.web_account_number,
            "quickSearchCriteria": {
                "key": "TRACKING_ID",
                "value": TNT
            },
            "pageCriteria": {
                "cursor": 0,
                "pageSize": 250
            }
        })
    });
    const CONTENT_TYPE = RESPONSE.headers.get('content-type');
    let data: any;
    if (CONTENT_TYPE && CONTENT_TYPE.includes('application/json')) {
        data = await RESPONSE.json();
    } else {
        data = await RESPONSE.text(); // For XML or plain text error responses
    }   

    if (!RESPONSE.ok) { 
       console.error('Failed to get FedEx ship cost: ' + RESPONSE.statusText + ' (' + RESPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
       return null;
    }

        const SHIP_INFO: fedexInterface.shipmentInfo = {
            shipment_cost: data.shipments[0].originalAmount.amount || 0,
            invoice_id: data.shipments[0].invoice || '',
            shipmenet_id: data.shipments[0].shipment || '',
            actualWeight: 0,
            ratedWeight: 0,
            customs_cost: 0,
            shipment_tnt: TNT
        }

        return SHIP_INFO;
        
    
}

/**
 * Retrieves detailed shipment information from FedEx for a given shipment.
 * 
 * This function sends a request to the FedEx API to fetch additional details
 * about a shipment, including its actual and rated weight, and customs cost.
 * 
 * @param {fedexInterface.shipmentInfo} SHIPMENT - The initial shipment information
 * containing the invoice ID and shipment ID.
 * @param {fedexInterface.auth} AUTH - The authentication object containing web bearer token,
 * client cookie, transaction ID, client ID, and account number.
 * 
 * @returns {Promise<fedexInterface.shipmentInfo | null>} - An updated shipment information object
 * with actual weight, rated weight, and customs cost, or null if the request fails or the response
 * does not contain the expected fields.
 * 
 * @throws Will throw an error if the request to the FedEx API fails.
 */

export async function getShipInfo(SHIPMENT: fedexInterface.shipmentInfo, AUTH: fedexInterface.auth): Promise<fedexInterface.shipmentInfo | null> {

    const REPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/shipments/summaries/retrieve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + AUTH.web_bearer_token,
            'Cookie': AUTH.web_client_cookie,
            'X-client-transaction-id': AUTH.web_transaction_id,
            'X-clientid': AUTH.web_client_id
        },
        body: JSON.stringify({
            "accountNumber": AUTH.web_account_number,
            "invoice": SHIPMENT.invoice_id,
            "payerAccountNumber": AUTH.web_account_number,
            "processingOptions": ["DETAILS", "ADDITIONAL_DETAILS", "REFERENCES"], //["BILLING_INFO"]
            "shipment": SHIPMENT.shipmenet_id
        })
    });
    const contentType = REPONSE.headers.get('content-type');
    let data: any;
    if (contentType && contentType.includes('application/json')) {
        data = await REPONSE.json();
    } else {
        data = await REPONSE.text(); // For XML or plain text error responses
    }   

    if (!REPONSE.ok) { 
        throw new Error('Failed to get FedEx label cost: ' + REPONSE.statusText + ' (' + REPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
    }

    // Check if 'output' exists in the response

            const SHIP_INFO: fedexInterface.shipmentInfo = {
                shipment_cost: SHIPMENT.shipment_cost || 0,
                invoice_id: SHIPMENT.invoice_id || '',
                shipmenet_id: SHIPMENT.shipmenet_id || '',
                actualWeight: data.shipmentDetail.actualWeight.weightAmount || 0,
                ratedWeight: data.shipmentDetail.ratedweight.weightAmount || 0,
                customs_cost: data.customsInfo.customsValue.amount || 0,
                shipment_tnt: SHIPMENT.shipment_tnt
            }
        return SHIP_INFO;
        }
