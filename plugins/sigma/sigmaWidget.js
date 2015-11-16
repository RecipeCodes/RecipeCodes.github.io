/*\
title: $:/plugins/tiddlywiki/sigma/sigmaWidget.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var	sigmajs = require("$:/plugins/tiddlywiki/sigma/sigma.js");
var sigma_force = require("$:/plugins/tiddlywiki/sigma/sigma.layout.forceAtlas2.min.js");
// var config = require("$:/plugins/felixhayashi/topstoryview/config.js").config;


// $:/plugins/tiddlywiki/sigma/sigma.js: 

var SigmaWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SigmaWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SigmaWidget.prototype.render = function(parent,nextSibling) {
  
  // CREATE THE CANVAS
  var canvas=document.createElement('div');
  canvas.setAttribute("id", "map");
  canvas.style.width = "100%";
  canvas.style.height = "400px";
  canvas.style.background = "floarlwhite";
  canvas.style.position = "absolute";
  canvas.style.zIndex = 3;
  canvas.style.cursor = "move";
  parent.appendChild(canvas);

	// // Save the parent dom node
	this.parentDomNode = parent;
	// // Compute our attributes
	this.computeAttributes();
	// // Execute our logic
	this.execute();
	// // Create the map
  try{
    sigma.classes.graph.addMethod('neighbors', function(nodeId) {
      var k;
      var neighbors = {};
      var index = this.allNeighborsIndex[nodeId] || {};
      for (k in index)
        neighbors[k] = this.nodesIndex[k];

      return neighbors;
    });
  } catch(e){}

  this.sigma = new sigma();
	var map = this.createMap(parent,nextSibling);

	// this.updatemap = map.updatemap;
	// if(this.updatemap) {
	// 	this.updatemap();
	// }

	// // Insert the map into the DOM and render any children
	// parent.insertBefore(map.domNode,nextSibling);
	// this.domNodes.push(map.domNode);


};

SigmaWidget.prototype.createMap = function(parent,nextSibling) {

	// Get the data we're plotting
  var c = $tw.wiki.getTiddlerData("$:/temp/focussedTiddler");
  var ref = this;
  var data = this.wiki.getTiddlerData(this.SigmaData);
  // var color = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];
  var color = ['#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd'];
  var cuisine = ['Indian', 'Lebanese', 'Mexican', 'Chinese', 'American', 'French', 'Thai', 'Italian'];
  var s = this.sigma;
  var  g = {
      nodes: [],
      edges: []
    };


  for(var i = 0; i < data["nodes"].length; i++)
       g.nodes.push({
      id: data["nodes"][i]["id"],
      label: data["nodes"][i]["id"].substring(0, 15),
      x: Math.random(),
      y: Math.random(),
      size: Math.random(),
     color: color[cuisine.indexOf(data["nodes"][i]["cuisine"])]
    });
  

  for(var i = 0; i < data["edges"].length; i++)
      g.edges.push({
        id: data["edges"][i]["id"],
        size: data["edges"][i]["size"],
        source: data["edges"][i]["source"],
        target: data["edges"][i]["target"],
        type: 'curve',
        color: "#ffffff"
      });

  s.graph.read(g);

  s.addCamera('cam')

  s.addRenderer({
    container: document.getElementById('map'),
    type: 'canvas',
    camera: 'cam',
    settings: {
      drawEdges: true,
      ratio: 0.2
    }
  });

  sigma.prototype.zoomToNode = function(node, ratio, camera){
      if(typeof camera == "undefined"){
          camera = this.cameras['cam'];
      }
      camera.goTo({
        x: node[camera.readPrefix+"x"]+50,
        y: node[camera.readPrefix+"y"],
        angle: 0,
        ratio: 0.5
      });
      this.refresh();
  }

    sigma.prototype.resetZoom = function(camera){
        if(typeof camera == "undefined"){
            camera = this.cameras[0];
        }
        camera.ratio = 0.5;
        camera.x = 0;
        camera.y = 0;   
        this.refresh();
    }

    s.bind('clickNode', function (event) {
        s.zoomToNode(event.data.node, 0.5, event.target.camera);
        ref.openTiddler(event.data.node["id"]);    

        var nodeId = event.data.node["id"];
        var toKeep = s.graph.neighbors(nodeId);
        toKeep[nodeId] = event.data.node;
        s.graph.edges().forEach(function(event) {
          if (toKeep[event.source] && toKeep[event.target])
            event.color = "#aaaaaa";
          else
            event.color = "#ffffff";
        });
        s.refresh();

    });
    s.startForceAtlas2();
};

SigmaWidget.prototype.openTiddler = function(name){
    this.dispatchEvent({
        type: "tm-navigate", navigateTo: name
      })
};

SigmaWidget.prototype.onScroll = function(name){
  var node = this.sigma.graph.nodes(name);
  if(node == undefined) return;
  var camera = this.sigma.cameras['cam'];
  camera.goTo({
      x: node[camera.readPrefix+"x"]+50,
      y: node[camera.readPrefix+"y"],
      angle: 0,
      ratio: 0.5
    });
}

/*
Compute the internal state of the widget
*/
SigmaWidget.prototype.execute = function() {
	// Get the parameters from the attributes
  this.SigmaData = this.getAttribute("data");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SigmaWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.goTo || changedTiddlers[this.SigmaData]) {
    this.onScroll(this.getAttribute("goTo"));
		return true;
	}
	return false;
};

exports.Sigma = SigmaWidget;

})();
