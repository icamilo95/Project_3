var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis");
var client = redis.createClient();
var methodOverride = require("method-override");
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var userName = {};

//middleware below
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

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

var Player = function(name, status){
    this.name = name;
    this.money = 130;
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
    // console.log("Total Value " + this.totalValue);
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
    this.playersArray[index].hand = this.playersArray[index].hand.concat(this.currentDeck.draw(cards));
    this.playersArray[index].totalhand();
    // console.log("My cards" + this.playersArray[index].hand);
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
        console.log("Player Busted - checkForWinner");
    // Dealer Wins with BlackJack   
    } else if (dealer.blackjack() && !(player.blackjack())) {
      player.bet = 0;
      console.log("Delaer wins with BLACKJACK");
    // Player Win    
    } else if (player.totalValue > dealer.totalValue){
        if (player.blackjack()) {
          player.money += (player.bet * 2.5);  
          console.log("Player Wins with BLACKJACK ");
        } else {
          player.money += (player.bet * 2);  
          console.log("Player Wins (110)");
        } 
        player.bet = 0;
    // Dealer Busted - Player Win    
    } else if ((player.totalValue < dealer.totalValue) && (dealer.totalValue > 21)) {
      player.money += (player.bet * 2);
      player.bet = 0;  
      console.log("Player Wins - Dealer Busted");
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

    //tester------------------tester
  for (var i = 0; i < this.playersArray.length -1; i++) {
    console.log("Player Idx: "+ [i] +" MONEY:  "+ this.playersArray[i].money);
  }
  //tester------------------tester ends



};

//-------------- DELAER STATUS -----------------------

