$(document).ready(function() { 

$('#leaveTableButton').toggle();
// // -------------------ADD NEW PLAYERS  ------------------------------

// // startGame(["nick", "camilo"]);


// //------------------- JQUERY -----------------------



  //----------------------SOCKET EMISSION
  var socket = io();  

  $('#joinGame').on("submit", function(e){
    socket.emit("join game");
    $('#joinGameButton').attr("disabled",true);
  });


  $('#hit').on("submit", function(e){
    socket.emit('hit request');
  });

  $('#stand').on("submit", function(e){
    socket.emit('stand request');
  });

  $(".bet").on("submit", function(e){

    socket.emit('bet', $('.bet-val').val());
  });

  $('#leaveTable').on("submit", function(e){
    socket.emit('leave the table');
  });  


  //----------------------SOCKET LISTENERS

  socket.on("set time", function(msg){
    $('#time1').text(" -  " + msg + " seconds");
    // if (msg === 3) {
    //   $('.hitb').attr("disabled",true);
    // }
  });

  socket.on("set finish time", function(msg){
    $('#finalTimer').text("Next round in "+ msg + " seconds");
  });
<<<<<<< HEAD
=======
  
  socket.on("active players", function(players){
    $('#currentPlayers').append("Current Players");
    for (var i = 0; i < players.length -1; i++) {
      $('#currentPlayers').append('<li>' + players[i].name + '</li>');
    }
  });


>>>>>>> 0b4b731709c8a26aa6a49918d883c8899f8b59f7

  socket.on('hide', function(msg){
    $('.standb').attr("disabled",true);
    $('.hitb').attr("disabled",true);
    $('.betb').attr("disabled",true);
  });

  socket.on('show', function(){
<<<<<<< HEAD
    $('.hitb').attr("disabled",false);
    $('.standb').attr("disabled",false);
    $('.betb').attr("disabled",false);
  });

  socket.on('cards', function(cards){
    for (var i=0;i < cards.length;i++){
      var val_1 = cards[i].rank + " of " + cards[i].suit;
      $('#player_card_'+ (i + 1)).text(val_1);
      $('#player_card_'+ (i + 1)).attr('src','/img/'+ val_1 +'.png');
      
    }
  });
=======
          $('.hitb').attr("disabled",false);
          $('.standb').attr("disabled",false);
      });

  socket.on('turn off join game', function(){
          $('#joinGameButton').toggle();
          
      });


   socket.on('cards', function(cards){
      for (var i=0;i < cards.length;i++){
      var val_1 = cards[i].rank + " of " + cards[i].suit;
      $('#player_card_'+ (i + 1)).text(val_1);
      $('#player_card_'+ (i + 1)).attr('src','/img/'+ val_1 +'.png');
      }
    });
>>>>>>> 0b4b731709c8a26aa6a49918d883c8899f8b59f7

  socket.on('card_1_Dealer', function(cards){
    var val_1 = cards[0].rank + " of " + cards[0].suit;
    $('#dealer_card_1').attr('src','/img/'+ val_1 +'.png');      
  });


  socket.on('rest of dealers cards', function(cards){
    for (var i=1;i < cards.length;i++){
      var val_1 = cards[i].rank + " of " + cards[i].suit;
      $('#dealer_card_'+ (i + 1)).attr('src','/img/'+ val_1 +'.png');
      
    }
  });

  socket.on('winner', function(message){
    $('#winnerMessage').text(message);
  }); 
  

<<<<<<< HEAD
  socket.on('wallet', function(money){
    console.log("Wallet is called");
    $('#walletScore').text(money);
  });
=======
   socket.on('wallet', function(money){
      $('#walletScore').text('$ ' + money);
    });
>>>>>>> 0b4b731709c8a26aa6a49918d883c8899f8b59f7

  socket.on('turn', function(name){
    $('#turn').text(name + "'s turn");
  });

<<<<<<< HEAD
  socket.on('delete winner message', function(message){
    $('#winnerMessage').text(" ");
  }); 
=======
   socket.on('play again', function(){
      $('#leaveTableButton').toggle();
    }); 

   socket.on('delete winner message', function(message){
      $('#winnerMessage').text(" ");
      $('#currentPlayers').empty();
    }); 
>>>>>>> 0b4b731709c8a26aa6a49918d883c8899f8b59f7

  socket.on('delete finish timer', function(message){
    $('#finalTimer').text(" ");
  }); 


  socket.on('delete previous cards', function(cards){
    for (var i=0;i < 5;i++){
      $('#player_card_'+ (i + 1)).removeAttr('src');
      $('#dealer_card_'+ (i + 1)).removeAttr('src');
    }
    console.log("Got it for this player, deleting " );
    
  });

  //----------------------SOCKET OTHER


  // socket.on('hit reply', function(msg){
  //   console.log(msg);
  // });


  



  // socket.on('player joined next hand', function(msg) {
  //   // append msg to wherever you want it.
  // });

  // socket.on('show buttons to user', function(){
  //   $('body').append
  // });

  









 });
