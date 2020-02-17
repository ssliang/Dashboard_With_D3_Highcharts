// Constants
const DINGUS_PRICE = 14.25;
const WIDGET_PRICE = 9.99;
const ZERO_FORMAT = '0.00';
const DEBUG = true; // Where might this flag be used? (It's not mandatory)
const radius = 100;
const yTickInterval = 320/6;
const tickInterval = 6/5;
const yAxis_yPos = 320;

// Global store (What else would you need here?)
let store = {
	orderHistory: generateEntries(),
	currID: generateEntries().length,
	dates: generateDatesQuantities(true),
	currDingusQuantity: 0, //quantity of a particular order
	currWidgetQuantity: 0, //quantity of a particular order
	dingusQuantity: 0, //total
	widgetQuantity: 0, //total
	total: 0,
	totalQuantity: 0,
	totalQuantityPerDayD: generateDatesQuantities(false),
	totalQuantityPerDayW: generateDatesQuantities(false),
	maxY: 0, 
	timesUpdated: 1
  };


function generateEntries() {
	// Returns an orderHistory array
	// [ID#, Date, Dingus quantity, Widget quantity]
	return [
		[1, '01/01/2020', 1, 1], 
		[2, '01/02/2020', 2, 2],
	]
}

function generateDatesQuantities(isDates) {
	let dtmp = [];
	let qtmp = {};
	let dates = generateEntries();
	for (var i = 0; i < dates.length; i++) {
		let d = dates[i][1];
		if (!dtmp.includes(d)) {
			dtmp.push(d);
			qtmp[d] = 0;
		}
	}
	if (isDates) {return dtmp} else {return qtmp}

}

///////////////////////////////////////// INITIAL LOAD //////////////////////////////////////////

// load table to initial state
function load() {
	for (let i = 0; i < localStorage.length; i++) {
		let key = localStorage.key(i);
		let val = JSON.parse(localStorage.getItem(key.toString()));
		store[key] = val;
	}
	fillTable(store.orderHistory);
}

////////////////////////////////////////// CHARTS /////////////////////////////////////////////

////////// BAR //////////

