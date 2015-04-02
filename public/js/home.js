console.log("hello");


  $('#form1').on("submit", function(e){
    document.cookie = "username=" + $('#userName').val()
  });
