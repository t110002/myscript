/**
* Copyright (c) Vision Objects
* 
* This file contains an example of equation recognition, when used in
* conjunction with the other files in the samples, which let you create a 
* drawing canvas in an HTML file, where users can enter handwritten equations
* that will be sent to the MyScript recognition server.
* In brief, this sample creates a JSON request, based on the strokes collected in
* the HTML file. 
* It then sends the request to the MyScript recognition server, and retrieves and
* displays the results as LaTeX or MathML strings.
* This implementation is provided as-is. You will need to provide your personal
* API key, given to you on registration, if you want the request to succeed.
*
*/

/** This function creates the JSON object, sends it and retrieves the result. */

recognize = function(strokes, handler, options, apiKey, url) {
	if(!url) url = "https://myscript-webservices.visionobjects.com/api/myscript/v2.0/equation/doSimpleRecognition.json";

	var jsonPost =	{
		"components" : strokes,
		"resultTypes" : options.type
	};

/** Send data to POST. Give your API key as supplied on registration, or the 
* server will not recognize you as a valid user. */
	var data = {
		"apiKey" : apiKey,
	 	"equationInput" : JSON.stringify(jsonPost)
	};

	/** Display the "wait" symbol while processing is underway. */
	$("#loading").show();
	/** Post request.   */
	$.post(url, data, handler, "json").error(function(XMLHttpRequest, textStatus) {
							$("#result").text(textStatus +" : "+ XMLHttpRequest.responseText);
							$("#loading").hide();
						 });
};

/** These controls handle the canvas clearance and undo/redo capabilities and the choice of LaTeX or MathML formats, which are available as buttons and drop-down lists in the HTML file. */
controllerButtons = function(strokes, strokesSave, options, apiKey, url) {
       $("#resultTypes").change(function() {
	      options.type = [];
	      options.type.push($("#resultTypes option:selected").text());
	      recognize(strokes, displayResult, options, apiKey, url);
       });

       $("#undo").on("click", function() {
	      if(strokes.length > 1) {			  
		     strokesSave.push(strokes.pop());
		     var i;
		     var ctx = init($("#canvas"));
		     for(i=0; i<strokes.length; i++) {
			    $("#canvas").paintStroke(ctx, strokes[i]);
		     }
		     recognize(strokes, displayResult, options, apiKey, url);
		     $("#redo").attr("src", "images/redo.png");
	      }
	      else if(strokes.length > 0) {			  
		     strokesSave.push(strokes.pop());
		     init($("#canvas"));
		     $("#result").text("");
		     $("#undo").attr("src", "images/undo_disabled.png");
		     $("#redo").attr("src", "images/redo.png");
	      }
       });
       
       $("#redo").on("click", function() {
	      if(strokesSave.length > 0) {
		     strokes.push(strokesSave.pop());
		     var i;
		     var ctx = init($("#canvas"));
		     for(i=0; i<strokes.length; i++) {
			    $("#canvas").paintStroke(ctx, strokes[i]);
		     }
		     recognize(strokes, displayResult, options, apiKey, url);
		     $("#undo").attr("src", "undo.png");
		     if(strokesSave.length == 0)
			    $("#redo").attr("src", "images/redo_disabled.png");
	      }
       });
       
       $("#clear").on("click", function() {
	      while(strokes.length != 0) strokes.pop();
	      while(strokesSave.length != 0) strokesSave.pop();
	      init($("#canvas"));
	      $("#result").text("");
	      $("#redo").attr("src", "images/redo_disabled.png");
	      $("#undo").attr("src", "images/undo_disabled.png");
       });
};

/** Show the result in the canvas. */
var displayResult = function(jsonResult) {
       $("#result").text("");
       var i;
       for(i=0; i<jsonResult.result.results.length; i++) {
	      $("#result").append(jsonResult.result.results[i].value);
       }
       MathJax.Hub.Queue([ 'Typeset', MathJax.Hub, 'result' ]);
			 $("#loading").hide();
}; 

