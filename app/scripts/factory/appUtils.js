
/**
 * description: It contains utility functions which is used through out the client side app.
 */
angular.module('angularTestApp').factory('appUtils',["$http",function ($http) {
    var utility={
        "dateUtility":{
            "defaultDateFormatTo":"ddmmyyyy",
            "defaultDateFormatFrom":"ddmmyyyy",
            "defaultDateSeperator":"/",
            "zeroPad":function(num){
                return num<10?"0"+num:num; //appends zero to numbers less than 10 in dates
            },
            "dd":function (date) {
                return utility.dateUtility.zeroPad(date.getDate()); //date day
            },
            "mm":function (date) {
                return utility.dateUtility.zeroPad(date.getMonth()+1); //date month
            },
            "yyyy":function (date) {
                return date.getFullYear(); // date year
            },
            /*
             * @param convertFormat:string
             * @param seperator: string seperator e.g / or - etc.
             * @param date:Date/number
             * @return date string
             * @desc:converts date as per given format
             */
            "convertDate":function(convertFormat,seperator,date){
                var result="";
                switch (convertFormat){
                    case 'timestampTommddyyyy':
                        result= utility.dateUtility.mm(date) + seperator +  utility.dateUtility.dd(date) + seperator + utility.dateUtility.yyyy(date);
                        return result;
                        break;
                    case 'timestampToddmmyyyy':
                        result= utility.dateUtility.dd(date) + seperator + utility.dateUtility.mm(date) + seperator + utility.dateUtility.yyyy(date);
                        return result;
                        break;
                    case 'timestampToyyyymmdd':
                        date=new Date(date);
                        result= utility.dateUtility.yyyy(date) + seperator + utility.dateUtility.mm(date) + seperator + utility.dateUtility.dd(date);
                        return result;
                        break;
                    case 'ddmmyyyyTommddyyyy':
                        result= utility.dateUtility.mm(date) + seperator +  utility.dateUtility.dd(date) + seperator + utility.dateUtility.yyyy(date);
                        return result;
                        break;
                }
            },
            /*
             * @param dateValue:string
             * @param delimiter: string seperator e.g / or - etc.
             * @desc:converts ddmmyyyy string date to js Date
             * @return js date
             */
            'ddmmyyyyStrToDate':function (dateValue,delimiter){
                var dateValueArr=dateValue.split(" ");
                var del=delimiter ||"/";
                var returnDate=null;
                if(dateValueArr && dateValueArr.length>0){
                    var dateValue1=dateValueArr[0];
                    var dateValue1Arr1=dateValue1.split(del);
                    var day,month,year;
                    dateValue1Arr1.length>0?day=parseInt(dateValue1Arr1[0]):NaN;
                    dateValue1Arr1.length>1?month=parseInt(dateValue1Arr1[1]):NaN;
                    dateValue1Arr1.length>2?year=parseInt(dateValue1Arr1[2]):NaN;
                    month--;
                    var hrs=0,mins=0,secs=0;
                    if(dateValueArr.length>1 && dateValueArr[1].length>1){
                        var timeArr=dateValueArr[1].split(":");
                        timeArr.length>0?hrs=timeArr[0]:0;
                        timeArr.length>1?mins=timeArr[1]:0;
                        timeArr.length>2?secs=timeArr[2]:0;
                    }
                    if(day!=NaN && month!=NaN && year!=NaN){
                        var returnDate=new Date(Date.UTC(year, month, day, hrs, mins, secs));
                    }
                }
                return returnDate;
            },
            'validateDateRange':function(startDateStr,endDateStr){
                var startTimeStamp=Number(utility.dateUtility.ddmmyyyyStrToDate(startDateStr));
                var endTimeStamp=Number(utility.dateUtility.ddmmyyyyStrToDate(endDateStr));
                if(startTimeStamp && startTimeStamp && typeof(startTimeStamp)=='number' && typeof(endTimeStamp)=='number' && startTimeStamp<=endTimeStamp){
                    return true;
                }else{
                    return false
                }
            },
            'validateDateRangeStamp':function(startDateStr,endDateStr){
                var startTimeStamp=Date.parse(startDateStr);
                var endTimeStamp=Date.parse(endDateStr);
                if(startTimeStamp && startTimeStamp && typeof(startTimeStamp)=='number' && typeof(endTimeStamp)=='number' && startTimeStamp<=endTimeStamp){
                    return true;
                }else{
                    return false
                }
            },
            /*
             * @param dateValue:string
             * @param delimiter: string seperator e.g / or - etc.
             * @desc:converts yyyymmdd string date to js Date
             * @return js date
             */
            'yyyymmddStrToDate':function (dateValue,delimiter){
                var dateValueArr=dateValue.split(" ");
                var del=delimiter ||"/";
                var returnDate=null;
                if(dateValueArr && dateValueArr.length>0){
                    var dateValue1=dateValueArr[0];
                    var dateValue1Arr=dateValue1.split(delimiter);
                    var day,month,year;
                    dateValue1Arr.length>0?year=parseInt(dateValue1Arr[0]):NaN;
                    dateValue1Arr.length>1?month=parseInt(dateValue1Arr[1]):NaN;
                    dateValue1Arr.length>2?day=parseInt(dateValue1Arr[2]):NaN;
                    month--;
                    var hrs=0,mins=0,secs=0;
                    if(dateValueArr.length>1 && dateValueArr[1].length>1){
                        var timeArr=dateValueArr[1].split(":");
                        timeArr.length>0?hrs=timeArr[0]:0;
                        timeArr.length>1?mins=timeArr[1]:0;
                        timeArr.length>2?secs=timeArr[2]:0;
                    }
                    if(day!=NaN && month!=NaN && year!=NaN){
                        var returnDate=new Date(Date.UTC(year, month, day, hrs, mins, secs));
                    }
                }
                return returnDate;
            }

        },
        /*
         * @param obj:Object
         * @return  Object
         * desc: makes clone of any type of js object
         */
        "cloneJSObj":function (obj) {
            // Handle the 3 simple types, and null or undefined
            if (null == obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                var copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                var copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = utility.cloneJSObj(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                var copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = utility.cloneJSObj(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        },
        /*
         * desc: Utility methods to support cross browser issues
         */
        "downloadFileUtil":{
            /*
             * @param sUrl:string
             * desc: takes path of the file to be downloaded and downloads that file
             */
            "downloadFile":function (sUrl) {

                //iOS devices do not support downloading. We have to inform user about this.
                if (/(iP)/g.test(navigator.userAgent)) {
                    alert('Your device does not support files downloading. Please try again in desktop browser.');
                    return false;
                }

                //If in Chrome or Safari - download via virtual link click
                if (utility.downloadFileUtil.isChrome || utility.downloadFileUtil.isSafari) {
                    //Creating new link node.
                    var link = document.createElement('a');
                    link.href = sUrl;

                    if (link.download !== undefined) {
                        //Set HTML5 download attribute. This will prevent file from opening if supported.
                        var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
                        link.download = fileName;
                    }

                    //Dispatching click event.
                    if (document.createEvent) {
                        var e = document.createEvent('MouseEvents');
                        e.initEvent('click', true, true);
                        link.dispatchEvent(e);
                        return true;
                    }
                }

                // Force file download (whether supported by server).
                sUrl += '?download';

                window.open(sUrl, '_self');
                return true;
            },
            "isChrome":function(){
                return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            },
            "isSafari":function(){
                return navigator.userAgent.toLowerCase().indexOf('safari') > -1;
            }
        },
        /*
         * @param response:Object
         * @param callback:function
         * desc: Used to parse response and show error if any. It should be used as to work with any $http response
         */
        "defaultParseResponse":function(response,callback){
            if(!response.error){
                callback(response);
            }else{
                $('#errorModal').find('.modal-body').html(response.errorMsg);
                $('#errorModal').modal('show');
                return;
            }
        },
        "showError":function(msg){
            $('#errorModal').find('.modal-body').html(msg);
            $('#errorModal').modal('show');
            return;
        },
        "showWarning":function(msg){
            $('#warningModal').find('.modal-body').html(msg);
            $('#warningModal').modal('show');
            return;
        },
        "showSuccess":function(msg){
            $('#successModal').find('.modal-body').html(msg);
            $('#successModal').modal('show');
            return;
        },
        "uploadCSV":function(element,url,callback){
            console.log("app Util uploadCSV",element,url);
            var file = element.files[0];
            if(!file){
                $(element).val("");
                appUtils.showError("Please choose a .csv file.");
                return;
            }
            var fileName = file.name;
            var check = file.name.indexOf("csv");
            if (check < 0) {
                $(thisObj).val("");
                utility.showError("Please choose a .csv file.");
                return;
            }else{
                //Take the first selected file
                var uploadCSV = new FormData();
                uploadCSV.append("upload", file);
                $http.post(url, uploadCSV, {
                    withCredentials: true,
                    headers: {'Content-Type': undefined },
                    transformRequest: angular.identity
                }).success(function(dataResponse,status,headers,config){
                    //success
                    utility.defaultParseResponse(dataResponse,callback);
                }).error(function(data,status,headers,config){
                    //error
                    console.log("Error",data,status,headers,config);

                });

            }

        },
        "lovMapToArr":function(map){
            var arr=[];
            for(var key in map){
                var obj=map[key];
                if(typeof obj=='object'){
                    obj.key=key;
                    arr.push(obj);
                }
            }
            return arr;
        },
        'validateEmail':function (email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
};

    return utility;
}]);
