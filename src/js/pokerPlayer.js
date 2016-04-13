function player(whichPlayer){
  this.cards = [];
  this.spot = whichPlayer;
  this.state = -2;
  this.prevState = -3;
  this.updateFunction = this.renderVisuals;
  this.betThisRound = 0;  //how much player has put in the pot total this betting round
  this.currentBet = 0;  //how much the player wants to put in the pot right now
    
  //defined later
  this.userId = null;
  this.money = 0; 
  this.hand = {};
  this.chipStack = {};
  this.joinButton;
}

player.prototype.myCardsFriendly = function(){
	var retArray = [];
	for(var i=0; i<this.cards.length; i++){
		retArray.push(numArray[this.cards[i].number]+" of "+this.cards[i].suit);
	} 
	return retArray;
} 

player.prototype.renderVisuals = function(timeSince){
  if(this.prevState !== this.state){ 
    console.group('player'+this.spot+' moved from ', this.prevState, this.state); 

    //state init
    switch(this.state){
      case -2:
        
        this.hand = new THREE.Object3D();
        
        var hideButton = this.createHideButton(); 
        hideButton.position.z = 50;
        this.hand.add(hideButton);
         
        this.chipStack = new THREE.Object3D();
        this.hand.add(this.chipStack);
        this.bettingui = new bettingUI(this);
        //this.bettingui.mesh.rotation.y = -Math.PI/8;  
        this.bettingui.mesh.rotation.x = -Math.PI/2 + Math.PI/4;

        this.hand.add(this.bettingui.mesh);
            
        //this.renderChips();  
        
        arrangeHand(this.hand, this.spot);
        sim.scene.add(this.hand);
         if(typeof this.joinButton === "undefined"){
          this.joinButton = new makeJoinButton(this.spot);
          sim.scene.add(this.joinButton.mesh);
        }else{
          this.joinButton.mesh.visible = true;
        }
        this.state = -1;
        this.renderVisuals(0);
        break;
      case -1:
        //no one playing
        if(this.money === 0){
            this.money = startingMoney;  
        }
            
        toggleVisible(this.bettingui.mesh, false);    
        
            
        break;
      case 0:
        //someone playing, they haven't started yet
        //make buttons and UI
         
        this.joinButton.mesh.visible = false;
        this.renderChips();
            
            
        var numPlayers = 0;
        for(var i=0; i<theGame.players.length; i++){
          if(theGame.players[i].state != -1){
            numPlayers++;  
          }
        }
        
        if(numPlayers === 1){ //first player 
          this.startGame = new makeStartGameButton(this);
          this.hand.add(this.startGame.mesh);
          this.startGame.mesh.position.z = 10;
          this.startGame.mesh.position.y -= 125;
          this.startGame.mesh.position.x = -50;  
          this.startGame.mesh.rotation.y = Math.PI/8;  
          theGame.startGameButton = this.startGame.mesh;
          if(this.userId !== globalUserId){
              theGame.startGameButton.visible = false;
          }
        } 
        
        break;  
      case 1:
        //give cards to player
        if(this.startGame){
          this.startGame.mesh.visible = false;
        }
        var offset = 0;
        for(var i=0; i<this.cards.length; i++){
            
          //if this is the correct player, get correct card
          this.cards[i] = theGame.deck.getCard(this.cards[i], false, globalUserId === this.userId);
          //otherwise, get a black card
          this.cards[i].geom.position.y += offset;
          giveCard(this.cards, this.hand, i);
          window.setTimeout((function(that, index){
            return function(){ 
              //move card to hand
              toggleCard(that.cards[index], true);
              if(that.state === 1){   //only do this if our state hasn't been changed by an update
                that.state = 2;
              }
            }
          })(this, i), 4000);
          offset+=0.1;
        }
        this.state = 2;

        break;
      case 2: 
        //waiting 
        toggleVisible(this.bettingui.mesh, false);
        //move the cube to someone else 
        
        break;
      case 3:
        //this players turn to bet
        //put the bet cube over this player
        toggleVisible(this.bettingui.mesh, true);
        toggleVisible(theGame.betCube, true);
            
        //make sure we have enough money
        this.currentBet = theGame.currentBet - this.betThisRound;
        this.bettingui.updateBet(this.currentBet);
            
            
        //theGame.betCube.visible = true;
        theGame.betCube.position.copy(this.hand.position);
        break;
      case 4:
        //folded, out for this round 
        toggleVisible(this.bettingui.mesh, false);

        break;
    }
    //console.log(getSafeGameObj());
    //theGame.syncInstance.update(getSafeGameObj());     //going to move this to the actual player functions, so we can be more specific about when we send things and don't send crap data.
    
    console.groupEnd();
    this.prevState = this.state;
  }

  //state update
  for(var i=0; i<this.cards.length; i++){
    if(this.cards[i].movementTween){
          //this.cards[i].geom.updateBehaviors(timeSince); 
    }

  }
}


