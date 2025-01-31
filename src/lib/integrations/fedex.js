/* eslint-disable custom/function-max-lines */
// FedEx bearer token
let FEDEX_BEARER_TOKEN = null;
let FEDEX_TOKEN_EXPIRY = null;

const cookie = "s_ecid=MCMID%7C19804795980299649993042338526807447139; fdx_redirect=nl-nl; cc_path=nl; fdx_locale=nl_NL; fdx_cbid=194226858617359139542105314481491; gdl-clientId=36d590c8-39b0-4168-943a-310dfda1d493; _svtri=3e853d9d-f4a6-4bb1-8bb4-745f918cf70e; _sfid_9c70={%22anonymousId%22:%22367c9d81270183a9%22%2C%22consents%22:[]}; _evga_92b6={%22uuid%22:%22367c9d81270183a9%22%2C%22puid%22:%22wXnhGcgbmOEZFjl5PEllS49ZwrPJ932R87IgNU4Pcl-64a1nt6bTRNaF8PlQzT-la9bLQkBZIzeQxYn8rw1HNtf1T-Wat6djIStXS2FmXd0%22%2C%22affinityId%22:%220Hv%22}; QSI_S_ZN_agz4jO87lMIUO1K=r:70:1; g_sref=(direct); _gcl_au=1.1.414550136.1738251679; control_group=62; _cls_v=cc739b61-69ef-419c-99bb-66b3961d99d7; optimizelyEndUserId=oeu1738251688822r0.9182693441891967; gdl_r42_store_mappings_p={%222001%22:%22oIZigK6Hjw%22}; sc_fcl_uuid=oIZigK6Hjw; fdxUID=82275855; Rbt=f0; fdx_bman=ec2b4a2fe2fd5c46b2eb38c0fa18c696; PIM-SESSION-ID=ayLUCtZJlR5uzMvw; at_check=true; isTablet=false; isMobile=false; isWireless=false; aemserver=PROD-P-dotcom; AMCVS_1E22171B520E93BF0A490D44%40AdobeOrg=1; s_cc=true; _cls_s=66d7f53e-2749-4112-ab3b-40d951ac31d0:1; optimizelySession=0; amlbcookie=01; mbox=PC#784eba74fadd4bb9a02773a233cec7e0.37_0#1801567526|session#542780dd3acb4673aa13a0cf337b34da#1738324591; QSI_SI_82kNIkA2qeJkiBE_intercept=true; xacc=NL; bm_mi=58E3F0CFE57105120C876AD24085E494~YAAQB/sQYDitppaUAQAAPTcDvRpCWPtUem4SHtvq7oubjprR9R9ozT9wDBDXLNJtms8Puvrapo2XBMg1swGdixmgOBma4zsOsnKGodJ/mBb2Fv3pAsad1dSW3tGmsPH+tGW6+aBWj9AaRB4z4rJ5ZyVFJm9oQYM2HvaIlcD3u9FV6jhEM6d7XD/qvH9fp3BanimydW0VgjkD3vbSVV5kgs2oB2Cq2jXfR0qQcvIalTXdaajcT8q880dKDqU+/qSbdoYGacngMdabd4N/6EvI3xGW+WHdDxoM9oBmznmQJg0rOUxlrq8EosNUNPsIWleQ5IM3LvNvFTyvlN2XEWUEms4cdSKDdJo=~1; s_invisit=true; g_stime=1738337899786; s_vnum=1738364399999&vn=3; ak_bmsc=1CBB7085F6DD625A16765A62B4F7AB85~000000000000000000000000000000~YAAQB/sQYO2uppaUAQAAnj8DvRrrbpmVed17hLguWJCi8H+EKIWV0PJePcKotw+JdHdBGwQgh3x13qLXVs17ahSRgekOaR8NVluG3S5uwA5hwivsB8/2BdYtLqeZX7/KXgIWbfR+J77Lk6JHCav73rvqc6dqWDyS0n02bkqgRePVVeKexsTew+s5P1XXMFWg3bQeqW5XOt3Wancl+/uBSiJsWeh87Uex3/CVZymjZ9hKEW1slsbYxbRvojsP87q7CTVBTBJeEWkq8OJy9vEeiWtijsSjI+hQHfmivwSIMwsqK8/wJvGW2Pia9iXRRG3UnZjlJp/xz69/YZZCa/s56cBfPjZkTYazdGoacHIkrtXeXTNxSfAsblPwaseb8ddg3n6sgi6RTbcGy/lJgF+SQp9ghijxWPkRE+QojLInh8dIPe2TQkLpUmvsKLUZwdtJC6hZFJXN9/GZDpyMJ+abAk9wFEdZyaYg4LaermesacxY6+Pww3uDWC3DDkhBIro224L1mrih2m0=; _svs=%7B%22c%22%3A%7B%221%22%3Atrue%2C%222%22%3Atrue%2C%223%22%3Atrue%7D%2C%22ct%22%3A1737554669868%2C%22p%22%3A%7B%2243%22%3A1738337900078%2C%222001%22%3A1738251715072%2C%222004%22%3A1738251678655%7D%7D; gdl_r42_store_mappings_s={%2243%22:%22trackId#3e853d9d-f4a6-4bb1-8bb4-745f918cf70e#|sessionTs#1738337899786#%22%2C%222004%22:%22marketingCloudVisitorId#19804795980299649993042338526807447139#|tntId#784eba74fadd4bb9a02773a233cec7e0.37_0#|sessionId#542780dd3acb4673aa13a0cf337b34da#|sessionTs#1738322636190#|mboxEdge#37#%22}; siteDC=atl; ab45335bc623e59=kOqNtV6BdS7i3xTNpE4SO0mw1-0.*AAJTSQACMDIAAlNLABxJeTN1YWpxeTlJZW5FUXFrOFo5VE16RXlEYnM9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; fdx_login=25029.d53b.60f58ec3175226c67c1abbdd0c3d22bb|kOqNtV6BdS7i3xTNpE4SO0mw1-0.*AAJTSQACMDIAAlNLABxJeTN1YWpxeTlJZW5FUXFrOFo5VE16RXlEYnM9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; fcl_uuid=oIZigK6Hjw; fcl_fname=Elwin; fcl_contactname='Elwin Hammer'; AMCV_1E22171B520E93BF0A490D44%40AdobeOrg=359503849%7CMCMID%7C19804795980299649993042338526807447139%7CMCIDTS%7C20119%7CMCAID%7CNONE%7CMCOPTOUT-1738345131s%7CNONE%7CMCAAMLH-1738942731%7C6%7CMCAAMB-1738942731%7Cj8Odv6LonN4r3an7LhD3WZrU1bUpAkFkkiY1ncBR96t2PTI%7CvVersion%7C5.0.1%7CMCCIDH%7C2139727112; ADRUM=s=1738337931657&r=https%3A%2F%2Fwww.fedex.com%2Fsecure-login%2Fnl-nl%2F%3F381707024; bm_sz=DFFFCBDC297C4F9C68A2114C5BDFD48F~YAAQB/sQYH3DppaUAQAARMADvRq4bUZIH9tTAQqtUpCcHuuVke3/C8tCmHPmey6ZuLvC1nvyosve6z//b7vbiEiWxWQF3zSzedY0apCwDpeSGdhhsVZsWw+iLdJAOaTFLz3+6tHUT8+REwQy13jC883rRZE/dW1A2+81QZSCpQSGqwOes/uSTTQ7xUv5SEsPXHhivfgDZ+t09e+1tagWeMib6vji2/QgSW81FsC0QPR+dvpv3dZ7xmbyUmZ4vf+S6Y9+ailx2mMy/3nKC0FxnR5aMoRnWwpAJy4CW2KuWgTI8aJ75mIE02RfDgmBAFJtatuhZczEbabMA6bYqKJZW/RWLuePkqdxpAFpQdvatKwc/ywBFYa6lmoA/1wOpULTKNRsCuZn42SP6/1ro0U6gXfspkrA19f+L9elnrfS1FFuiHUBRk0eI7TJNyqYMozjLekhXqFmT5YSnysvComKlsyRfAejwj6qzTRfiW4jisocu4sWAf4XtZ5BOScozhD6kiaf0e6H2QlsWQfzOBvsxOEUif7SEHRCyxzqXG1N/z4+9bsWIUglaf/Nha2eb5M/dcpCZv0WPOvoH21EHS2gpOTGdSj6Zg==~3360323~3294004; gpv_pageName=fedex/apps/cbs/invoice; setLink=fedex/apps/cbs/invoice^^link|downloadCenter^^fedex/apps/cbs/invoice%20|%20link|downloadCenter^^false^^; s_ppv=fedex/apps/cbs/invoice%2C73%2C73%2C0; bm_sv=930D73A410197B6888A5CFD091D1C760~YAAQI/sQYG6Caq2UAQAAhcYFvRoC330QoPOSjj+4Imtl8zPUzUdi2rwwe4nL8/f3ypLQwhTtQecaV/hd2qM3xCa8J+t0q2omGv91QBoPD5P0fGaZlWow2OZBsVv//p4VE81zb3EwpMdRhdWJDUIzmYXPsVah2ewTmcsmTNfcx1h4QsxvLgcm1RyebB7cb2p7aFFWNiGx44pdUHbDDMmRBY+bBUfanbquJ+fkkWudgDAgaDnRxbRLd3Jg7kPkB7Cj~1; _abck=44682EBD3AE4D276BDA62A3711B7F708~0~YAAQB/sQYBNAp5aUAQAAEBAHvQ309H9eStt6CkTJhDIJvPf9ArVcLoLPrEkTv/jtL/785MY1lWfaXGOPW/9NMC+CRgEdsWL40CkKA7LcAif1/aQt5oJO77OBap6U9Ppfn7HOTu0ALGYErxb8v/aGYSpXizVUYM5hTgLHRD4QfdKeuaWcJlEyy/yI050SiTsrKFuNhiASQ/JDFP9lkxz60H0lFcynNlEOLJh8ZXz3MESFg559JNVeurdGPUf7dfZCKUEMJ3pN+FPBK6Nu7qrvYzQpPLOH5CJ5opzcNCmfLhLPKDqtvAg6GKIUFq6SjpiUXUAT9b30oQGXy1wQtJWwP1q3dcPYpum0Pcu/gRik/6j3WanA/3sz7+cchKalz2ZEjxu4FC6AAJ2T5Rci+fISxbKvHgy93SC6X6OmkuNlY0ZroLOf896NK7R4jftdLgYn835aEBSockm6q0V7xjTVbZwGwOiIMI1Ravb/sZcept0CBXa5rCxDvR7/lPJGEDn4GFHFyY1nMeHP+YcWMCxk36Ooog4F6PWwKhlgcyFc1hEB+d+ulPsNmLIco62FKnPa6fOYQgeoBNrjbAE2Dm+Kbqkzm+rOjTVu4x/VY9LIjUHLXWRV1XTfNDVgnORFPw==~-1~-1~1738339764; s_sq=fedexglbl%3D%2526c.%2526a.%2526activitymap.%2526page%253Dfedex%25252Fapps%25252Fcbs%25252Finvoice%2526link%253DFEDEX_INVOICE_2025-01-31_12_29%2526region%253Dcontent%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c";