/** Draw strokes in the canvas, as specified in the accompanying HTML file. */
$.fn.extend({
       addWriteHandlers: function(strokes, strokesSave, handler, options, apiKey, url) {
	      var stroke;
	      var canvas = this.get(0);
	      var ctx = init(this);
	      var drawing = false;
	      var lastX, lastY;

	      var methods = {
		     start: function(x, y) {
			    stroke = {
				   "type":"stroke",
				   "x" : [x],
				   "y" : [y]
			    };
			    lastX = x;
			    lastY = y;
			    drawing = true;
		     },
		     move: function(x, y) {
			    if (drawing) {
				   ctx.beginPath();
				   ctx.moveTo(lastX, lastY);
				   ctx.lineTo(x, y);
				   ctx.stroke();
				   stroke.x.push(x);
				   stroke.y.push(y);
				   lastX = x;
				   lastY = y;
			    }
		     },
		     /**As soon as drawing finishes, the strokes are sent for recognition. */
			 end: function() {
			    if (drawing) {
				   drawing = false;
				   strokes.push(stroke);
				   while(strokesSave.length != 0) strokesSave.pop();
				   $("#undo").attr("src", "images/undo.png");
				   $("#redo").attr("src", "images/redo_disabled.png");
				   recognize(strokes, handler, options, apiKey, url);
			    }
		     }
	      };

/** Describes the writing events on the canvas, for mouse and touchscreen.	 */      
	      $(canvas).on("touchstart", function(event) {
		     event.preventDefault();
		     var offset = $(this).first().offset();
		     var touch = event.originalEvent.touches[0];
		     var x = touch.pageX - offset.left;
		     var y = touch.pageY - offset.top;
		     methods.start(x, y);
	      });
	      $(canvas).on("touchmove", function(event) {
		     event.preventDefault();
		     var offset = $(this).first().offset();
		     var touch = event.originalEvent.touches[0];
		     var x = touch.pageX - offset.left;
		     var y = touch.pageY - offset.top;
		     methods.move(x, y);
	      });
	      $("*").on("touchend", function(event) {
		     event.preventDefault();
		     methods.end();
	      });
	      $(canvas).on("mousedown", function(event) {
		     event.preventDefault();
		     var offset = $(this).first().offset();
		     var x = event.pageX - offset.left;
		     var y = event.pageY - offset.top;
		     methods.start(x, y);
	      });
	      $(canvas).on("mousemove", function(event) {
		     event.preventDefault();
		     var offset = $(this).first().offset();
		     var x = event.pageX - offset.left;
		     var y = event.pageY - offset.top;
		     methods.move(x, y);
	      });
	      $("*").on("mouseup", function(event) {
		     event.preventDefault();
		     methods.end();
	      });
       },
	   /** Used to re-draw previously drawn strokes, if the redo button is activated. The strokes.Save function retains the last canvas entry to allow for this. */
       paintStroke: function(ctx, stroke) {
	      ctx.beginPath();
	      var lastX = stroke.x[0], lastY = stroke.y[0];
	      ctx.moveTo(stroke.x[0],stroke.y[0]);
	      
	      var i;
	      for(i=1; i<stroke.x.length; i++) {
		     ctx.lineTo(stroke.x[i],stroke.y[i]);
		     ctx.moveTo(stroke.x[i],stroke.y[i]);		     
		     lastX = stroke.x[i];
		     lastY = stroke.y[i];		     
	      }
	      ctx.stroke();
       }
});

/** Initialize the canvas. */
init = function(canvasId) {
       var canvas = canvasId.get(0);
       var ctx = canvas.getContext("2d");
       
       canvas.width = canvasId.first().width();
       canvas.height = canvasId.first().height();
       ctx.lineWidth = 2;
       ctx.lineCap = "round";
       ctx.lineJoin = "round";
       ctx.fillStyle = "blue";
       ctx.strokeStyle = "blue";
       
       return ctx;
};
