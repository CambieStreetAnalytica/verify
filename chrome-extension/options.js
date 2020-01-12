
      document.getElementById("clearStorage").onclick = function() {
        chrome.storage.sync.clear(()=>{
          console.log("Cache Cleared")
          document.getElementById("clearText").innerHTML = "Storage Cleared";
        });
      };