var request = require("request"),
	schedule = require("node-schedule"),
	config = require("./config.json"),
	mailgun = require("mailgun-js")({apiKey: config.mailgunKey, domain: config.mailgunDomain}),
	fs = require("fs");

var j = schedule.scheduleJob('0 0 0,12 * *', function(){
	// send request
	var caseNumber = config.caseNumber;
	var url = "https://icert.doleta.gov/index.cfm?event=ehRegister.caseStatusSearchGridData&caseNumberList="
		+ caseNumber + "&page=1&rows=10&sidx=case_number&sord=asc&nd=1428902731768&_search=false";
	request({
		"url": url,
		"json": true
	}, function(err, res, body) {
		if (err) {
			console.log(err);
		}
		else {
			// read old result
			var oldResult = JSON.parse(fs.readFileSync("result.json", "utf8"));
			var oldRows = oldResult.rows ? oldResult.rows.length : 0;

			if (body.rows && body.rows.length > oldRows) {
				console.log("visa status updated! " + new Date().toISOString());

				// update old result
				fs.writeFileSync("result.json", JSON.stringify(body, null, 4), "utf8");

				// send email
				mailgun.messages().send({
					from: "Visa Status Checker <" + config.senderEmail + ">",
					to: config.receiverEmail,
					subject: config.emailSubject,
					text: JSON.stringify(body.rows, null, 4)
				}, function (err, body) {
					if (err) {
						console.log(err);
					} else {
						console.log(body);
					}
				});
			}
		}
	});
});