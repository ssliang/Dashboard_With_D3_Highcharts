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

function makeBar() {

    let clrs = ['lightskyblue', 'slateblue'];

    Highcharts.chart('bar', {

        chart: {
            type: 'column',
            reflow: true
        },
        colors: clrs,
        title: {
            text: 'Sales Per Day',
            margin: 50,
            style: {
                fontWeight: 'bold',
                fontSize: '1.5vw'
            }
        },
        subtitle: {
            text: 'Dingus vs. Widget: Units of each product sold per date',
            style: {
                fontWeight: 'normal',
                fontSize: '1.2vw',
                color: '#585858'
            }
        },
        legend: {
            itemMarginBottom: 2,
            itemStyle: {
                fontSize: '1.1vw',
            }
        },
        xAxis: {
            categories: store.dates,
            title: {
                text: 'Date',
                offset: 25,
                style: {
                    color: '#585858', 
                    fontSize: '1.2vw',
                }
            },
            labels: {
                style: {
                    color: '#585858', 
                    fontSize: '1.1vw',
                }
            }
        },
        yAxis: {
            allowDecimals: false,
            min: 0,
            title: {
                text: 'Units Sold',
                offset: 45,
                style: {
                    color: '#585858', 
                    fontSize: '1.2vw'
                }
            },
            labels: {
                style: {
                    color: '#585858', 
                    fontSize: '1.1vw'
                }
            }
        },
        tooltip: {
            formatter: function () {
                return '<b>' + this.x + '</b><br/>' +
                    this.series.name + ': ' + this.y + '<br/>' +
                    'Total: ' + this.point.stackTotal;
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal'
            }
        },
        series: [{
            name: 'Dingus Sold',
            data: Object.values(store.totalQuantityPerDayD),
            stack: 'Total Sold'
        }, {
            name: 'Widget Sold',
            data: Object.values(store.totalQuantityPerDayW),
            stack: 'Total Sold'
        }]
    });
}


//////////////////////////////////////// PIE 
function makePie() {

    let clrs = ['lightskyblue', 'slateblue'];

    Highcharts.chart('pie', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie',
            reflow: true
        },
        legend: {
            reflow: true
        },
        title: {
            text: 'Total Sales Breakdown',
            style: {
                fontWeight: 'bold',
                fontSize: '1.5vw'
            }
        },
        subtitle: {
            text: 'Dingus vs. Widget: Proportion of each product sold overall',
            style: {
                fontWeight: 'normal',
                fontSize: '1.2vw',
            }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                colors: clrs,
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    color: '#585858'
                }
            }
        },
        series: [{
            name: 'Products',
            colorByPoint: true,
            dataLabels: {
                style: {
                    fontSize: '1.1vw',
                    fontWeight: 'normal'
                }
            },
            data: [{
                name: 'Dingus',
                y: store.dingusQuantity,
            }, {
                name: 'Widget',
                y: store.widgetQuantity
            }]
        }]
    });
	
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