player.prototype.chipColors = {
  "white": 1,
   "red": 5,
  "blue": 10,
  "green": 25,
  "black": 100
}

player.prototype.win = function(amount, hand){
  toggleVisible(theGame.winCube, true);
  theGame.winCube.position.copy(this.hand.position);
  theGame.bettingPot -= amount;
  this.money+= amount;
  makePot();
  this.renderChips();
  //this.moveChipsFrom(amount, this.chipStack);  
}

/*

  white - 1
  red - 5
  blue - 10
  green - 25
  black - 100

*/

 


player.prototype.createHideButton = function(){
	var geometry = new THREE.CubeGeometry(1, 1, 1);
	var material = new THREE.MeshBasicMaterial({color:'#ff0000'});
	var cube = new THREE.Mesh(geometry, material);
  cube.scale.set(25, 25, 25);
  cube.position.copy(tableOffset);
  cube.addBehaviors(toggleCardsBehavior(this));
  sim.scene.add(cube); 
  return cube;
}


player.prototype.renderChips = function(){
  renderChips(this.chipStack, this.money);
  this.chipStack.position.copy(tableOffset);
}

function renderChips(parent, amount){
  for( var i = parent.children.length - 1; i >= 0; i--) { 
    parent.remove(parent.children[i]);
  }
  var chipStack = makeChipStack(amount); 
  parent.add(chipStack);
}

player.prototype.moveChipsFrom = function(amount, where){
  //where is a Vector3
  var trackingVector = new THREE.Vector3();
  trackingVector.setFromMatrixPosition(theGame.potHolder.matrixWorld);
  //trackingVector.y = tableOffset.y;
  
  var toVector = new THREE.Vector3();
  toVector.setFromMatrixPosition(where.matrixWorld);
  
  var theseChips = makeChipStack(amount);
  sim.scene.add(theseChips);
  theseChips.position.copy(trackingVector);
  
            var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
            toHolderTween.onUpdate((function(chips){
              return function(value1){  
                chips.position.copy(trackingVector);
              }
            }(theseChips))); 
            
            
            toHolderTween.onComplete((function(movingChips, player){
              return function(value1){
                
                //delete the moving chips, update the world chip pot
                sim.scene.remove(movingChips);
                player.renderChips();
                
              }
            }(theseChips, this)));
          toHolderTween.start(); 
  renderChips(theGame.potHolder, 0);
}


//disabling chip animation for now until it's consistent
player.prototype.moveChipsTo = function(amount, where){
  //where is a Vector3
  var trackingVector = new THREE.Vector3();
  trackingVector.setFromMatrixPosition(this.chipStack.matrixWorld);
  trackingVector.y = tableOffset.y;
  
  var toVector = new THREE.Vector3();
  toVector.setFromMatrixPosition(where.matrixWorld);
  
  
  var theseChips = makeChipStack(amount);
  sim.scene.add(theseChips);
  theseChips.position.copy(trackingVector);  
  
            var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
            toHolderTween.onUpdate((function(chips){
              return function(value1){ 
                  //move the cards to the player 
                chips.position.copy(trackingVector);
              }
            }(theseChips)));
            
            
            toHolderTween.onComplete((function(movingChips){ 
              return function(value1){
                
                //delete the moving chips, update the world chip pot
                sim.scene.remove(movingChips);
                makePot();
                
              }
            }(theseChips)));
          toHolderTween.start();
}

player.prototype.bet = function(amount){
  this.money -= amount;
  theGame.bettingPot += amount;
  this.betThisRound += amount;
  theGame.currentBet = this.betThisRound;
  //this.moveChipsTo(amount, theGame.potHolder);
  this.renderChips();
    makePot();
    theGame.nextBet();
}

player.prototype.betUpdate = function(amount){
    sendUpdate({i:theGame.players.indexOf(this), amount: amount}, "playerBet");
    
    
    this.bet(amount);
}

player.prototype.fold = function(){ 
  //theGame.bettingOrder.splice(theGame.better, 1);
  
  for(var i=0; i<this.cards.length; i++){ 
      console.log(this.cards[i]);
      if(this.cards[i].geom.parent.type === "Object3D"){
        THREE.SceneUtils.detach(this.cards[i].geom, this.hand, sim.scene);
        cardToDeck(this.cards[i]);
      }
  } 
  this.cards = [];
  this.state = 4;
  theGame.nextBet();
  
}

player.prototype.foldUpdate = function(){
    sendUpdate({i:theGame.players.indexOf(this)}, "playerFold");
    
    
    
    this.fold();
}