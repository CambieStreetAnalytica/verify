chrome.tabs.getSelected(null,function(tab) {
  const Http = new XMLHttpRequest();
  console.log(tab.url);
  const url='https://declanh2.api.stdlib.com/verify3@dev/' + '?url=' + encodeURIComponent(tab.url);
  chrome.storage.sync.get(url, (value) => {
    if (url in value && value[url]['bias'] != "NULL" && value[url]['bias'] != "Unknown") {
      propagateData(value[url]['text'], value[url]['bias'], value[url]['sentiment']);
      console.log("fetched locally");
    } else {
      Http.open("GET", url);
      Http.send();
    }
  });

  Http.onreadystatechange = (e) => {
    if (Boolean(Http.response)) {
      let res = JSON.parse(Http.response || {});
      console.log(res);
      let text = res['text'];
      let bias = res['bias'];
      let sentiment = res['sentiment'];
      storeData(text, bias, sentiment, url);
      propagateData(text, bias, sentiment, status=200);
      console.log("fetched remotely");
    }
  }
});

function propagateData(text, bias, sentiment, status=200) {
  //console.log(text, bias, sentiment);
  let insertBias = document.getElementById("insertBias");
  let spinner = document.getElementById("spinner");
  let analyzing = document.getElementById("analyzing");
  insertSummary.classList.add('insertedSummary');
  if (status == 200) {
    insertSummary.innerHTML = text != "NULL" ? text : "Summary Unavailable";
    insertBias.innerHTML = bias != "NULL" ? bias : "Unavailable";
  } else {
    insertSummary.innerHTML = "Unavailable";
    insertBias.innerHTML = "Summary Unavailable"
  }
  displaySentiment(sentiment);
  analyzing.innerHTML = "Analyzed Page";
  spinner.classList.add("none");
}

function storeData(text, bias, sentiment, url) {
  chrome.storage.sync.set({[url]: {'bias': bias, 'text': text, 'sentiment': sentiment }}, ()=>{});
}

function displaySentiment(sentiment) {
  let score = sentiment['score'];
  let magnitude = sentiment['magnitude'];
  console.log(score, magnitude);
  let insertSentiment = document.getElementById('insertSentiment');
  console.log(insertSentiment);
  if (magnitude >= .1) {
    if (score >= .5) {
      // positive
      insertSentiment.innerHTML = "Positive";
    } else if (score <= -.5) {
      // negative
      insertSentiment.innerHTML = "Negative";
    } else {
      // mixed/neutral
      insertSentiment.innerHTML = "Mixed/Neutral";
    }
  } else {
    // mixed/neutral
    insertSentiment.innerHTML = "Mixed/Neutral";
  }
  console.log(insertSentiment.innerHTML);
}

