function getSafeGameObj(extradata){
  var thisGame = Object.assign({}, theGame);
    thisGame = Object.assign(thisGame, extradata);
    thisGame.players = null;
  thisGame.players = [];
   for(var i=0; i<theGame.players.length; i++){
     if(theGame.players[i].prevState > theGame.players[i].state){
         thisGame.players[i] = getSafePlayer(theGame.players[i], true);
    }else{
         thisGame.players[i] = getSafePlayer(theGame.players[i]);
    }
  }
  
  if(globalPlayerIndex != -1){
    thisGame.playerUpdate = getSafePlayer(theGame.players[globalPlayerIndex]);
  }
  thisGame.judge = null;
  thisGame.syncInstance = null;
  thisGame.betCube = null;
  thisGame.potHolder = null;
  thisGame.logic = null;
  thisGame.startGameButton = null;
  thisGame.winCube = null; 
  thisGame.dealingOrder = null; 
  //thisGame.deck.perfectDeck = null; 
  thisGame.sharedCards = {cards:getSafeCards(theGame.sharedCards)};
  if(theGame.deck instanceof deck){
    thisGame.shuffledDeck = {cards:getSafeCards({cards: theGame.deck.shuffledDeck})};
  }
  thisGame.deck = null; 

  console.log(thisGame);
  return JSON.parse(JSON.stringify(thisGame));  
}

function getSafePlayer(thePlayer, important){
    var player = Object.assign({}, thePlayer);
    player.joinButton = null;
    player.bettingui = null;
    player.chipStack = null;
    player.joinButton = null; 
    player.hand = null;
    player.startGame = null;
    player.prevState = null;
    if(important){
      player.importantUpdate = true;
    } 
    player.updateFunction = null;
    player.cards = getSafeCards(thePlayer);

  return player;
}

function getSafeCards(player){ 
  var cards = [];
  if(player.cards.length === 0){
    return player.cards;  
  }
  
  for(var i=0; i<player.cards.length; i++){
    var card = Object.assign({}, player.cards[i]);
    card.geom = null;
    card.movementTween = null; 
    card.image = null;
    cards[i] = card;
  }
  
  return cards;
  
} 



function processUpdates(newUpdates){
    console.log('processing', newUpdates)
    altspace.getUser().then(function(result){
    console.log("apply these updates", newUpdates);
    var updateType, data;
        
    //remove any updates from newupdates that already exist in theGame.roundRecord
        
    /*newUpdates = newUpdates.filter(function(element){
        for(var i=0; i<theGame.roundRecord.length; i++){
            if(element.timestamp === theGame.roundRecord[i].timestamp){
                return false;
            }
        }
        return true;
        
    })*/
        
    for(var x=0; x<newUpdates.length; x++){
        updateType = newUpdates[x].title;
        data = newUpdates[x].data;
        console.log("processing update", newUpdates[x]);
        switch(updateType){
            case "startedLevel":
                
                break;
            case "registerPlayer":
                
                theGame.players[data.registerIndex].userId = data.userId;
                theGame.players[data.registerIndex].state = 0;
                theGame.players[data.registerIndex].renderVisuals(0);
                break;
            case "dealingCards":
                
		            globalUserId = result.userId;
                    for(var i=0; i<data.player.cards.length; i++){
                        theGame.players[data.index].cards[i] = theGame.deck.getCard(data.player.cards[i], false, theGame.players[data.index].userId === globalUserId);
                    }
                    theGame.players[data.index].state = data.player.state;
                    theGame.players[data.index].renderVisuals(0);
                    
                //theGame.players[data.index]
                
                break;
            case "startHand":
                
                break;
            case "changeGameStep":
                console.log(data);
                theGame.setStep(data.toStep);
                break;
           /* case "waitingFor":
                //data.toPlayer
                break;*/
            case "playerBet":
                theGame.players[data.i].bet(data.amount);
                break;
            case "playerFold":
                theGame.players[data.i].fold();
                break;
            default:
                console.log("No action specified for update", updateType, data);
                break;
                
        }
        
        
        
    }
    
    Array.prototype.push.apply(theGame.roundRecord, newUpdates);
    });
    
}






var prevUpdate;

