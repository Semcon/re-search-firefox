var runState;
var runInit = true;
var elements;
//var tabs = require('sdk/tabs');

function sendText( text ){
  if(runState === 'enabled' && typeof text !== 'undefined'){
    console.log( 'Sending', text );
    chrome.runtime.sendMessage( text, function(response) {
      if(response){
        console.log(response.status);
      }
    });
  }
}

function getSearchTerm(selector){
 console.log('Selector: ', selector);
 elements = document.querySelectorAll(selector);
 if( elements.length === 0 ){
   setTimeout( init, 100 );
   return false;
 }
 var element = elements[ 0 ];

 if( element.value.length > 0 ){
    sendText( element.value );
 }
/*  element.addEventListener( 'input', function( event ){
    sendText( event.target.value );
 });*/

 element.addEventListener("keyup", function(event) {
     console.log('went in to eventlistener');
     event.preventDefault();
     if (event.keyCode == 13) {
         alert('it works!');
     }
 });

 document.querySelectorAll('.lsb')[0].addEventListener('click', function (e) {
     console.log('went into function');
     sendText(element.value);
     var key = e.which || e.keyCode;
     if (key === 13) { // 13 is enter
       alert('enter or search button was pressed');
     }
 });
}

function init(){
  console.log('In init');
  chrome.runtime.sendMessage({selector: "selector", url: window.location.href}, function(response) {
    if(response.selector !== false){
      getSearchTerm(response.selector);
    }
    else{
      console.log('Selector not found');
    }
  });
}


//first time content script runs
if( document.readyState === 'complete' ){
  console.log('document is complete');
  console.log('Run init: ', runInit);
  chrome.runtime.sendMessage({runState: "?"}, function(response) {
    runState = response.runState;
    console.log('runState in contentscript: ', runState);

    if(runState === 'enabled' && runInit === true){
      console.log('runstate = enabled and runInit = true');
      init();
      runInit = false;
    }
    else if(runState === 'disabled'){
      console.log('runState DISABLED');
    }
  });
}





chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.runState === 'disabled'){
      runState = request.runState;
      console.log('runstate: ', runState);
      sendResponse({message: 'received disabled'});
    }
    else if(request.runState === 'enabled'){
      runState = request.runState;
      console.log('runstate: ', runState);

      if( document.readyState === 'complete' ){
          console.log('document is complete');
          if(runInit === true){
              init();
              runInit = false;
          }
      }
      sendResponse({message: 'received enabled'});
    }
    else{
      console.log('Message from event page was not handled');
    }
    return true;
});