// This function gets the FedEx bearer token and saves it to the environment variable "FEDEX_BEARER_TOKEN"
async function getFedExBearerToken() {
    const url = 'https://apis.fedex.com/oauth/token';

    // Create URL-encoded form data
    const formData = new URLSearchParams();
    formData.append("grant_type", "client_credentials");
    formData.append("client_id", process.env.FEDEX_CLIENT_ID); // Use environment variables for sensitive data
    formData.append("client_secret", process.env.FEDEX_CLIENT_SECRET);

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        const response = await fetch(url, {
            method: 'POST', 
            body: formData.toString(),
            headers: headers, 
        });

        const json = await response.json();
        if (!response.ok) {
            throw new Error('Failed to get FedEx bearer token: ' + response.statusText + ' (' + response.status + ')' + ' Info: ' + JSON.stringify(json));
        }

        FEDEX_BEARER_TOKEN = json.access_token;
        FEDEX_TOKEN_EXPIRY = Date.now() + (json.expires_in * 1000); // Calculate the expiry time

        return json.access_token;
    } catch (error) {
        console.error('Error in GET request:', error);
        throw error;
    }
}

async function getValidFedExBearerToken() {
    if (FEDEX_BEARER_TOKEN && Date.now() < FEDEX_TOKEN_EXPIRY) {
        return FEDEX_BEARER_TOKEN;
    }
    return await getFedExBearerToken();
}

