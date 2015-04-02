// $(document).ready(function() { 


// -------------------CARD CLASS --------------------------
var Card = function (suit, rank) {
  this.suit = suit;
  this.rank = rank;
  if (this.rank >= 10) {
    this.value = 10;
  }

  else(this.value = this.rank);
  
};

Card.SUITS = [
  Card.CLUBS    = 'Clubs',
  Card.DIAMONDS = 'Diamonds',
  Card.HEARTS   = 'Hearts',
  Card.SPADES   = 'Spades'
];

Card.prototype = {
  get face_card() {
    return this.rank > 10;
  },
  valueOf: function() {
    return this.rank;
  },
  toString: function() {
    var rank = {1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King'}[this.rank] || this.rank;
    return rank + ' of ' + this.suit;
  }
};

var Deck = function() {
  this.cards = [];
  for (var i = 0; i < Card.SUITS.length; i++) {   
    for (var rank = 1; rank <= 13; rank++) {
      this.cards.push(new Card(Card.SUITS[i], rank));
    }
  }
  this.shuffle();
};

// gameState = {currentTurn: 2, players:[{name: "dealer"} {name: "nick", faceUp: [instances], faceDown: [instances], }]}


// -------------------DECK CLASS ------------------------------


Deck.prototype = {
  count: function() {
    return this.cards.length;
  },
  draw: function(n) {
    return this.cards.splice(-n, n);
  },
  shuffle: function() {
    this.cards.sort(function() { return Math.random() - 0.5; });  
  },
};


// -------------------PLAYER CLASS ------------------------------

var Player = function(name){
    this.name = name;
    this.money = 100;
    this.hand = [];
    this.totalValue = 0;
    this.aceCounter = 0;
    this.bet = 10;
    this.status = "New PLayer";
};

 Player.prototype.totalhand = function(){ 
  this.totalValue = 0;
  // i need to make a new array to sort the cards in 
  var sortedArr = [];
  //make that new array equal to the hand array
  // by pushing every element into the sortedArr
  for (var i=0;i<this.hand.length;i++) {
    sortedArr.push(this.hand[i]);
  }
  //sort that new array(sortedArr) by the value of each card instance
  sortedArr.sort(function (a, b) {
    if (a.valueOf() > b.valueOf()) {
      return 1;
    }
    if (a.valueOf() < b.valueOf()) {
      return -1;
    }
    return 0;
  });
  //check to see if the first card is an ace (really, if there is an ace in the array)
  // make sure to check that this function hasn't been called before for this player

  if (sortedArr[0].valueOf() === 1 && this.aceCounter === 0) {

    //if it is, loop through the rest of the values and add them up.
    // set that equal to a newTotal;
    var newTotal = 0;

    for (var a=1;a<sortedArr.length; a++){

      newTotal += sortedArr[a].valueOf(); 
      // console.log("newTotal",newTotal);
    }
    
    // if the sum of the other values is less than 10, we want the ace 
    // equal to 11, not 1. so add 10 to the totalvalue
    if (newTotal < 10){
      this.totalValue += 10;
      this.aceCounter += 1;
    }
  }
   
   if (sortedArr.length === 2 && 
((sortedArr[0].valueOf() === 1 && sortedArr[1].valueOf() >= 10)||
(sortedArr[1].valueOf() === 1 && sortedArr[0].valueOf() >= 10)) && this.aceCounter === 0) {
      this.totalValue += 10;
      this.aceCounter += 1;
   }

  if (sortedArr.length === 2 && 
    ((sortedArr[0].valueOf() === 1 && sortedArr[1].valueOf() >= 10) || (sortedArr[1].valueOf() === 1 && sortedArr[0].valueOf() >= 10)) && this.aceCounter === 0) {
    this.totalValue += 10;
    this.aceCounter += 1;
}

  // console.log("this.totalValue",this.totalValue);
  // take all the cards, and add them up. 
    for(var j=0;j<this.hand.length;j++){
      this.totalValue += this.hand[j].value;
    }
    console.log("Total Value " + this.totalValue);
    return this.totalValue;


} ;


//------------- GAME CLASS -------------------------------------

var Game = function(players) {
    this.playersArray = [];
//     this.currentTurn = 
// push a player into the playersArray for each player in the
// array that is passed in when you create a new game
    for (var i=0;i<players.length;i++){
        this.playersArray.push(new Player(players[i]));
      }
    this.playersArray.push(new Player("Dealer"));
    this.currentDeck = new Deck();
    this.turn = 0;
};


Game.prototype.deal = function(index, cards){ 
    // this sets the current hand equal to the hand concatinated with the cards drawn
   return this.playersArray[index].hand = this.playersArray[index].hand.concat(this.currentDeck.draw(cards));
    this.playersArray[index].totalhand();

};
 

// -------------------CHECK FOR WINNER -----------------

Game.prototype.checkForWinner = function(index) {
  this.dealerStatus();
  // Instance of the Dealer
  var dealer = this.playersArray[this.playersArray.length-1]; 
  var player = this.playersArray[index];
    
    // Player busted  
    if (player.totalValue > 21) {
        player.bet = 0;
        console.log("Player Busted (90)");
    // Dealer Wins with BlackJack   
    } else if (dealer.blackjack() && !(player.blackjack())) {
      player.bet = 0;
      console.log("Delaer wins with BLACKJACK");
    // Player Win    
    } else if (player.totalValue > dealer.totalValue){
        if (player.blackjack()) {
          player.money += (player.bet * 2.5);  
          console.log("Player Wins with BLACKJACK (115)");
        } else {
          player.money += (player.bet * 2);  
          console.log("Player Wins (110)");
        } 
        player.bet = 0;
    // Dealer Busted - Player Win    
    } else if ((player.totalValue < dealer.totalValue) && (dealer.totalValue > 21)) {
      player.money += (player.bet * 2);
      player.bet = 0;  
      console.log("Player Wins - Dealer Busted (110)");
    // Dealer Win   
    } else if ((player.totalValue < dealer.totalValue) && (dealer.totalValue < 22)){
      player.bet = 0;
      console.log("Dealer Wins ");
    // Tie Game    
    } else if (player.totalValue === dealer.totalValue) {
      if (player.blackjack() && !dealer.blackjack()) {
        player.money += (player.bet * 2.5);  
        console.log("Player Wins with BJ and Dealer only 21");    
      } 
      player.totalValue += player.bet;  
      player.bet = 0;
      console.log("Tie Game");
    }
};

//-------------- DELAER STATUS -----------------------

Game.prototype.dealerStatus = function(){
  while (this.dealerUnder17()){
    if (!this.playersArray[this.playersArray.length -1].blackjack()){
      this.deal(this.playersArray.length-1,1); // Check for hit 
      console.log("card delt");
      
    }
  }
};


//-------------- SUPPORTIVE FUNCTIONS FOR CHECKFOR WINNER------------------



Player.prototype.busted = function(){
  var hand = this.totalhand();
  return hand > 21;
};

Player.prototype.blackjack = function(){
  return (this.hand[0].face_card && this.hand[1].rank === 1) || (this.hand[1].face_card && this.hand[0].rank === 1);
};

Player.prototype._21 = function() {
 return this.totalhand() === 21 && !this.blackjack();
};

Player.prototype.under21 = function() {
  return this.totalhand() < 21;
};

Game.prototype.dealerUnder17 =  function() {
  // console.log(this);
  // return this.playersArray[this.playersArray.length -1].totalhand() < 17;
  return this.playersArray[this.playersArray.length -1].totalValue < 17;
};

Game.prototype.dealerOver16 =  function() {
  var players = this.playersArray;
  var dealer = players[players.length -1];
  var x = dealer.totalValue;
  return ((21 > x) && (x > 16)); 
};

//-------------- SUPPORTIVE FUNCTIONS FOR THE GAME------------------

Game.prototype.initialDeal = function() {
  _this = this;
  this.playersArray.forEach(function(el, index){
     _this.deal(index,2);
  });
    
};


// -------------------TEST DECK  ------------------------------
var newArr = [];
Game.prototype.clearDeck = function(){
  for (var i=0; i<this.currentDeck.cards.length;i++){
    if ( 9 < this.currentDeck.cards[i].rank || this.currentDeck.cards[i].rank === 1){
    newArr.push(this.currentDeck.cards[i]);
    } 
  }
  // console.log(this.currentDeck.cards);
};

// -------------------START GAME  ------------------------------

exports.startGame = function(array){
  var g = new Game(array);
  return g;    
};

// -------------------JOIN GAME  ------------------------------


var roomPlayer = [], gameInProcess = false, queue = [];

Game.prototype.joinGame = function() {


  if ((session.name) || (roomPlayer.length > 0 && queue.length > 0)){
    if (!playerIntheRP()) {
      roomPlayer.unshift(session.name); 
    }
    if (g) {
        if (gameInProcess) {
          queue.push(new Player(session.name));
          this.playersArray[cont].status = "Joined next hand"; 
          // Send message to the player --> "Joined the next hand" ---------------(Display on Player Side)
        } else{
          for (var i = 0; i < queue.length; i++) {
            this.playersArray.splice(-1,0,(queue[i]));
          }
          this.reset();
          setUpRound();
        }
    } else {
      startGame(roomPlayer);  
      setUpRound();    
    }
  }
};

Game.prototype.playerIntheRP = function(){
  for (var i = 0; i < roomPlayer.length; i++) {
      if (roomPlayer[i] === session.name) {
        return true;
      } 
  }
  return false;
};

// ------------------- PLAY ROUND  -------------------------------

Game.prototype.setUpRound = function(){
  gameInProcess = true;
  g.initialDeal();
  this.turn = 0;
  this.playRound();
};

Game.prototype.playRound = function(){
  this.playersArray[turn].money -= this.playersArray[turn].bet;
  this.playersArray[turn].status = "Your turn"; 
  this.playTimer();
};

Game.prototype.playTimer = function(){
  // displayCardsButtons(this.playersArray[turn]); --------------------------------(Display on Player Side)
  // Send message to the player --> "Your turn and Display Buttons" ---------------(Display on Player Side) 
  var timer = setTimeout(function(){
    this.playersArray[turn].status = "Stand";   
    this.stand();
  },10000);
};

Game.prototype.hit = function(playerIndex){  //-------------------------------(Index comes from Player Side) 
  this.deal(playerIndex, 1);
  if (this.playersArray[turn].busted) {
    this.playersArray[turn].status = "Busted";
    this.stand();    
  }else {
    clearTimeout(timer);
    playTimer();  
  } 
};

Game.prototype.stand = function(){
// hideCardButtons(this.playersArray[turn]); //----------------------------------------------------(Hide Buttons Player Side) 
if (this.playersArray[turn].status !== "Busted") {
  this.playersArray[turn].status = "Stand"; 
}
clearTimeout(timer);
nextTurn();
};

Game.prototype.nextTurn = function(){
  this.turn += 1;
  if (this.playersArray.length-1 > this.turn) {
    this.playRound();  
  } else {
    for (var i = 0; i < playersArray.length-2; i++) {
      checkForWinner(i);
    }
  }
};

Game.prototype.finishHand = function() {
  this.gameInProcess = false;
  // invitePlayersForAnotherRound();------------------------------------------------------------------(Display buttons YES & NO & Message "Play Again?")
  var timer = setTimeout(function(){
    joinGame();
  },10000);

};

Game.prototype.logOut = function () {
  if (this.roomPlayer.length === 1 ) {
    g = null;
  }
  for (var i = 0; i < roomPlayer.length; i++) {
    roomPlayer.splice(roomPlayer[i],1);
  }
  for (var j = 0; j < playersArray.length; j++) {
    playersArray.splice(playersArray[j],1);
  }
  //Delete Cookie ---------------------------------------------------(NICK)
};



// ------------------- RESET GAME  ------------------------------

Game.prototype.reset = function(){
      for (var i = 0; i < this.playersArray.length; i++) {
        this.playersArray[i].aceCounter = 0;  
        this.playersArray[i].hand = [];
        this.playersArray[i].bet = 10;
        this.currentDeck = new Deck();
      }
};

   
 

//  Kick bastards out of the game
//  Change session.name for the right syntax
// Camilo Added --> Player --> this.status --> "New Player", "Your Turn", "Hit", "Stand", "Busted", "Joined next hand"