function onUpdateRecieved(newVal){
    var response = newVal.val(); 
    console.log(response);
   //if(prevUpdate === response.title){
     //discard this response, we've already seen it
    // return; 
   //}
      //var newGame = response.data;
      var oldState = theGame.step;
      var gameUpdate = false;  
      var playerUpdate = false;
      
      console.group("Recieved update '"+response.data.length+"'");
      if(theGame.roundRecord.length != response.data.length){
          processUpdates(response.data.slice(theGame.roundRecord.length, response.data.length));
      }else{
          console.log("got repeat update", response.data, theGame.roundRecord);
      }
      //if either a game update, a player update, or an 'important' flag is passed
      //we'll update everything 
     /* if(newGame.step > theGame.step){ 
        console.log('updating from', newGame.step, theGame.step);
        gameUpdate = true; 
      } 
      */
    
      //have to update the players first, so that the game doesn't 'double deal' 
       /* if(newGame.players && newGame.players.length){ 
          for(var i=0; i<newGame.players.length; i++){
          if(newGame.players[i].state > theGame.players[i].state){
            var oldState = theGame.players[i].state;
            
            console.log('recieved player update', newGame.players[i]);
            mergeDeep(theGame.players[i], newGame.players[i]);
            console.log('player is now', theGame.players[i]);
            theGame.players[i].state = oldState;
            while(newGame.players[i].state > theGame.players[i].state){    //if they come part way through, they need to catch up (and go through the init steps);
              oldState++;  
              console.log(oldState);
              theGame.players[i].state = oldState;
              if(oldState !== 3){
                theGame.players[i].renderVisuals(5000); 
              }
            }
            //theGame.players[i].renderVisuals(1); 
          }else if(newGame.players[i].importantUpdate === true){
            mergeDeep(theGame.players[i], newGame.players[i]);
            //theGame.players[i].renderVisuals(5000); 
          } 
          
          if(theGame.players[i].cards.length >0){ 
          console.groupCollapsed("Analyzing cards...");
          
          //make sure the cards all are associated with the right model
          for(var j=0; j<theGame.players[i].cards.length; j++){ 
            var thiscard = theGame.players[i].cards[j];
            
             theGame.players[i].cards[j] = theGame.deck.getCard(thiscard);
              console.log(theGame.players[i].cards[j]);
             console.log('ok!');
             
           }
          
           console.groupEnd(); 
         } 
       }
          
        
      }
      */ 
      /*
      if(typeof newGame.registerIndex !== 'undefined'){
          console.log('Recieved player registration!');
            console.log(newGame.playerUpdate);
          //TODO: Make sure we don't overwrite an existing player
          var i = newGame.registerIndex;
          theGame.players[i].state = 0;
          theGame.players[i].userId = newGame.playerUpdate.userId;
          
      }
      //delete newGame.players;
    
        //todo: only take deck modifications from the person that started the game
    
      var shuffledDeck = newGame.shuffledDeck.cards.slice();
      delete newGame.shuffledDeck;
      mergeDeep(theGame, newGame);
      theGame.deck.shuffledDeck = shuffledDeck;
      makePot(); 
      if(gameUpdate){  
          console.log('Recieved game update!', oldState, theGame.step); 
          
         
        //theGame.logic.steps[theGame.step].exec(theGame);
            
          
          //lot of crappy code to put the shared cards back up 
        
          for(var i=0; i<theGame.sharedCards.cards.length; i++){
               theGame.sharedCards.cards[i] = theGame.deck.getCard(theGame.sharedCards.cards[i], true);
                 
               var toPlayerTween = new TWEEN.Tween(theGame.sharedCards.cards[i].movementTween.position).to({x:(-100-(cardTemplate.width+5)*i), y: 0, z: (100+(cardTemplate.width+5)*i)}, 2000);
               toPlayerTween.onUpdate((function(card){
                    return function(value1){
                        //move the cards to the player
                      card.geom.position.copy(card.movementTween.position);
                    }
               }(theGame.sharedCards.cards[i])));
               toPlayerTween.start();
               
            } 
        theGame.runStep();
        
      }
      */
      console.groupEnd();
}


















function isCyclic (obj) {
  var seenObjects = [];

  function detect (obj) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.indexOf(obj) !== -1) {
        return true;
      }
      seenObjects.push(obj);
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && detect(obj[key])) {
          console.log(obj, 'cycle at ' + key);
          return true;
        }
      }
    }
    return false;
  }

  return detect(obj);
}

/**
 * Simple is object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return (item && typeof item === 'object' && item !== null);
}

/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
function mergeDeep(target, source) {   
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(function(key){
      if (isObject(source[key])) {
        if (!target[key]){
          var newObj = {};
          newObj[key] = {};
          Object.assign(target, newObj);
        }
        mergeDeep(target[key], source[key]);
      } else {
        var newObj = {};
        newObj[key] = source[key];
        Object.assign(target, newObj); 
      }
    }); 
  }
  return target; 
}







function sendUpdate(extraData, title){
  title = title || "";
  console.groupCollapsed("Sending update '"+ title + "'");
  theGame.roundRecord.push({title: title, timestamp: Date.now(), data: extraData})
 // prevUpdate = title; //this will prevent our client from processing this update
  console.log(extraData);
  theGame.syncInstance.update({title: title, data: theGame.roundRecord}); 
  console.groupEnd(); 
}