

var val ="";
var jsonTermsGoogle;
var jsonTermsBing;
var googleURL;
var bingURL;
var currentTerms;
var currentURL;
var jsonData;


console.log('background is running');

//First time running script to check what value runState is in chrome storage.
//If runState is undefined it is gets set to enabled otherwise it gets the value.

val = localStorage.getItem("runState");
console.log('val: ', val);
if(val === null){
  localStorage.setItem('runState', 'enabled')
  console.log('Saved', 'runState', 'enabled');
  val = 'enabled';
}


var xhr = new XMLHttpRequest();
xhr.open("GET", "https://api.myjson.com/bins/4we1m", true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    jsonData = JSON.parse(xhr.responseText);
  }
}
xhr.send();
 

function showWindows(request){
  if(typeof currentURL !== 'undefined' && typeof currentTerms !== 'undefined'){
    var link = currentURL + currentTerms[request];
    console.log('Link: ' , link);
    chrome.windows.getCurrent( {}, function( window ){
        console.log( window );
         saveWindowInfo(window);
         chrome.windows.create( {
          height: parseInt(window.height),
          left: parseInt(window.width / 2 + 8),
          state: 'normal',
          top: parseInt(0),
          type: 'normal',
          url: link,
          width: parseInt(window.width / 2 + 8)
        });

        chrome.windows.update( window.id, {
          height: parseInt(window.height),
          state: 'normal',
          width: parseInt(window.width / 2 + 8)
        });
    });
  }
  else{
    console.log('currentURL and/or currentTerms is undefined');
  }
}

function saveWindowInfo(window){
  //store old window size
  console.log("1");
      var mainWindowWidth                = window.width;
      var mainWindowHeight               = window.height;
      var windowID                       = window.id;
      var mainWindowDict                 = {};
      mainWindowDict["mainWindowHeight"] = mainWindowHeight;
      mainWindowDict["mainWindowWidth"]  = mainWindowWidth;
      mainWindowDict["windowID"]        = windowID;
      localStorage.setItem('mainWindowDict', JSON.stringify(mainWindowDict)); 
      console.log(localStorage.getItem("mainWindowDict"));
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //content script asks if extension is on/off
    if (request.runState === '?'){
     
      console.log(localStorage.getItem("runState"))
      var value = localStorage.getItem("runState")
      sendResponse({"runState": value})

    }

    //content script is asking for selector
    else if(request.selector === 'selector'){
      var url = request.url;
      // Loop over all engines
      if(typeof jsonData !== 'undefined' && typeof url !== 'undefined'){
        for( var i = 0; i < jsonData.engines.length; i = i + 1 ){
          var matchCount = 0;

          // Loop over all required matches for the engine
          for( var matchIndex = 0; matchIndex < jsonData.engines[ i ].match.length; matchIndex = matchIndex + 1 ){
            if( url.indexOf( jsonData.engines[ i ].match[ matchIndex ] ) > -1 ){
              // We have a match, increment our counter
              matchCount = matchCount + 1;
              console.log('found match, matchCount: ', matchCount);
            }
          }

          // If we have the same number of matches as required matches we have a valid site
          if( matchCount === jsonData.engines[ i ].match.length ){
            console.log( 'Valid site' );
            currentTerms = jsonData.engines[i].terms;
            currentURL = jsonData.engines[i].url;
            sendResponse({selector: jsonData.engines[i].selector});
            return true;
          }
        }
        console.log('If not valid site, Url:' , url);
        sendResponse({selector: false});
      }
    }

    //content script is sending terms
    else if(typeof currentTerms !== 'undefined' && currentTerms.hasOwnProperty(request)){
      console.log('term is found');
      sendResponse({status: 'term was found'});
      showWindows(request);
    }

    //From popup
    else if(request.runState === 'changeState'){
      console.log('ChangeState from popup / current value is: ' , val);
      if(val  === 'enabled'){
        localStorage.setItem('runState', 'disabled'); 
          console.log('Saved', 'runState', 'disabled');
          val = 'disabled';
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {runState: "disabled"}, function(response) {
              if(response){
                console.log(response.message);
              }
              else{
                console.log('Content script not injected');
              }
            });
          });
          sendResponse({runState: val});
        
      }
      else if(val === 'disabled'){
        localStorage.setItem('runState', 'enabled') 
          console.log('Saved', 'runState', 'enabled');
          val = 'enabled';
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {runState: "enabled"}, function(response) {
              if(response){
                console.log(response.message);
                console.log("Content script injected");
              }
              else{
                console.log('Content script not injected');
              }
            });
          });
          sendResponse({runState: val});
      }
    }
    else if(request.runState === 'getState'){       
      sendResponse({runState: val});     
      console.log('Message to event page was: ', request);
    }
    else{
      console.log('Message to event page was not handled: ', request);
    }
    return true;
});