/**
 * @param {any} postal_code
 * @param {any} country_code
 * @param {any} order_weight
 */
export async function getFedExShipMethods(postal_code, country_code, order_weight) {
    const token = await getValidFedExBearerToken();

    const accountNumber = '202992748';
    const pickupType = 'USE_SCHEDULED_PICKUP';
    const requestedPackageLineItems = [
        {
            'weight': {
                'units': 'KG',
                'value': order_weight
            }
        }
    ];
    const rateRequestType = ['ACCOUNT', 'LIST'];
    const requestedShipment = {
        'shipper': {
            'address': {
                'postalCode': process.env.POSTALCODE, 
                'countryCode': process.env.COUNTRY
            }
        },
        'recipient': {
            'address': {
                'postalCode': postal_code, 
                'countryCode': country_code
            }
        },
        'pickupType': pickupType,
        'requestedPackageLineItems': requestedPackageLineItems,
        'rateRequestType': rateRequestType
    };
    const rateRequest = {
        'accountNumber': {
            'value': accountNumber
        },
        'requestedShipment': requestedShipment
    };

    const response = await fetchWithRetry('https://apis.fedex.com/rate/v1/rates/quotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(rateRequest)
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text(); // For XML or plain text error responses
    }

    if (!response.ok) {
        throw new Error('Failed to get FedEx rates: ' + response.statusText + ' (' + response.status + ')' + ' Info: ' + JSON.stringify(data));
    }

    // Check if 'output' exists in the response
    if (!data.output) {
        throw new Error('Response does not contain output: ' + JSON.stringify(data));
    }

    // Check if 'rateReplyDetails' exists in the output
    if (!data.output.rateReplyDetails) {
        throw new Error('Response does not contain rateReplyDetails: ' + JSON.stringify(data.output));
    }

    return data.output.rateReplyDetails;
}


