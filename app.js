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
  Card.CLUBS    = 'clubs',
  Card.DIAMONDS = 'diamonds',
  Card.HEARTS   = 'hearts',
  Card.SPADES   = 'spades'
];

Card.prototype = {
  get face_card() {
    return this.rank > 10;
  },
  valueOf: function() {
    return this.rank;
  },
  toString: function() {
    var rank = {1: 'ace', 11: 'jack', 12: 'queen', 13: 'king'}[this.rank] || this.rank;
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
    this.money = 100;
    this.hand = [];
    this.totalValue = 0;
    this.aceCounter = 0;
    this.bet = 10;
    this.status = "New PLayer";
    this.logged = "Yes";
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

    if(this.playersArray.length -2 >= this.turn ){
      userHash[this.playersArray[this.turn].name].emit("cards", this.playersArray[this.turn].hand);
    }
};
 

// -------------------CHECK FOR WINNER -----------------

Game.prototype.checkForWinner = function(index) {
  var win = "";
  this.dealerStatus();
  // Instance of the Dealer
  var dealer = this.playersArray[this.playersArray.length-1]; 
  var player = this.playersArray[index];
    // console.log(player.name + " Hand : " + player.hand);
    console.log("Dealer Hand : " + dealer.hand);
    console.log("Dealer Total: " , dealer.totalValue);
    // Player busted
    if (player.totalValue > 21) {
        player.bet = 0;
        player.status = player.name + " Busted";
        console.log("-------------------------------");
        console.log(player.name + " Busted");
        console.log("-------------------------------");
    // Dealer Wins with BlackJack
    } else if (dealer.blackjack() && !(player.blackjack())) {
      player.bet = 0;
      player.status = " Dealer wins with BLACKJACK ";
      console.log("-------------------------------");
      console.log("Dealer wins with BLACKJACK");
      console.log("-------------------------------");
    // Player Win
    } else if (player.totalValue > dealer.totalValue){
        if (player.blackjack()) {

          player.money += (player.bet * 2.5);  
          player.status = player.name + " wins with BLACKJACK";

          console.log("-------------------------------");
          console.log(player.name + " wins with BLACKJACK ");
          console.log("-------------------------------");
        } else {

          player.money += (player.bet * 2);  
          player.status = player.name + " wins ";

          console.log("-------------------------------");
          console.log(player.name + " wins");
          console.log("-------------------------------");
        } 
        player.bet = 0;
    // Dealer Busted - Player Win

    } else if ((player.totalValue < dealer.totalValue) && (dealer.totalValue > 21)) {
      player.money += (player.bet * 2);
      player.bet = 0;  
      player.status = player.name +" wins - Dealer Busted ";

      console.log("-------------------------------");
      console.log(player.name +" wins - Dealer Busted");
      console.log("-------------------------------");
    // Dealer Win
    } else if ((player.totalValue < dealer.totalValue) && (dealer.totalValue < 22)){
      player.bet = 0;
      player.status = "Dealer Wins ";
      console.log("-------------------------------");
      console.log("Dealer Wins ");
      console.log("-------------------------------");
    // Tie Game
    } else if (player.totalValue === dealer.totalValue) {
      if (player.blackjack() && !dealer.blackjack()) {

        player.money += (player.bet * 2.5);  
        player.status = player.name +" wins with BJ and Dealer only 21 ";

        console.log("-------------------------------");
        console.log( player.name +" wins with BJ and Dealer only 21");    
        console.log("-------------------------------");
      }
      player.totalValue += player.bet;
      player.bet = 0;
      player.status = "Tie Game";
      console.log("-------------------------------");
      console.log("Tie Game");
      console.log("-------------------------------");
    }


    //-------------Displays the money, dealers cards and Winner for every player
  for (var i = 0; i < this.playersArray.length -1; i++) {
    userHash[this.playersArray[i].name].emit('wallet',this.playersArray[i].money);  
    userHash[this.playersArray[i].name].emit("rest of dealers cards", this.playersArray[this.playersArray.length -1].hand);
    userHash[this.playersArray[i].name].emit('winner',this.playersArray[i].status);  
  }

};

//-------------- DELAER STATUS -----------------------

Game.prototype.dealerStatus = function(){
  while (this.dealerUnder17()){
    if (!this.playersArray[this.playersArray.length -1].blackjack()){
      this.deal(this.playersArray.length-1,1); // Check for hit 
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

  if(this.playersArray.length -2 >= this.turn ){
      userHash[this.playersArray[this.turn].name].emit("cards", this.playersArray[this.turn].hand);
    }

};


// -------------------TEST DECK  ------------------------------
var newArr = [];
Game.prototype.clearDeck = function(){
  for (var i=0; i<this.currentDeck.cards.length;i++){
    if ( 9 < this.currentDeck.cards[i].rank || this.currentDeck.cards[i].rank === 1){
    newArr.push(this.currentDeck.cards[i]);
    }
  }
};


// -------------------VARIABLES FOR NEW ROUND  ------------------------------

var roomPlayer = [], gameInProcess = false, queue = [], g = null, count2 = 0;

// -------------------START GAME  ------------------------------
var startGame = function(array){
  g = new Game(array);
  return g;
};


var joinGame = function() {
console.log("---------------------------");
console.log("         New Round         ");
console.log("---------------------------");
// console.log("328 People in the RP : ", roomPlayer);
// console.log("329 People in the queue : ", queue);

  if ((userName) || (roomPlayer.length > 0 && queue.length > 0)){

    if (!playerIntheRP()) {
      roomPlayer.unshift(userName);
    }
    if (g !== null) {

        if (gameInProcess === true) {
          console.log("342 gameInProcess-------------- ", gameInProcess);
          queue.push(new Player(userName, "Joined next hand"));
          io.emit('player joined next hand', queue[queue.length-1].name);

 // Send message to the player --> "Joined the next hand" ---------------(Display on Player Side)

        } else{
          for (var i = 0; i < queue.length; i++) {
            // console.log("350 Splice is about to be called: ", queue[i]);
            g.playersArray.splice(-1,0,(queue[i]));
          }
          g.reset();
          g.checkForCurrentPlayers();
          if (g !== null) {
            g.setUpRound();
          }
          
        }
    } else {
      startGame(roomPlayer);

      //tester------------------tester
      for (var j = 0; j < g.playersArray.length ; j++) {
        console.log("363 Player Name: "+ g.playersArray[j].name);
      }
      //tester------------------tester ends
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

Game.prototype.checkForCurrentPlayers = function (){
  for (var i = 0; i < this.playersArray.length -1; i++) {
    if (this.playersArray[i].logged === "No") {
      this.playersArray.splice(i, 1); 
    } 
  }
  if (this.playersArray.length-1 === 0) {
    console.log("Sole el delaer, se acaba el juego");
    g = null;
    this.playersArray = [];
  }
  console.log(" 415 Players for the next Round " + this.playersArray);
};


// ------------------- PLAY ROUND  -------------------------------

Game.prototype.setUpRound = function(){

  gameInProcess = true;
  g.initialDeal();
  this.turn = 0;
  this.playRound();
  for (var i = 0; i < this.playersArray.length ; i++) {
    // It displays cards for all players but the Dealer
    if (this.playersArray[i].name !== "Dealer") {
      userHash[this.playersArray[i].name].emit("cards", this.playersArray[i].hand);
      userHash[this.playersArray[i].name].emit("total hand", this.playersArray[i].totalValue);
    // It displays de first Dealer's card
      userHash[this.playersArray[i].name].emit("card_1_Dealer", this.playersArray[this.playersArray.length -1].hand);
    }


  //tester------------------tester
    console.log("427 Player "+ this.playersArray[i].name + " HAND:  "+ this.playersArray[i].hand);
    console.log("429 Player "+ this.playersArray[i].name + " TOTAL:------------------------------ "+ this.playersArray[i].totalValue);
  }
  //tester------------------tester ends

  // Next line shows all the players on the table
    io.emit ('active players', this.playersArray);    

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
  // if  (this.playersArray.length -2 >= this.turn){
  if (this.playersArray[this.turn].name !== "Dealer") {
    userHash[this.playersArray[this.turn].name].emit('hide',"HI!!!!!");
  }
}; 



Game.prototype.playTimer = function(){
// Dislpays player's turn
  io.emit('turn',this.playersArray[this.turn].name);
  this.displayButtonsToPlayer();
  count1 = 20; // Required dont delete
  //Sets screen timer
  this.intervalTrigger();
  var _this = this;
  //Sets internal timer for players turn
  this.timerPlay = setTimeout(function(){
    _this.playersArray[_this.turn].status = "Stand";
    _this.stand();
  _this.cleanTimer =  clearInterval(_this.intervalId);
  },21000);

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
    console.log("490 Player "+ this.playersArray[i].name  +" HAND:  "+ this.playersArray[i].hand);
    console.log("491 Player "+ this.playersArray[i].name  +" TOTAL--------------------------------:  "+ this.playersArray[i].totalValue);
    userHash[this.playersArray[i].name].emit("total hand", this.playersArray[i].totalValue);
  }
  //tester------------------tester ends

  if (this.playersArray[this.turn].busted()) {
    this.playersArray[this.turn].status = "Busted";
    clearTimeout(this.timerPlay);
    clearInterval(this.intervalId);
    this.stand();
  }else {
    clearTimeout(this.timerPlay);
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
  this.turn += 1;
  if (this.playersArray.length-1 > this.turn) {
    this.playRound();
    console.log("501 Next Turn with many players");
  } else {
    for (var i = 0; i < this.playersArray.length-1; i++) {
      this.checkForWinner(i);
    }
  this.finishHand();
  }
};


Game.prototype.finishHand = function() {
  _this = this;
  count2 = 10;
  this.finishIntervalTrigger();
  io.emit('turn off join game');
  this.invitePlayersForAnotherRound();//------------------------------------------------------------------(Display buttons YES & NO & Message "Play Again?")
  //--- Next Timer sets up 10 sec before the next round 
  var finishTimer = setTimeout(function(){  
  gameInProcess = false;
  // next line emits command to delete the timer message  
    io.emit('delete finish timer');
  // next line deletes "play again" message from screen
    io.emit("play again");
  // Next line stops the timer on the screen for every player  
    _this.cleanTimer =  clearInterval(_this.finishIntervalId);
  // Next lines remove previos set of cards from the table  
    for (var i = 0; i < _this.playersArray.length -1; i++) {
      userHash[_this.playersArray[i].name].emit('delete previous cards',_this.playersArray[i].hand);
       io.emit('delete winner message');
    }

    if ( g.playersArray[0].money > 0) { //---------------------Stops the game when money = $0
      joinGame();
    }
  },10000);
};


Game.prototype.finishIntervalTrigger = function(){
  var _this = this;
  this.finishIntervalId = setInterval(function() {
    _this.finishCallCounter();
    io.emit('turn off join game');
  },1000);
};

Game.prototype.finishCallCounter = function(){
  console.log(count1);
  count2 -= 1;
  io.emit("set finish time", count2 );
};




Game.prototype.invitePlayersForAnotherRound = function(){
  io.emit("play again");
};

Game.prototype.logOut = function (name) {
  // for (var i = 0; i < roomPlayer.length; i++) {
    // roomPlayer.splice(roomPlayer[i],1);
  // }
  for (var i = 0; i < this.playersArray.length; i++) {
    if (this.playersArray[i].name === name) {
    this.playersArray[i].logged = "No";  
    }
  }
  console.log("users on PA after Log out: ", this.playersArray);
  // if (roomPlayer.length === 1 ) {
    // this.playersArray = [];
    // g = null;
    // clearTimeout(this.finishTimer);
  // }
};



// ------------------- RESET GAME  ------------------------------

Game.prototype.reset = function(){
      for (var i = 0; i < this.playersArray.length; i++) {
        this.playersArray[i].aceCounter = 0;
        this.playersArray[i].hand = [];
        this.playersArray[i].bet = 10;
      }
      this.currentDeck = new Deck();
      queue = [];
      // io.emit('delete previous cards',this.playersArray[this.turn].hand);
};




//  Take players out of the game
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
console.log("UserName", userName);
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
    socket.on("stand request", function(){
      g.stand();

    });

    socket.on("leave the table", function(){
      
      g.logOut(userName);

    });
    // bet logic goes here:
    socket.on("bet", function(newBet){

      g.playersArray[g.turn].bet += parseInt(newBet);
      console.log('--------newBet-----');
      console.log(g.playersArray[g.turn].bet);
      console.log('-------------------');
    });
    

    socket.on("disconnect", function(){
      
      console.log("Retirado",userName);
      if (g !== null) {
        for (var i = 0; i < g.playersArray.length -1; i++) {
          if (g.playersArray[i].name === userName) {
            g.playersArray[i].logged = "No";
            console.log(g.playersArray[i].name);
          }
          
        }
      }    


      // function matchesName(array, nameToCheck) {
      //   // console.log("CAMILO HERE HERE",array);
      //   // console.log("EL otro ", nameToCheck);
      //   console.log("EL otro 2", userName);
        
      //   for (var i=0; i > array.length; i++){
      //     if (array[i].name === userName){
      //         g.playersArray[i].status = "retired"; 
      //         console.log("Retirado" , g.playersArray[i].status);
      //       // return i;
      //     }
      //   }

      // }
      // //Camilo test
      // if (g !== null) {
      //   console.log("Probando ", matchesName);
      //  g.playersArray.splice(matchesName(g.playersArray), 1); 
      // }
      // g.playersArray.splice(matchesName(g.playersArray), 1);
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






