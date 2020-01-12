/**
* verify endpoint
*/
const deepai = require('deepai');
const language = require('@google-cloud/language');
module.exports = async (url = '', data = '') => {
  //http://declanh.api.stdlib.com/verify@dev/?url=hello&data=hi
  // test url: https://www.foxnews.com/politics/fbi-director-wray-deeply-regrets-fisa-court-errors-in-trump-russia-probe
  if (url === '') {
    return {"status": 400, "text": 'please provide a url'};
  }
  let articleArray = await getArticleText(url);
  let articleText = articleArray[0];
  let siteName = articleArray[1];
  let sentiment = await getSentiment(articleText);
  //return await biasTest(siteName);
  let bias = await getBias(siteName);
  let summary = await summarizeArticle(articleText);
  return {'status': 200, 'text': summary, 'bias': bias, 'sentiment': sentiment};
};

const getSentiment = async (text) => {
  const client = new language.LanguageServiceClient();
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };  
  const [result] = await client.analyzeSentiment({document: document});
  const sentiment = result.documentSentiment;
  return sentiment
};

const getArticleText = async (url = '', retry=false) => {
  if (url === '') {
    return 'NULL';
  }
  var outlineOptions = {
    host: 'api.diffbot.com',
    path: `/v3/article?token=${process.env.OUTLINE_KEY}&url=${url}`,
    method: 'GET'
  };
  let res = await makeHttpCall(outlineOptions);
  try {
    let siteName = res['objects'][0]['siteName'];
    text = res['objects'][0]['text'];
    text = text.replace(/(\r\n|\n|\r)/gm, "");
    text = text.replace(/(\\|\")/gi, '');
    return [text, siteName];
  } catch (e) {
    if (retry === true) {
      return ['NULL', url];
    }
    return await getArticleText(url, true);
  }
};

const getBias = async (url, retry=false) => {
  // https://mediabiasfactcheck.com/search/foxnews/feed/rss2
  url = url.split(" ").join("+");
  site = getSite(url);
  biasTopLevelOptions = {
    host: 'mediabiasfactcheck.com',
    path: `/search/${site}/feed/rss2`,
    method: 'GET'
  };
  let biasSearch = await fetchWebPage(biasTopLevelOptions);
  try {
    let bias = biasSearch.split("[CDATA[Media Bias Fact Check]]")[1].split("<description><![CDATA[<p>")[1];
    let len = 0;
    while (bias[len] === " " || bias[len] === "-" || bias[len].toUpperCase() === bias[len]) {
      len++;
    }
    bias = bias.substring(0, len > 1 ? len - 2 : len);
    bias = bias.toLowerCase();
    // bias = bias.split('bias')[0];
    bias = bias[0].toUpperCase() + bias.substring(1);
    return bias
  } catch (e) {
    if (retry === true) {
      return "Unknown";
    }
    return await getBias(url, true);
  }
}

const getSite = (url) => {
  url = url.split("https://").length > 1 ? url.split("https://")[1] : url;
  url = url.split("http://").length > 1 ? url.split("http://")[1] : url;
  url = url.split(".").length > 2 ? url.split(".")[1] : url.split(".")[0];
  return url;
}

const summarizeArticle = async (text, retry=false) => {
  if (text === null || text === undefined || text === '' || typeof text === 'object' || text.length < 200) {
    return "NULL";
  }
  deepai.setApiKey(`${process.env.SUMMARIZATION_KEY}`);
  let resp = await deepai.callStandardApi("summarization", {
    text: text,
  });
  try {
    return resp['output'].length > 0 ? resp['output'] : "NULL";
  } catch (e) {
    if (retry === true) {
      return "NULL";
    }
    return await summarizeArticle(text, true);
  }
}

const makeHttpCall = async (options, format) => {
	return new Promise((resolve) => {
		var req = https.request(options, res => {
			res.setEncoding('utf8');
			var returnData = "";
			res.on('data', chunk => {
			returnData = returnData + chunk;
			});
			res.on('end', () => {
			let results = JSON.parse(returnData);
			resolve(results);
			});
		});
		if (options.method == 'POST' || options.method == 'PATCH') {
			req.write(JSON.stringify(options.body));
		}
		req.end();
	})
};

const fetchWebPage = async (options, format) => {
	return new Promise((resolve) => {
		var req = https.request(options, res => {
			res.setEncoding('utf8');
			var returnData = "";
      res.once('readable', () => {
       res.on('data', (chunk) => { 
         returnData += chunk;
         resolve(returnData);
      });  
    })
	});
	req.end();
	})
};


// tests 
const articleTest = async (url) => {
  if (url === '') {
    return 'NULL';
  }
  var outlineOptions = {
    host: 'api.diffbot.com',
    path: `/v3/article?token=${process.env.OUTLINE_KEY}&url=${url}`,
    method: 'GET'
  };
  let res = await makeHttpCall(outlineOptions);
  return res;
}

const biasTest = async (url) => {
   url = url.split(" ").join("+");
  site = getSite(url);
  biasTopLevelOptions = {
    host: 'mediabiasfactcheck.com',
    path: `/search/${site}/feed/rss2`,
    method: 'GET'
  };
  let biasSearch = await fetchWebPage(biasTopLevelOptions);
  let bias = biasSearch.split("[CDATA[Media Bias Fact Check]]")[1].split("<description><![CDATA[<p>")[1];
  let len = 0;
  while (bias[len] === " " || bias[len] === "-" || bias[len].toUpperCase() === bias[len]) {
    len++;
  }
  return bias.substring(0, len > 1 ? len - 2 : len);
}