//based on https://www.d3-graph-gallery.com/graph/barplot_stacked_basicWide.html
function makeBar() {

	let width = 750-100; 
	let height = 500-50;
	let axisLabelSpace = 20;
	var svg = d3.select("#barchartd3"); // select the element to place new HTML under
	svg.selectAll("*").remove(); // clear the previous HTML when updating chart
	let subgroups = ['Dingus','Widget']; // subgroups of each stacked columnn
	let groups = store.dates; // x axis labels

	// Add X axis
	let x = d3.scaleBand()
		.domain(groups)	//what to label x ticks
		.range([0, width-170]) //how many pixels to reserve to x axis
		.padding([0.2]) //space between columns, increase for more space
	svg.append("g") 
			.attr("class", "axis")
			.attr("transform", "translate(0," + (height-axisLabelSpace) + ")")
		.call(d3.axisBottom(x).tickSizeOuter(0));

	// Add label for x axis
	svg.append("text")     
			.attr("x", 245 )
			.attr("y", 490 )
		.style("text-anchor", "middle")
		.style("font-size", "17px")
		.text("Date");
		
	// Add Y axis
	// combine widgetdata with dingusdata to find total units sold per day
	let tmp1 = Object.values(store.totalQuantityPerDayD)
	let tmp2 = Object.values(store.totalQuantityPerDayW)
	let array = [tmp1,tmp2];
	// find the biggest y; this will let us scale y axis properly
	result = array.reduce((r, a) => a.map((b, i) => (r[i] || 0) + b), []);
	store.maxY = Math.max.apply(null,result);

	let y = d3.scaleLinear()
		.domain([0, store.maxY]) //what to label y ticks
		.range([height-axisLabelSpace, 70 ]); //first param is the bottom positioning, second param the top positioning
	svg.append("g")
		.attr("class", "axis")
		.call(d3.axisLeft(y));

	// Add label for y axis
	svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0-(axisLabelSpace*3.5))
        .attr("x",0-(height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Units Sold");
	
	let color = ['lightskyblue', 'slateblue'];
	let data = []

	// putting together order info on each date for d3.stack()
	// each list is indexed by the date (x tick mark)
	for (let date of store.dates) {
		let tmp = {};
		tmp['Date'] = date;
		tmp['Dingus'] = store.totalQuantityPerDayD[date];
		tmp['Widget'] = store.totalQuantityPerDayW[date];
		data.push(tmp);
	}

	let stackedData = d3.stack() //calculates y start and stop point for each subgroup
		.keys(subgroups)
		(data)

	// where the bars get made
	svg.append("g")
		.selectAll("g")
		// Entering in arrays of stackedData 
		.data(stackedData) 
		.enter().append("g")
			.attr("fill", function(d,i) { return color[i]; }) //getting color
			.selectAll("rect")
			// Entering the data within the arrays of stackedDate
			.data(function(d) { return d; })
			.enter().append("rect")
				.attr("x", function(d) { return x(d.data.Date); })
				.attr("y", function(d) { return y(d[1]); })
				.attr("height", function(d) { return y(d[0]) - y(d[1]); })
				.attr("width",x.bandwidth())

}


//////////////////////////////////////// PIE 
// based on https://www.d3-graph-gallery.com/graph/pie_basic.html
function makePie() {

	let height = 500;

	let radius = height / 2 - 50;
	let svg_pie = d3.select('#piechartd3');	// select under which element to put html
	let d = [store.dingusQuantity, store.widgetQuantity];
	let colors = ['lightskyblue', 'slateblue'];
	let data = d3.pie()(d); // calcualtes start angle and end angle for each datapoint
	let arcs = d3.arc().innerRadius(0).outerRadius(radius); //arc for each datapoint

	svg_pie.selectAll("*").remove();

	svg_pie
	.selectAll('mySlices')
	.data(data)
	.enter()
	.append('path')
		.attr('d', arcs)
		.attr('fill', function(d, i){ return(colors[i]) })  // annonymous function to select color for each datapoint read

	makePieLegend();
}

function makePieLegend() {

	let svg_pie_legend = d3.select('#pielegendd3');
	svg_pie_legend.selectAll("*").remove();

	let dingusPercent = svg_pie_legend
		.append('text')
			.text("Dingus " + ((store.dingusQuantity/store.totalQuantity)*100).toFixed(1)+ "%")
				.attr('class', 'lgndText')
				.attr('x', 445)
				.attr('y', 60)
				.attr('height', 15)
				.attr('width', 15)


	let widgetPercent = svg_pie_legend
	.append('text')
		.text("Widget " + ((store.widgetQuantity/store.totalQuantity)*100).toFixed(1) + "%")
			.attr('class', 'lgndText')
			.attr('x', 445)
			.attr('y', 85)
			.attr('height', 15)
			.attr('width', 15)
}


////////////////////////////////////////// ORDER FORM //////////////////////////////////////////

// once dingus or widget quantity fields are filled out: calculate total for widget or dingus and total for both
function updateTotal(quantity, dingus) {

	// if quantity is greater than 1 then enable order button
	if (quantity > 0) {
		document.getElementsByClassName("button-success pure-button")[0].disabled = false; 
	} 
	
	// some edge cases for inputs
	let d = document.getElementById("dingus").value;
	let w = document.getElementById("widget").value;
	
	let dingusTotal = 0;
	let widgetTotal = 0;

	// if quantity is from dingus field
	if (dingus==true) {
		dingusTotal = (quantity * DINGUS_PRICE).toFixed(2);
		document.getElementById("dtotal").value = dingusTotal;
		store.currDingusQuantity = Number(quantity);
	}
	// if quantity is from widget field
	if (dingus==false) {
		widgetTotal = (quantity * WIDGET_PRICE).toFixed(2);
		document.getElementById("wtotal").value = widgetTotal;
		store.currWidgetQuantity = Number(quantity);
	}
	// calculate total field
	let totalVal = Number(document.getElementById("dtotal").value) + Number(document.getElementById("wtotal").value);
	document.getElementById("total").value = totalVal.toFixed(2);

}

// once order button is hit: prepare array from order form to populate in table 
function prepOrder() {
	let d = new Date();
	let myDate =  (d.getDate() < 10 ? '0' : '') + d.getDate();
	let myMonth = (d.getMonth() < 10 ? '0' : '') + (d.getMonth() + 1);
	let myYear = d.getFullYear();
	store.currID += 1;
	
	//update global vars
	//myDate = Math.floor(Math.random() * 10);
	let fulldate = myMonth+'/'+myDate+'/'+myYear;
	let newOrder = [store.currID, fulldate, store.currDingusQuantity, store.currWidgetQuantity];
	store.orderHistory.push(newOrder);
	
	clearForm();
	fillTable([newOrder]);
	preserveTable();
}

//once cancel button is hit: replace user input with 0's
function clearForm() {
	store.currDingusQuantity = 0;
	store.currWidgetQuantity = 0;
	document.getElementById("dingus").value= 0;
	document.getElementById("dtotal").value= ZERO_FORMAT;
	document.getElementById("widget").value= 0;
	document.getElementById("wtotal").value= ZERO_FORMAT;
	document.getElementById("total").value= ZERO_FORMAT;
	document.getElementsByClassName("button-success pure-button")[0].disabled = true; 
}

////////////////////////////////////////// TABLE //////////////////////////////////////////

// fills table with values based on order form
function fillTable(arr) {
	// for every array in arr, add a row
	for (let i = 0; i < arr.length; i++) {
		let row = document.getElementById('OHBody').insertRow(-1); 
		// for every element, add a cell
		for (let j = 0; j < arr[i].length; j++) {
			let cell = row.insertCell(j);
			cell.innerHTML = arr[i][j];
			cell.classList.add('OHBodyVals'); // add class to HTML string
		}
		
		//updating some global variables
		store.dingusQuantity += Number(arr[i][arr[i].length-2]);
		store.widgetQuantity += Number(arr[i][arr[i].length-1]);

		// for the last cell (total cell) & compute total sales 
		let currDingusQuantity = arr[i][arr[i].length-2];
		let currWidgetQuantity = arr[i][arr[i].length-1]
		let rowTotal = (currDingusQuantity * DINGUS_PRICE) + (currWidgetQuantity * WIDGET_PRICE);
		let cell = row.insertCell(arr[i].length);
		cell.innerHTML = '<span id="moneysign">$</span>' + rowTotal.toFixed(2);
		cell.classList.add('OHBodyVals');
		
		///// update global vars
		store.total += Number(rowTotal);
		store.totalQuantity = store.dingusQuantity + store.widgetQuantity;
		
		// limit to only 7 most recent orders so makeBar() doesn't create bars for orders beyond that. 
		if (store.timesUpdated <= 7) { 
			// if store.dates doesnt already include date
			if (!store.dates.includes(arr[i][1])) {
				store.dates.push(arr[i][1]);
				store.totalQuantityPerDayD[arr[i][1]] = 0;
				store.totalQuantityPerDayW[arr[i][1]] = 0;
			}
			// in case there is no value yet for date, set value
			if (isNaN(store.totalQuantityPerDayD[arr[i][1]])) {
				store.totalQuantityPerDayD[arr[i][1]] = Number(arr[i][2]);
				store.timesUpdated +=1;
			// otherwise ADD value
			} else {
				store.totalQuantityPerDayD[arr[i][1]] = Number(store.totalQuantityPerDayD[arr[i][1]])+Number(arr[i][2]);
				store.timesUpdated +=1;
			}
			if (isNaN(store.totalQuantityPerDayW[arr[i][1]])) {
				store.totalQuantityPerDayW[arr[i][1]] = Number(arr[i][3]);
			} else {
				store.totalQuantityPerDayW[arr[i][1]] = Number(store.totalQuantityPerDayW[arr[i][1]])+Number(arr[i][3]);
			}
		}
		
		
	}

	updateScoreboard([store.dingusQuantity, store.widgetQuantity, store.total]);
	makePie();
	makeBar();
}

////////////////////////////////////////// SCOREBOARD //////////////////////////////////////////

// update scoreboard based on array outputted from filltable()
function updateScoreboard(entries) {
	document.getElementById('dingusval').innerHTML = entries[0];
	document.getElementById('widgetval').innerHTML = entries[1];
	document.getElementById('salesval').innerHTML = '<span id="moneysign">$</span>' + entries[2].toFixed(2);
}

////////////////////////////////////////// PRESERVING DATA //////////////////////////////////////////

// preserve data in table; courtesy of w3schools
function preserveTable() {
	// Check browser support
	if (typeof(Storage) !== "undefined") {
		// Store
		localStorage.setItem("orderHistory", JSON.stringify(store.orderHistory));
		// Retrieve
		localStorage.setItem("currID", JSON.stringify(store.currID));
	  } else {
		alert("Sorry, there is a problem with your browser!");
	}
}

load();