/**
 * @param {string | URL | Request} url
 * @param {RequestInit | undefined} options
 */
async function fetchWithRetry(url, options, retries = 5, backoff = 3000) {
    // console.log(`Fetching: ${url}`);
    // console.log(`Options: ${JSON.stringify(options)}`);
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }

            if (response.status === 429) { // Handle rate limiting
                const retryAfter = response.headers.get('Retry-After');
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoff * Math.pow(2, i); // Exponential backoff
                console.warn(`Rate limited. Retrying after ${waitTime} ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                const errorText = await response.text();
                console.error(`Request failed with status ${response.status}: ${errorText}`);
                throw new Error(`Request failed: ${response.statusText}`);
            }
        } catch (error) {
            if (i === retries - 1) {
                console.error("Max retries reached:", error);
                throw new Error("Request failed after maximum retries");
            }
            console.warn(`Attempt ${i + 1} failed with error: ${error.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i))); // Exponential backoff
        }
    }

    throw new Error('Max retries reached. Request failed.');
}




export async function getFileList() {
    const token = "l7732afe52058348f4b4dc2f28e79905fd";
    const accountNumber = '202992748';

    const response = await fetchWithRetry('https://api.fedex.com/bill/v1/reports/retrieve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Cookie': cookie,
            'X-client-transaction-id': '3135346e-a855-c125-66b5-99192e54e8af',
            'X-clientid': 'CBS'
        },
        body: JSON.stringify({
            "accountNumber": accountNumber
        })
    });
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text(); // For XML or plain text error responses
    }   

    if (!response.ok) { 
        throw new Error('Failed to get FedEx file list: ' + response.statusText + ' (' + response.status + ')' + ' Info: ' + JSON.stringify(data));
    }

    // Check if 'output' exists in the response
    // console.log("DATA: ", data);
    if (!data.reportDetails || data.reportDetails.length === 0) {
        // console.log("TnT: ", fedex_tnt + " - Data:" + JSON.stringify(data));
        return 0;
    }else{
        let file_list = [];
        for (let i = 0; i < data.reportDetails.length; i++) {
            file_list.push(data.reportDetails[i].reportId);
        }
        return file_list;
        
    }
}

export async function getFile(FILE_ID) {
    const token = "l7732afe52058348f4b4dc2f28e79905fd";
    const accountNumber = '202992748';

    const response = await fetchWithRetry('https://www.fedex.com/bill/v1/documents/reports/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Cookie': cookie,
            'X-client-transaction-id': '3135346e-a855-c125-66b5-99192e54e8af',
            'X-clientid': 'CBS'
        },
        body: JSON.stringify({
            "accountNumber": accountNumber,
            "documentId": FILE_ID
        })
    });
    const DATA = await response.text();

    if (!response.ok) { 
        throw new Error('Failed to get FedEx file list: ' + response.statusText + ' (' + response.status + ')' + ' Info: ' + JSON.stringify(data));
    }
    return DATA;

}


                    
