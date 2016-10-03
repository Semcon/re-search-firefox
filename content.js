function outputText( text ){
    console.log( text );
    var para = document.createElement("P");
    var t = document.createTextNode( text );
    para.appendChild(t);
    document.body.appendChild(para);
}

function getSearchTerm(){
  let element = document.querySelectorAll('.gsfi')[0];

  if( element.value.length > 0 ){
      outputText( element.value );
  }

  element.addEventListener( 'input', function( event ){
      outputText( event.target.value );
  });
}

if( document.readyState === 'complete' ){
    getSearchTerm();
}