Game.prototype.dealerStatus = function(){
  while (this.dealerUnder17()){
    if (!this.playersArray[this.playersArray.length -1].blackjack()){
      this.deal(this.playersArray.length-1,1); // Check for hit 
      // console.log("card delt");
      // console.log(this.playersArray[1].hand);
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




// -------------------JOIN GAME  ------------------------------


var roomPlayer = [], gameInProcess = false, queue = [], g = null;

// -------------------START GAME  ------------------------------
var startGame = function(array){
  g = new Game(array);
  return g;    
};


var joinGame = function() {
  console.log("People in the RP : ", roomPlayer);
console.log("---------------------------");
console.log("Join game is being called");
console.log("---------------------------");
  
  
  if ((userName) || (roomPlayer.length > 0 && queue.length > 0)){
    
    if (!playerIntheRP()) {
      
      roomPlayer.unshift(userName);
      console.log("RP: ", roomPlayer); 

    }
    if (g !== null) {
        
        if (gameInProcess === true) {
          console.log("342 gameInProcess-------------- ", gameInProcess);
          queue.push(new Player(userName, "Joined next hand"));
          // io.emit('player joined next hand', g.playersArray[cont].status);
 
 // Send message to the player --> "Joined the next hand" ---------------(Display on Player Side)
          
        } else{
          for (var i = 0; i < queue.length; i++) {
            console.log("350 Splice is about to be called: ", queue[i]);
            g.playersArray.splice(-1,0,(queue[i]));
          }
          g.reset();

          g.setUpRound();
        }
    } else {
      console.log("358 RP - Start game is about to be called: ", roomPlayer);
      startGame(roomPlayer);  
      console.log("Player 1 started the Game");
      g.setUpRound();    
    }
  }
};

var playerIntheRP = function(){
  for (var i = 0; i < roomPlayer.length; i++) {
      if (roomPlayer[i] === userName) {
        console.log("369 UserName in playerIntheRP: ",userName);
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

  //tester------------------tester
  for (var i = 0; i < this.playersArray.length ; i++) {
    console.log("387 Player Idx: "+ [i] +" HAND:  "+ this.playersArray[i].hand);
    console.log("388 Player Idx: "+ [i] +" TOTAL:--------- "+ this.playersArray[i].totalValue);
  }
  //tester------------------tester ends

};

Game.prototype.playRound = function(){
  
  this.playersArray[this.turn].money -= this.playersArray[this.turn].bet;
  this.playersArray[this.turn].status = "Your turn"; 
  this.playTimer();
};

Game.prototype.displayButtonsToPlayer = function() {
    userHash[this.playersArray[this.turn].name].emit('show');
};

Game.prototype.hidePlayerHsButtons = function() {
  if  (this.playersArray.length -2 >= this.turn){
    userHash[this.playersArray[this.turn].name].emit('hide',"HI!!!!!");
  }
}; 



Game.prototype.playTimer = function(){

  // displayCardsButtons(this.playersArray[this.turn]); --------------------------------(Display on Player Side)
  // Send message to the player --> "Your this.turn and Display Buttons" ---------------(Display on Player Side) 
  this.displayButtonsToPlayer();
  count1 = 21; // Required dont delete
  
  this.intervalTrigger();
  var _this = this;
  this.timerPlay = setTimeout(function(){
    // console.log("first timer Reached after 2 secs");
    _this.playersArray[_this.turn].status = "Stand";   
    _this.stand();

  _this.cleanTimer =  clearInterval(_this.intervalId);
    // count1 = 11;
    // console.log("Interval cleared");
  },20000);

};

Game.prototype.intervalTrigger = function(){
  var _this = this;
  this.intervalId = setInterval(function() {
    _this.callCounter();
  },1000);
};

Game.prototype.callCounter = function(){  
  console.log(count1);
  count1 -= 1;
  io.emit("set time", count1 );
};
  

Game.prototype.hit = function(){  
  this.deal(this.turn, 1);
  

  //tester------------------tester
  for (var i = 0; i < this.playersArray.length -1; i++) {
    console.log("453 Player Idx: "+ [i] +" HAND:  "+ this.playersArray[i].hand);
    console.log("454 Player Idx: "+ [i] +" TOTAL-------:  "+ this.playersArray[i].totalValue);
  }
  //tester------------------tester ends


  // -----Sends the hando to the player
  if(this.playersArray.length -2 >= this.turn ){
    userHash[this.playersArray[this.turn].name].emit("cards", this.playersArray[this.turn].hand);
  }
  //----Does the hit function
  if (this.playersArray[this.turn].busted()) {
    this.playersArray[this.turn].status = "Busted";
    clearTimeout(this.timerPlay);
    clearInterval(this.intervalId);
    this.stand(); 
  }else {
    // console.log(this.timerPlay)
    clearTimeout(this.timerPlay);
    // count1=21;
    clearInterval(this.intervalId);
    this.playTimer();  
  } 
};

Game.prototype.stand = function(){
clearTimeout(this.timerPlay);
clearInterval(this.intervalId);
this.hidePlayerHsButtons();
if (this.playersArray[this.turn].status !== "Busted") {
  this.playersArray[this.turn].status = "Stand"; 
}

this.nextTurn();
};

Game.prototype.nextTurn = function(){
  
  //delete next lines
  // console.log("Player1 money " + g.playersArray[0].money);
  // if (g.playersArray.length > 2) {
    // console.log("Player2 money " + g.playersArray[1].money);
  // }

  this.turn += 1;
  console.log("498 This turn starting nexturn", this.turn);
  if (this.playersArray.length-1 > this.turn) {
    this.playRound(); 
    console.log("501 Next Turn with many players"); 
  } else {
    console.log("503 length:////// ",this.playersArray.length);
    for (var i = 0; i < this.playersArray.length-1; i++) {
      console.log("505 Turn:()()()()()()()()()()()()()()()()() " ,i );  
      this.checkForWinner(i);
      
    }

  this.finishHand();
  }
  gameInProcess = false;
  // console.log("512 Players: ", this.playersArray.length);
  // console.log("513 Players: ", this.playersArray);



};


Game.prototype.finishHand = function() {
  gameInProcess = false;
  // console.log(" 522 Game in process in finish hand", gameInProcess);
  // this.invitePlayers();
  // invitePlayersForAnotherRound();------------------------------------------------------------------(Display buttons YES & NO & Message "Play Again?")
  var finishTimer = setTimeout(function(){
    // console.log("second timer reached after 2 secs");
    // for (var i = 0; i < g.playersArray.length; i++) {
      // if (g.playersArray[i].money > 0) {}; 
    // };
    // console.log("530 Right before join a new game");
    if ( g.playersArray[0].money > 0) { //---------------------Stops the game when money = $0
      joinGame();
    }
    
  },5000);

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
  
};



// ------------------- RESET GAME  ------------------------------

Game.prototype.reset = function(){
      for (var i = 0; i < this.playersArray.length; i++) {
        this.playersArray[i].aceCounter = 0;  
        this.playersArray[i].hand = [];
        this.playersArray[i].bet = 10;
        this.currentDeck = new Deck();
        queue = [];
        
      }
};

   
 

//  Kick bastards out of the game
//  Change userName for the right syntax
// Camilo Added --> Player --> this.status --> "New Player", "Your this.turn", "Hit", "Stand", "Busted", "Joined next hand"


// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
 // ROUTES AND OTHER THINGS BELOW:


// Render new user page
app.get('/newUser', function(req, res){
 res.render('newUser');
});

// Enter global chat
app.get('/blackjack', function(req, res){
  res.render('blackjack');

userName = req.cookies['username'];
// console.log("UserName", userName);
});


// ---------------------LISTENERS
var userHash = {};
  io.on('connection', function(socket){
    socket.on("join game", function(){
    console.log("Its connecting");
    joinGame();
    });
    socket.nickname = userName;
    // console.log(userName)
    userHash[userName] = socket;
    // console.log(userHash["nick"])
    userHash[userName].emit("hello world", "hello world " + userName );

    // --------TEST -----------------
    // io.emit("set time", count1 );
    // console.log("Timer Camilo", timeTest());
    socket.on("hit request", function(){
      g.hit();
    });
    f = 0;
    socket.on("stand request", function(){
      console.log("before stand request");
      f += 1;
      console.log("F = " +f);
      g.stand();
      console.log("after stand request");
    });
});



// ---------------------SHOWS INDEX PAGE
app.get('/', function(req, res){
  res.render('index');
});

// ---------------------POST ROUTE FOR CREATING A NEW USER
// Create new User
 //validate uniqueness of userName
 app.post("/newuser", function(req, res){
   client.HSETNX("users", req.body.userName, req.body.userPass, function(err, success) {
     if (success === 1) {
       res.redirect('/');
     } else {
       console.log("person already exists, figure out how to render this to the page");
     }
   });
 });


// ---------------------VALIDATES THE RIGHT USER NAME AND PASSWORND AND REDIRECTS TO GAME 
//validates userPass === userName and logs in
 app.post("/blackjack", function(req, res){
  var getUserPass = function(){
    client.HGET("users", req.body.userName, function(err, reply){
      if (err){
        console.log("Could not query the database");
      }
      if (req.body.userPass == reply){
        res.redirect("/blackjack");
      } else {
        console.log("Incorrect UserName or Password");
        res.redirect('/');
      }
    });
  };
  getUserPass();
});



// ---------------------START THE SERVER --------------------
http.listen(3000, function(){
  console.log('listening on *:3000');
});
// ---------------------NOTHING AFTER THIS --------------------






