chrome.tabs.getSelected(null,function(tab) {
  const Http = new XMLHttpRequest();
  console.log(tab.url);
  const url='https://declanh.api.stdlib.com/verify2@dev/' + '?url=' + tab.url;
  Http.open("GET", url);
  Http.send();

  Http.onreadystatechange = (e) => {
    let res = JSON.parse(Http.response);
    let insertSummary = document.getElementById("insertSummary")
    let insertBias = document.getElementById("insertBias");
    let spinner = document.getElementById("spinner");
    let analyzing = document.getElementById("analyzing");
    insertSummary.classList.add('insertedSummary');
    insertSummary.innerHTML = res['text'];
    insertBias.innerHTML = res['bias'];
    analyzing.innerHTML = "Analyzed Page";
    spinner.classList.add("none");
  }
});

