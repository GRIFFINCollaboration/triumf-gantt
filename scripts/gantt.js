////////////////////
// data munging
////////////////////

function processGantt(textCSV){
    document.getElementById('gantt').innerHTML = '';

    Papa.parse(textCSV, {
        skipEmptyLines: true,
        complete: function(results) {
            // munge and report data once it has arrived

            var nRows = Math.max.apply(null,results.data.map(function(o){return o.length;})),
                i,j, row,cell,span,next, experiment;

            // insert all table rows
            setupTable('gantt', nRows);

            // scrub raw data
            results.data = noJagged(results.data, nRows); // in case any days are missing entries, add dummies on the bottom
            results.data = massageDate(results.data); // break out date

            // add all cells with appropriate spans
            for(i=0; i<results.data.length; i++){        
                for(j=0; j<results.data[i].length; j++){

                    span = 1;
                    if(results.data[i][j]){
                        // don't add a cell if it's been delt with in a previous span
                        if(i>0 && results.data[i][j] == results.data[i-1][j])
                            continue;

                        // look ahead to see if this cell should span multiple columns        
                        while(i+span<results.data.length && results.data[i][j] == results.data[i+span][j]){
                            span++;
                        }
                    }

                    // set up cell
                    row = document.getElementById('row'+j);
                    cell = document.createElement('td');
                    cell.innerHTML = results.data[i][j];
                    cell.setAttribute('colspan', span);

                    // figure out cell class
                    // weekends
                    if(results.data[i][2] && span<=2 && (results.data[i][2].slice(0,3) === 'Sat' || results.data[i][2].slice(0,3) === 'Sun')){
                        cell.classList.add('weekend');
                    }
                    // experiment indices associated with facilities or yield
                    if(results.data[i][j] && results.data[i][j+1] && results.data[i][j].search(RegExp('^[A-Za-z][0-9]+', 'gm'))===0){
                        experiment = results.data[i][j+1].split(' ')[0].toLowerCase();

                        if(dataStore.experiments.indexOf(experiment) != -1){
                            cell.classList.add('experiment-index');
                        } else if(experiment === 'yield'){
                            cell.classList.add('yield');
                        }
                    }
                    // all classes that can be determined from the cell in question alone
                    cell = chooseClass(cell);
                    
                    row.appendChild(cell);
                }
            }
            // prepare to save the canvas
            html2canvas(document.getElementById('gantt')).then(function(canvas) {
                var dl = document.getElementById('imageDL')

                dl.href = canvas.toDataURL();
                dl.classList.remove('disabled');
                dl.innerHTML = 'Download Chart';
            });
        }
    });
}

function noJagged(data, length){
    //insist each row in data be at least length entries long

    var i, j, padding;

    for(i=0; i<data.length; i++){
        if(data[i].length < length){
            padding = [];
            for(j=0; j<length-data[i].length; j++)
                padding.push(null);
            data[i] = data[i].concat(padding);
        }
    }

    return data
}

function massageDate(data){
    // take the parsed csv and rearrange the date information to have separate entries for year, month and day. 

    // break date into year / month / day
    data[0] = ['Year', 'Month', 'Day', 'Shift'].concat(data[0].slice(2));
    data[1] = [null, null, null, null].concat(data[1].slice(2));
    for(i=2; i<data.length; i++){
        data[i] = parseDate(data[i][0]).concat(data[i].slice(1));
    }

    return data;
}

function parseDate(date){
    // take a 1999-12-31 style date, and split it into [1999, 'December', 'Tues-31']
    // returns ['', '', ''] if data is null

    var parsed, d;

    if(!date){
        return ['', '', ''];
    }

    parsed = date.split('-');
    d = new Date( parseInt(parsed[0],10), parseInt(parsed[1],10)-1, parseInt(parsed[2],10) );
    parsed[1] = dataStore.months[parseInt(parsed[1], 10)-1];
    parsed[2] = dataStore.days[d.getDay()] + '-' + parsed[2];

    return parsed;
}

////////////////////////////
// table & html munging
////////////////////////////

function setupTable(tableID, nRows){
    // fill tableID <table> element with nRows <tr> elements, id'ed as row[i]

    var i, row,
        table = document.getElementById(tableID);

    // extra two rows since date->year+month+day
    for(i=0; i<nRows+2; i++){
        row = document.createElement('tr');
        row.setAttribute('id', 'row'+i);
        table.appendChild(row);
    }
}

function chooseClass(cell){
    // given a td element, decide what css class should be applied.

    var className;

    if(dataStore.months.indexOf(cell.innerHTML) !== -1){
        className = cell.innerHTML.toLowerCase();
    } else if(cell.innerHTML.trim() === 'AM' || cell.innerHTML.trim() === 'PM'){
        className = cell.innerHTML.toLowerCase();
    } else if(cell.innerHTML.toLowerCase().trim() === 'maint' || cell.innerHTML.toLowerCase().trim() === 'maintenance'){
        className = 'maint';
    } else if(cell.innerHTML.toLowerCase().trim() === 'setup'){
        className = 'setup';
    } else if(cell.innerHTML.toLowerCase().trim() === 'startup' || cell.innerHTML.toLowerCase().trim() === 'start-up'){
        className = 'startup';
    } else if(cell.innerHTML.toLowerCase().trim() === 'yield'){
        className = 'yield';
    } else if(cell.innerHTML.toLowerCase().trim() === 'beam development'){
        className = 'beam-dev';
    } else if(cell.innerHTML.indexOf('TIGRESS')!=-1){
        className = 'tigress';
    } else if(cell.innerHTML.indexOf('DSL')!=-1){
        className = 'dsl';
    } else if(cell.innerHTML.indexOf('GRIFFIN')!=-1){
        className = 'griffin';
    } else if(cell.innerHTML.indexOf('IRIS')!=-1){
        className = 'iris';
    } 

    cell.classList.add(className);
    return cell;
}

/////////////////////////////////////
// redirects & data fetching
/////////////////////////////////////

function redirectDaterange(){
    // redirect to the query string with the specified dates

    if(!document.getElementById('date-start').validity.valid || !document.getElementById('date-end').validity.valid)
        return;

    var start = document.getElementById('date-start').value,
        end   = document.getElementById('date-end').value,
        revision = document.getElementById('revision-tag').value,
        query = `?start=${start}&end=${end}`

    if(typeof(revision)=='string' && revision.length>0)
        query += `&revision=${revision}`;

    window.location = query;

}

function redirectSchedule(){
    // redirect to the query string with the specified schedule number

    if(!document.getElementById('schedule-number').validity.valid)
        return;

    var schedule = document.getElementById('schedule-number').value,
        revision = document.getElementById('revision-tag').value,
        query = `?schedule=${schedule}`

    if(typeof(revision)=='string' && revision.length>0)
        query += `&revision=${revision}`;

    window.location = query;

}

////////////////
// helpers
////////////////

function reload(){
    location.reload();
}

function getParameterByName(name) {
    // get a parameter out of the query string
    // thanks http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

///////////////////////
// global datastore
///////////////////////

dataStore = {
    'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'days': ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    'experiments': ['tigress', 'griffin', 'iris', 'dsl']
}