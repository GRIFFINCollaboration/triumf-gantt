## triumf-gantt

A simple webpage to ingest TRIUMF MIS's csv calendars, and render them in a legible, printable html table.

### Usage

Calendars can be searched by date range or schedule number, and filtered by revision tag via the inline UI; the same querys can be made via the URL's query string, with the following parameters:

 - `start`: YYYY-MM-DD: start date of schedule
 - `end`: YYYY-MM-DD: end date of schedule
 - `schedule`: number: schedule number
 - `revision`: string: revision tag

**Note that a query string date range takes precedence.** If a valid date range is found in the query string, that will be the date range returned, regardless of whatever schedule number is or is not present.

### Dependencies

In addition to [papaparse](http://papaparse.com/), [bootstrap](http://getbootstrap.com/) and [html2canvas](https://html2canvas.hertzen.com/), this app relies on the [http://alloworigin.com](http://alloworigin.com) service to proxy MIS's CSV response so it can be ingested by a web app. If this app ever stops working, checking if alloworigin is still up should be the first thing checked! In the long term, it would be better to convince MIS to put [CORS headers](http://enable-cors.org/) on their CSV responses, so we can ingest them directly.