// Author: Sara Amani, Oskar Risberg, Basim Ali
// Copyright (c) 2016, Semcon Sweden AB
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,  this list of conditions and
//    the following disclaimer in the documentation and/or other materials provided with the distribution.
// 3. Neither the name of the Semcon Sweden AB nor the names of its contributors may be used to endorse or
//    promote products derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var showBar = true;

var latestTerm = false;
var dropdownTerms = [];

var currentTerms;
var currentURL;
var jsonData;
var alternateWindow = false;
var alternateTabId = false;
var originWindow = false;
var originTabId = false;

var DATA_URL = 'https://raw.githubusercontent.com/Semcon/re-search-config/master/data.json';
var TIP_URL = 'http://semcon.com/re-search-tip/';
var TERM_UPDATE_INTERVAL = 3600000;

//First time running script to check what value showBar is in storage.
showBar = localStorage.getItem("showBar");
if (showBar === null) {
      localStorage.setItem('showBar', true)
      showBar = true;
}

chrome.windows.onRemoved.addListener( function( windowId ) {
    var updateProperties = {
        focused: originWindow.focused
    };

    if( originWindow.state === 'minimized' || originWindow.state === 'maximized' || originWindow.state === 'fullscreen' ){
        updateProperties.state = originWindow.state;
    } else {
        updateProperties = {
            left: parseInt( originWindow.left, 10 ),
            top: parseInt( originWindow.top, 10 ),
            width: parseInt( originWindow.width, 10 ),
            height: parseInt( originWindow.height, 10 )
        }

        if( !supportsLessThanZero() ){
            updateProperties.left = Math.max( 0, updateProperties.left );
            updateProperties.top = Math.max( 0, updateProperties.top );
        }
    }

    if ( windowId === alternateWindow.id ) {
        chrome.windows.update( originWindow.id, updateProperties );

        alternateWindow = false;
    } else if ( windowId === originWindow.id && alternateWindow.id ){
        chrome.windows.update( alternateWindow.id, updateProperties );

        alternateWindow = false;
    }
});

chrome.tabs.onRemoved.addListener( function( tabId ){
    if( tabId === originTabId ){
        originTabId = false;
    }

    if( tabId === alternateTabId){
        alternateTabId = false;
    }
});

function loadTerms(){
    var xhr = new XMLHttpRequest();
    var tempTerms;

    xhr.open( 'GET', DATA_URL, true );
    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 && xhr.status === 200 ) {
            tempTerms = JSON.parse( xhr.responseText );

            if( tempTerms ){
                jsonData = tempTerms;
            }
        }
    }

    xhr.send();
}

loadTerms();
setInterval( loadTerms, TERM_UPDATE_INTERVAL );

function supportsLessThanZero(){
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1279562
    var verisonLowerThan50 = ( /Firefox\/4/ ).test( navigator.userAgent );

    if( verisonLowerThan50 ){
        return false;
    }

    return true;
}

function sendTip(){
    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', TIP_URL, true );
    xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 && xhr.status === 200 ) {
            console.log( 'Tip sent' );
        }
    }

    xhr.send( 'term=' + encodeURIComponent( latestTerm ).replace( /%20/g, '+' ) );
}

function showWindows( term, newTerm, windowOriginId ){
    if( typeof currentURL === 'undefined' ){
        return false;
    }

    var link = currentURL + newTerm;
    var originLink = currentURL + term;

    if( alternateWindow === false ){
        chrome.windows.getCurrent( {}, function( window ){
            originWindow = window;

            chrome.tabs.query( {
                active: true,
                windowId: originWindow.id
            }, function(tabs) {
                originTabId = tabs[0].id;
            });

            chrome.windows.create( {
                state: 'normal',
                type: 'normal',
                url: link
            }, function( createdWindowData ) {
                alternateWindow = createdWindowData;
                var newWindowProperties = {
                    height: parseInt( window.height, 10 ),
                    left: parseInt( window.left + ( window.width / 2 ), 10 ),
                    top: parseInt( window.top, 10 ),
                    width: parseInt( window.width / 2, 10 )
                };

                if( !supportsLessThanZero() ){
                    newWindowProperties.left = Math.max( 0, newWindowProperties.left );
                    newWindowProperties.top = Math.max( 0, newWindowProperties.top );
                }

                chrome.windows.update( alternateWindow.id, newWindowProperties );

                chrome.tabs.query( {
                    active: true,
                    windowId: alternateWindow.id
                }, function(tabs) {
                    alternateTabId = tabs[0].id;
                });
            });

            var currentWindowUpdatedProperties = {
                state: 'normal',
                left: parseInt( window.left, 10 ),
                height: parseInt( window.height, 10 ),
                top: parseInt( window.top, 10 ),
                width: parseInt( window.width / 2, 10 )
            };

            if( !supportsLessThanZero() ){
                currentWindowUpdatedProperties.left = Math.max( 0, currentWindowUpdatedProperties.left );
                currentWindowUpdatedProperties.top = Math.max( 0, currentWindowUpdatedProperties.top );
            }

            chrome.windows.update( window.id, currentWindowUpdatedProperties );
        });
    } else {
        if( windowOriginId === alternateWindow.id ){
            if( originTabId ){
                chrome.tabs.update( originTabId, {
                    active: true,
                    url: originLink
                });
            } else {
                chrome.tabs.create( {
                    active: true,
                    url: originLink,
                    windowId: originWindow.id
                }, function (tab) {
                    originTabId = tab.id;
                } );
            }
        }

        if( alternateTabId === false ){
            chrome.tabs.create( {
                active: true,
                url: link,
                windowId: alternateWindow.id
            }, function (tab){
                alternateTabId = tab.id;

            } );
        } else {
            chrome.tabs.update( alternateTabId, {
                url: link,
                active: true
            });
        }
    }
}

