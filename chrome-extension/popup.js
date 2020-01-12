chrome.tabs.getSelected(null,function(tab) {
  const Http = new XMLHttpRequest();
  console.log(tab.url);
  const url='https://declanh.api.stdlib.com/verify2@dev/' + '?url=' + tab.url;
  chrome.storage.sync.get(url, (value) => {
    if (url in value && value[url]['bias'] != "NULL" && value[url][bias] != "Unknown") {
      propagateData(value[url]['text'], value[url]['bias'], url);
      console.log("fetched locally");
    } else {
      Http.open("GET", url);
      Http.send();
    }
  });

  Http.onreadystatechange = (e) => {
    let res = JSON.parse(Http.response);
    propagateData(res['text'], res['bias'], url, status=200);
    console.log("fetched remotely");
  }
});

function propagateData(text, bias, url, status=200) {
  chrome.storage.sync.set({[url]: {'bias': bias, 'text': text}}, ()=>{})
  let insertSummary = document.getElementById("insertSummary")
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
  analyzing.innerHTML = "Analyzed Page";
  spinner.classList.add("none");
}

