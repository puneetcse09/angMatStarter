var log4js = require('log4js');
var dateUtil = require("../../common/Utils/DateUtils.js");

var date = new Date();
var today=date.getFullYear()+""+(date.getMonth()+1)+""+date.getDate()+"_"+date.getHours()+""+date.getMinutes()+""+date.getSeconds();

var logDate = dateUtil.formatDate(date, 'yyyyMMMdd_hhmmss');
//var LOG_PATH = "C:/puneetsh/EM_DEV/EM/log/emServer_"+logDate+".log";

var LOG_PATH="../logs/emServer_"+logDate+".log"
	
var APP_CATEGORY = "EM"
var LOG_TYPE="DEBUG";

log4js.configure({
	appenders : [ 
		 {
		type : 'file',
		filename : LOG_PATH,
		category : APP_CATEGORY,
		maxLogSize: 20480,
        backups: 10
	} ]
});

var logger = log4js.getLogger(APP_CATEGORY);


logger.setLevel(LOG_TYPE);

Object.defineProperty(exports, "LOG", {
	value : logger
});