function runToolbarScript(){
    if( !currentURL ){
        return false;
    }

    if( originTabId ){
        chrome.tabs.insertCSS( originTabId, {
            file: '/toolbar/toolbar.css'
        }, function(){
            chrome.tabs.executeScript( originTabId, {
                file: '/toolbar/toolbar.js'
            });
        });
    }

    if( alternateTabId ){
        chrome.tabs.insertCSS( alternateTabId, {
            file: '/toolbar/toolbar.css'
        }, function(){
            chrome.tabs.executeScript( alternateTabId, {
                file: '/toolbar/toolbar.js'
            });
        });
    }

    if( !originTabId && !alternateTabId ){
        chrome.tabs.insertCSS({
            file: '/toolbar/toolbar.css'
        }, function(){
            chrome.tabs.executeScript({
                file: '/toolbar/toolbar.js'
            });
        });
    }
}

function hasBetterTerm( term ){
    var lowercaseTerms;

    if( typeof currentTerms === 'undefined' ){
        return false;
    }

    term = term.toLowerCase();

    lowercaseTerms = Object.keys( currentTerms ).map( function( string ){
        return string.toLowerCase();
    });

    if( lowercaseTerms.indexOf( term ) > -1 ){
        return currentTerms[ Object.keys( currentTerms )[ lowercaseTerms.indexOf( term ) ] ];
    }

    return false;
}

function getEngine( url ){
    if( typeof jsonData === 'undefined' ) {
        return false;
    }

    if( typeof url === 'undefined' ){
        return false;
    }

    for( var i = 0; i < jsonData.engines.length; i = i + 1 ){
        var matchCount = 0;

        // Loop over all required matches for the engine
        for( var matchIndex = 0; matchIndex < jsonData.engines[ i ].match.length; matchIndex = matchIndex + 1 ){
            if( url.indexOf( jsonData.engines[ i ].match[ matchIndex ] ) > -1 ){
                // We have a match, increment our counter
                matchCount = matchCount + 1;
            }
        }

        // If we have the same number of matches as required matches we have a valid site
        if( matchCount === jsonData.engines[ i ].match.length ){
            return jsonData.engines[ i ];
        }
    }

    return false;
}

function isValidUrl( url ){
    if( !getEngine( url ) ){
        return false;
    }

    return true;
}

function getEngineInformation( sender, sendResponse ){
    var currentEngine = getEngine( sender.url );

    if( !currentEngine ){
        sendResponse({
            selectorSearchField: false
        });

        return false;
    }

    currentTerms = {};
    dropdownTerms = [];
    for ( var key in jsonData.terms[ currentEngine.terms ] ){
        currentTerms[ key ] = jsonData.terms[ currentEngine.terms ][ key ].updated;

        if( jsonData.terms[ currentEngine.terms ][ key ].dropdown ){
            dropdownTerms.push( key );
        }
    }

    currentURL = currentEngine.url;

    runToolbarScript();

    sendResponse({
        selectorSearchField: currentEngine.selectors.input
    });

    return true;
}

chrome.runtime.onMessage.addListener(
    function( request, sender, sendResponse ) {
        var queryOptions = {};
        var betterTerm = false;

        switch( request.action ){
            case 'getEngineInformation':
                getEngineInformation( sender, sendResponse );

                break;
            case 'getDropdownTerms':
                sendResponse({
                    dropdownTerms: dropdownTerms
                });

                break;
            case 'isValidUrl':
                if( isValidUrl( sender.url ) ){
                    sendResponse({
                        valid: true
                    });
                } else {
                    sendResponse({
                        valid: false
                    });
                }

                break;
            case 'searchForTerm':
                latestTerm = request.term;
                betterTerm = hasBetterTerm( request.term );

                if( betterTerm ){
                    showWindows( request.term, betterTerm, sender.tab.windowId );
                }

                break;
            case 'updateTabURL':
                queryOptions.active = true;

                if( alternateWindow !== false ){
                    queryOptions.windowId = originWindow.id
                }

                if( typeof currentURL !== 'undefined' ){
                    var newURL = currentURL + request.term;
                    if( originTabId ){
                        chrome.tabs.update( originTabId, {
                            active: true,
                            url: newURL
                        });
                    } else if( alternateWindow === false ){
                        chrome.tabs.update( sender.tab.id, {
                            active: true,
                            url: newURL
                        });
                    } else {
                        queryOptions.url = newURL;
                        chrome.tabs.create(
                            queryOptions,
                            function ( tab ) {
                                originTabId = tab.id;
                            }
                        );
                    }
                }

                break;
            case 'getLatestTerm':
                chrome.tabs.sendMessage( sender.tab.id, { action: 'getTerm' }, function( response ){
                    sendResponse({
                        latestTerm: response
                    });
                });

                break;
            case 'sendTip':
                sendTip();

                break;
            case 'getToolbarStatus':
                sendResponse({
                    showBar: showBar
                });

                break;
            case 'enableToolbar':
                showBar = true;

                localStorage.setItem( 'showBar', showBar );
                runToolbarScript();

                break;
            case 'disableToolbar':
                showBar = false;

                localStorage.setItem( 'showBar', showBar );
                runToolbarScript();

                break;
            default:
                console.log( 'Message to event page was not handled: ', request );
        }

        return true;
    }
);
