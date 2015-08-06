/**
 * Created by Pinki Boora on 5/24/14.
 */

var Utils = require("../../common/Utils/Utils.js");
var UserClassModel=require("../../manageUsers/models/UserClass.js");
var userDetail=new UserClassModel();
var db=Utils.getDBInstance();
var location=require("../../common/models/countryStateCity.js");
var religion=require("../../common/models/religion.js")
var languages=require("../../common/models/language.js")
var Image=require("../../common/models/Image.js")
var UserDAB=require("./UserDAB.js")
var Query = require("../../common/generic/Query.js");
var userQueryRepository = require("../models/usersQueryRepository.js");
console.log("db", db);
var logHandler = require("../../common/Utils/Logger.js"); 
var log=logHandler.LOG;

/*
 * Register New User functionality
 */

function addNewUser(userObj,loggedInUser,res) {
	log.info("@@@@@ ::::: User.addNewUser : ENTER. ");
    try{

    	var responseObj = new Utils.Response();
        var defaultErrorMsg="Failed to add user. Please contact administrator.";

        var findUserQuery = 'MATCH (n:User{userName:"' + userObj.basicDetails.userName + '"})  RETURN n';

        db.cypherQuery(findUserQuery, function(err, result) {
            console.log("findUserQuery",err, result)
            if(err || !result || (result && result.data && result.data.length==0)){
                var userBasicDetails=fillUserDefaultValues(userObj.basicDetails);
                var imgObj=new Image(loggedInUser.basicDetails.userName);
                imgObj.image=userBasicDetails.profileImagePath;
                
                var startDt=Date.parse(userBasicDetails.startDate);
                (startDt && !isNaN(startDt))?userBasicDetails.startDate=startDt:"";
                
                var endDt=Date.parse(userBasicDetails.endDate);
                (endDt && !isNaN(endDt))?userBasicDetails.endDate=endDt:"";
                
                delete userBasicDetails.profileImagePath;
                delete userBasicDetails._id;
                delete userObj.contact._id;
                delete userObj.primaryAddress._id;
                delete userObj.secondaryAddress._id;
                delete userObj.socialNetwork._id;
                var dataResolver={
                    "School":loggedInUser.schoolDetails,
                    'User':userBasicDetails,
                    "Contact":userObj.contact,
                    "PrimaryAddress":userObj.primaryAddress,
                    "SecondaryAddress":userObj.secondaryAddress,
                    "SocialNetwork":userObj.socialNetwork,
                    "Image":imgObj
                }
                var queryConfig=UserDAB.addUser();
                var queryObj=Query(queryConfig,dataResolver);
                console.log("add new user queryObj",queryObj);
                if(!queryObj.error){
                    db.cypherQuery(queryObj.responseData,function(err,reply){
                        console.log("add new user",err,reply);
                        if(reply && reply.data.length>0){
                            var addUser=reply.data;
                            if(userObj.hasOwnProperty('userClass') && userObj.basicDetails.userType==(loggedInUser.schoolDetails.schoolId+'||1')){
                                delete userObj.userClass._id;
                                var dataResolver={
                                    "School":loggedInUser.schoolDetails,
                                    'User':reply.data[0][0],
                                    "Class":userObj.userClass
                                }
                                var queryConfig=UserDAB.assocateClass();
                                var queryObj=Query(queryConfig,dataResolver);
                                console.log("queryObj class",queryObj);
                                if(!queryObj.error){
                                    db.cypherQuery(queryObj.responseData,function(err,reply){
                                        if(reply && reply.data.length>0){
                                            responseObj.responseData=addUser;
                                            res.json(responseObj);
                                        }else{
                                            Utils.defaultErrorResponse(res,"Failed to associate class to user.");
                                        }
                                    });
                                }else{
                                    Utils.defaultErrorResponse(res,"Failed to associate class to user.");
                                }
                            }else{
                                responseObj.responseData=addUser;
                                res.json(responseObj);
                            }
                        }else{
                            Utils.defaultErrorResponse(res,defaultErrorMsg);
                        }
                    });
                }else{
                    Utils.defaultErrorResponse(res,defaultErrorMsg);
                }

            }else{
                Utils.defaultErrorResponse(res,defaultErrorMsg);
            }
        });//findUserQuery end
    }catch(e){
        console.log("addNewUser",e);
        log.error("@@@@@ ::::: User.addNewUser : ERROR. ",e);
        Utils.defaultErrorResponse(res,defaultErrorMsg);
    }
    log.info("@@@@@ ::::: User.addNewUser : EXIT. ");
}
module.exports.addNewUser=addNewUser;
function fillUserDefaultValues(userBasicDetails){
    var currentTimestamp=(new Date()).getTime();
    userBasicDetails.updatedAt=currentTimestamp;
    userBasicDetails.createdAt=currentTimestamp;
    userBasicDetails.hashPassword="password";
    userBasicDetails.softDelete=false;
    
    var dob=Date.parse(userBasicDetails.DOB);
    (dob && !isNaN(dob))?userBasicDetails.DOB=dob:"";
    
    
    return userBasicDetails;
}

/*
 * Update User details
 */
module.exports.updateUser = function(userObj,userImage,loggedInUser,res) {
	log.info("@@@@@ ::::: User.updateUser : ENTER. ");
	  try{
	        var responseObj = new Utils.Response();
	        var defaultErrorMsg="Failed to update user. Please contact administrator.";
	        userObj.basicDetails.profileImagePath='';
	        var imgObj=new Image(loggedInUser.basicDetails.userName);
	        var findUserQuery = 'MATCH (n:User{userName:"' + userObj.basicDetails.userName + '"})  RETURN n';
	        var findImageQuery='match (i:Image) -[r1:IMAGE_OF]->(u:User{userName:"'+userObj.basicDetails.userName+'"}) return i';
	        db.cypherQuery(findUserQuery, function(err, result) {
	            console.log("findUserQuery",err, result)
	            if(err || !result || (result && result.data && result.data.length==1)){
                    var currentTimestamp=(new Date()).getTime();
                    userObj.basicDetails.updatedAt=currentTimestamp;
                    userObj.basicDetails.updatedBy=loggedInUser.basicDetails.userName;
                    
                    var dob=Date.parse( userObj.basicDetails.DOB);
                    (dob && !isNaN(dob))? userObj.basicDetails.DOB=dob:"";
                    
                    var startDt=Date.parse( userObj.basicDetails.startDate);
                    (startDt && !isNaN(startDt))? userObj.basicDetails.startDate=startDt:"";
                    
                    var endDt=Date.parse( userObj.basicDetails.endDate);
                    (endDt && !isNaN(endDt))? userObj.basicDetails.endDate=endDt:"";
                    
                    db.updateNode(userObj.basicDetails._id, userObj.basicDetails, function(err, node){
                        if(err) throw err;
                        node === true?console.log("basic details updated"):console.log("Failed to update basic details");
                    });
                    db.updateNode(userObj.contact._id, userObj.contact, function(err, node){
                        if(err) throw err;
                        node === true?console.log("contact details updated"):console.log("Failed to update contact details");
                    });
                    db.updateNode(userObj.primaryAddress._id, userObj.primaryAddress, function(err, node){
                        if(err) throw err;
                        node === true?console.log("primaryAddress details updated"):console.log("Failed to update primaryAddress details");
                    });
                    db.updateNode(userObj.secondaryAddress._id, userObj.secondaryAddress, function(err, node){
                        if(err) throw err;
                        node === true?console.log("secondaryAddress details updated"):console.log("Failed to update secondaryAddress details");
                    });
                    if(userImage!='' || userImage!=null){
                    	 db.cypherQuery(findImageQuery, function(err, result) {
                             console.log("findImageQuery : ",findImageQuery, err, result,"result.data[0].length : ",result.data[0].length);
                             if(result && result.data[0] && result.data[0].hasOwnProperty('_id')
//                             && result.data[0].length>0
                             ){
	//                            	 console.log("userImage : !@#!@#!@#!@#!@# :",userImage);
	//                            	 console.log("result :#$%#$% : ",result.data[0],result.data[0]._id);
	                            	 result.data[0].image=userImage;
	                            	 db.updateNode(result.data[0]._id, result.data[0], function(err, node){
	                                 if(err) throw err;
	                                 node === true?console.log("userImage details updated"):console.log("Failed to update userImage details");
                             	});
                             }
                             else{
                            	 imgObj.image=userImage;
                            	 db.insertNode(imgObj, ["Image"], function(errImageAdd, addImageReply) {
                                     console.log("create Image node", err,addImageReply);
                                     if (!errImageAdd && addImageReply.hasOwnProperty('_id')) {
                                             var imageNodID=addImageReply._id;
                                             
                                             db.insertRelationship(imageNodID,userObj.basicDetails._id,"IMAGE_OF",{},function(errUserImage,resultRel){
                                                 console.log("associate Image to User",errUserImage,resultRel);
                                                 if(errUserImage){
                                                	  Utils.defaultErrorResponse(res,"Failed to update userImage relationship to User.");
                                                 }
//                                                 else{
//                                                 }
                                             });
                                     }else{
                                         Utils.defaultErrorResponse(res,"Failed to Insert userImage");
                                     }
                                 });
                            }
                         });
                    }
                    db.updateNode(userObj.socialNetwork._id, userObj.socialNetwork, function(err, node){
                        if(err) throw err;
                        node === true?console.log("socialNetwork details updated"):console.log("Failed to update socialNetwork details");
                        res.json(responseObj)
                    });
	            }else{
	                Utils.defaultErrorResponse(res,defaultErrorMsg);
	            }
	        });//findUserQuery end
	    }catch(e){
	        console.log("updateUser",e);
	        log.error("@@@@@ ::::: User.updateUser : ERROR : ",e);
	        Utils.defaultErrorResponse(res,defaultErrorMsg);
	    }
	    log.info("@@@@@ ::::: User.updateUser : EXIT. ");
}

/*
 * Delete User details
 */
module.exports.deleteUser = function(userObj,loggedInUser,res) {
	log.info("@@@@@ ::::: User.deleteUser : ENTER. ");
	  try{
	        var responseObj = new Utils.Response();
	        var defaultErrorMsg="Failed to update user. Please contact administrator.";
	        
	        var findUserQuery = 'MATCH (n:User{userName:"' + userObj.basicDetails.userName + '"})  RETURN n';
	        var deleteQuery='MATCH (n:User{userName:"' + userObj.basicDetails.userName + '"}) set n.softDelete =true return n';
	        
	        console.log("findUserQuery : ", findUserQuery);
	        console.log("deleteUser : ", deleteQuery);

	        db.cypherQuery(findUserQuery, function(err, result) {
	            console.log("findUserQuery",err, result)
	            if(!err && result && result.data && result.data.length==1){
                    var currentTimestamp=(new Date()).getTime();
                    userObj.basicDetails.updatedAt=currentTimestamp;
                    userObj.basicDetails.updatedBy=loggedInUser.basicDetails.userName;

                    db.cypherQuery(deleteQuery, function(err, reply) {
                        console.log("deleteQuery err, reply",err, reply)
                    	if (!err) {
                			responseObj.responseData = reply;
                			res.json(responseObj);
                		} else {
                			responseObj.error = true;
                			responseObj.errorMsg = "No Data found.";
                			res.json(responseObj);
                		}	
                    });
	            }else{
	                Utils.defaultErrorResponse(res,defaultErrorMsg);
	            }
	        });//findUserQuery end
	    }catch(e){
	        console.log("deleteUser",e);
	        log.error("@@@@@ ::::: User.deleteUser : EXIT :",e);
	        Utils.defaultErrorResponse(res,defaultErrorMsg);
	    }
	    log.info("@@@@@ ::::: User.deleteUser : EXIT. ");
}
/* Get all Users from USER */
module.exports.getAllUsers = function(loggedInUser, res) {
	log.info("@@@@@ ::::: User.getAllUsers : ENTER.");
	var schoolId=loggedInUser.schoolDetails.schoolId;
//	var queryAllUsers='match (n:School)-[r1:BELONGS_TO]->(u:User) where n.schoolId="'+schoolId+'" and u.softDelete=false return n,u order by u.updatedAt desc';
	//var queryAllUsers = "MATCH (school:School{schoolId{}})(n:User) RETURN n LIMIT 50";
    var queryAllUsers= "MATCH (n:School)<-[r1:USER_OF]-(u:User) where n.schoolId='"+schoolId+"' and u.softDelete=false return u,n order by u.userName ASC LIMIT 20";
	console.log("queryAllUsers",queryAllUsers);
    var responseObj = new Utils.Response();
	db.cypherQuery(queryAllUsers, function(err, reply) {
		console.log(err);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
//	console.log("\n loggedInUser.basicDetails.userType :-------> ", loggedInUser.basicDetails.userType.split("||")[0]);
	log.info("@@@@@ ::::: User.getAllUsers : EXIT.");
}

module.exports.allUserWithPage = function(res,searchObj,schoolId,classObj){
	log.info("@@@@@ ::::: User.allUserWithPage : ENTER.");
    console.log("allUserWithPage  ----> ",searchObj,"\n schoolId ------>",schoolId);
    var query;
    var responseObj=new createResponse();
    if(searchObj.searchText && typeof searchObj.searchText=='string'){
        var searchText=searchObj.searchText;
        var searchTextArr=searchText.split(",");

        /*if((classObj && (classObj.name || classObj.section)) || searchText.indexOf('/')>-1){
            query= 'Match (n:User) -[r1:STUDENT_OF]->(c:Class)-[r2:CLASS_OF]->(s:School{schoolId:"'+schoolId+'"})  '
        }else{
            query='Match (s:School{schoolId:"'+schoolId+'"})<-[:USER_OF]-(n:User) ';
        }*/
        query='Match (s:School{schoolId:"'+schoolId+'"})<-[:USER_OF]-(n:User{softDelete:false}) ';

        //searchText?query+=' WHERE ':'';
        var tempFullQuery=[];
        for(var i= 0,len=searchTextArr.length;i<len;i++){
            var text=searchTextArr[i];
            var tempText=text.toLowerCase();
            var tempQueryArr=[];
            if(text && text.indexOf('/')==-1){
                //query+="("
                if(tempText=="m" || tempText=="male"){tempQueryArr.push('n.sex ="M" ')};
                if(tempText=="f" || tempText=="female"){tempQueryArr.push('n.sex ="F" ')};
                if(tempText=="student"){tempQueryArr.push('n.userType ="'+schoolId+'||1" ')}
                if(tempText=="teacher"){tempQueryArr.push('n.userType ="'+schoolId+'||2" ')}

                tempQueryArr.push('n.regID =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.lastName =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.firstName =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.middleName =~ "(?i).*'+text+'.*"');
                tempQueryArr.push('n.userName =~ "(?i).*'+text+'.*"');
                if(tempQueryArr.length>0){
                    tempFullQuery.push(" ( "+tempQueryArr.join(' OR ')+" ) ");
                }
            }
        }
        if(tempFullQuery && tempFullQuery.length>0){
            query+=' WHERE '+tempFullQuery.join(" AND ");
        }

        var tempClassQueryArr=[];
        for(var j= 0,lenJ=searchTextArr.length;j<lenJ;j++){
            var text=searchTextArr[j];
            var tempText=text.toLowerCase();
            if(text && text.indexOf('/')>-1){
                var tempClass=text.split('/');
                var className=tempClass.length>0?tempClass[0]:'';
                var classSection=tempClass.length>1?tempClass[1]:'';
                className?tempClassQueryArr.push('c.name ="'+className+'"  '):'';
                classSection?tempClassQueryArr.push('c.section ="'+classSection+'" '):'';
            }
        }
        query+=' WITH n match (i:Image) -[r1:IMAGE_OF]-> n';
        
        if(classObj && classObj.hasOwnProperty('name') && classObj.name && classObj.hasOwnProperty('section') && classObj.section){
            query+=' WITH n MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
            classObj && classObj.name?tempClassQueryArr.push('c.name ="'+classObj.name+'" '):'';
            classObj && classObj.section?tempClassQueryArr.push('c.section ="'+classObj.section+'" '):'';
            query+=' where '+ tempClassQueryArr.join(" AND ");
        }else if(tempClassQueryArr.length>0){
            query+=' MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
            query+=' where '+ tempClassQueryArr.join(" OR ");
        }else{
            query+=' OPTIONAL MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
        }
        query+=' RETURN n,i order by r1.classRollNum ASC, n.regID desc, n.firstName ';

        /*if((classObj && (classObj.name || classObj.section)) || searchText.indexOf('/')>-1){
            query+=',r1,c order by r1.classRollNum ASC ';
        }else{
            query+=',s order by n.userName ASC ';
        }*/
        if(searchObj.hasOwnProperty('loadedRecords') && searchObj.loadedRecords){
            query+=' SKIP '+searchObj.loadedRecords+' ';
        }
        query+=' LIMIT 25 ';

    }else{

        var query='MATCH (s:School) <-[r1:USER_OF]-(u:User) where s.schoolId="'+schoolId+'" AND u.softDelete=false ';
        if(searchObj.hasOwnProperty('userName') && searchObj.userName){
            query+=' AND u.userName=~"(?i).*'+searchObj.userName+'.*" '
        }

        if(searchObj.hasOwnProperty('firstName') && searchObj.firstName){
            query+=' AND u.firstName=~"(?i).*'+searchObj.firstName+'.*" '
        }
        if(searchObj.hasOwnProperty('middleName') && searchObj.middleName){
            query+=' AND u.middleName=~"(?i).*'+searchObj.middleName+'.*" '
        }
        if(searchObj.hasOwnProperty('lastName') && searchObj.lastName){
            query+=' AND u.lastName=~"(?i).*'+searchObj.lastName+'.*" '
        }
        if(searchObj.hasOwnProperty('regID') && searchObj.regID){
            query+=' AND u.regID=~"(?i).*'+searchObj.regID+'.*"'
        }

        if(searchObj.hasOwnProperty('userType') && searchObj.userType){
            query+=' AND u.userType="'+searchObj.userType+'" optional match (s)<-[:CLASS_OF]-(c)<-[r2:STUDENT_OF{isCurrent:true}]-(u) '
            query+=' WITH u,s,r2,c match (i:Image) -[r1:IMAGE_OF]-> u';
        }else{
            query+=' WITH u,s match (i:Image) -[r1:IMAGE_OF]-> u';
        }

        if(searchObj.hasOwnProperty('class') && searchObj.class){
            var classObj=JSON.parse(searchObj.class);
            query+=' MATCH (c:Class) <-[r2:STUDENT_OF{isCurrent:true}]-( u ) WHERE c.name="'+classObj.name+'" AND c.section ="'+classObj.section+'" '
        }
        if((searchObj.hasOwnProperty('emailPrimary') && searchObj.emailPrimary)||
            (searchObj.hasOwnProperty('phonePrimary') && searchObj.phonePrimary)){
            query+=' MATCH (ct:Contact) -[r3:CONTACT_OF]-> ( u ) WHERE';
        }
        if(searchObj.hasOwnProperty('emailPrimary') && searchObj.emailPrimary){
            query+='  ct.emailPrimary=~"(?i).*'+searchObj.emailPrimary+'.*" '
        }
        if(searchObj.hasOwnProperty('phonePrimary') && searchObj.phonePrimary){
            query+='  ct.phonePrimary=~"(?i).*'+searchObj.phonePrimary+'.*" '
        }

        query+=' RETURN u, i order by u.regID desc, u.userName ASC ';

//        if((searchObj.hasOwnProperty('userType') && searchObj.userType) || (searchObj.hasOwnProperty('class') && searchObj.class)){
//            query+=',r2,c order by r2.classRollNum ASC, u.regID desc, u.userName ASC ';
//        }else{
//            query+=',s order by u.regID desc, u.userName ASC ';
//        }
        
        if(searchObj.hasOwnProperty('loadedRecords') && searchObj.loadedRecords){
            query+=' SKIP '+searchObj.loadedRecords+' ';
        }
        query+=' LIMIT 25 ';
    }
    console.log("query",query);
    db.cypherQuery(query,function(err,reply){
        console.log("searchUser",query,err);
        if(!err){
            responseObj.responseData=reply;
            res.json(responseObj);
        }else{
            responseObj.error=true;
            responseObj.errorMsg="No Data found.";
            res.json(responseObj);
        }
    });

	log.info("@@@@@ ::::: User.allUserWithPage : EXIT.");
}
function createResponse(){
    function Response(){
        this.error=false;
        this.errorMsg="";
        this.errorCode=999;
        this.successMsg="";
        this.responseData=undefined;
    }
    var obj=new Response();
    return obj;
}
function defaultErrorResponse(res,msg){
    var responseObj=createResponse();
    responseObj.error=true;
    responseObj.errorMsg = "OOPs... Something went wrong."+" ";
    if(msg){
        responseObj.errorMsg+=msg;
    }
    res.json(responseObj);
}
module.exports.getAllUserCount = function(res,searchObj,schoolId) {
	log.info("@@@@@ ::::: User.getAllUserCount : ENTER.");

    console.log("searchUser  ----> ",searchObj,"\n schoolId ------>",schoolId);
    var query;
    var responseObj=new createResponse();
    if(searchObj.searchText!==''){
        var searchText=searchObj.searchText;
        var searchTextArr=searchText.split(",");
        query='Match (s:School{schoolId:"'+schoolId+'"})<-[:USER_OF]-(n:User) ';

        //searchText?query+=' WHERE ':'';
        var tempFullQuery=[];
        for(var i= 0,len=searchTextArr.length;i<len;i++){
            var text=searchTextArr[i];
            var tempText=text.toLowerCase();
            var tempQueryArr=[];
            if(text && text.indexOf('/')==-1){
                //query+="("
                if(tempText=="m" || tempText=="male"){tempQueryArr.push('n.sex ="M" ')};
                if(tempText=="f" || tempText=="female"){tempQueryArr.push('n.sex ="F" ')};
                if(tempText=="student"){tempQueryArr.push('n.userType ="'+schoolId+'||1" ')}
                if(tempText=="teacher"){tempQueryArr.push('n.userType ="'+schoolId+'||2" ')}

                tempQueryArr.push('n.regID =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.lastName =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.firstName =~ "(?i).*'+text+'.*" ');
                tempQueryArr.push('n.middleName =~ "(?i).*'+text+'.*"');
                tempQueryArr.push('n.userName =~ "(?i).*'+text+'.*"');
                if(tempQueryArr.length>0){
                    tempFullQuery.push(" ( "+tempQueryArr.join(' OR ')+" ) ");
                }
            }
        }
        if(tempFullQuery && tempFullQuery.length>0){
            query+=' WHERE '+tempFullQuery.join(" AND ");
        }

        var tempClassQueryArr=[];
        for(var j= 0,lenJ=searchTextArr.length;j<lenJ;j++){
            var text=searchTextArr[j];
            var tempText=text.toLowerCase();
            if(text && text.indexOf('/')>-1){
                var tempClass=text.split('/');
                var className=tempClass.length>0?tempClass[0]:'';
                var classSection=tempClass.length>1?tempClass[1]:'';
                className?tempClassQueryArr.push('c.name ="'+className+'"  '):'';
                classSection?tempClassQueryArr.push('c.section ="'+classSection+'" '):'';

            }
        }
        if(classObj && classObj.hasOwnProperty('name') && classObj.name && classObj.hasOwnProperty('section') && classObj.section){
            query+=' WITH n MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
            classObj && classObj.name?tempClassQueryArr.push('c.name ="'+classObj.name+'" '):'';
            classObj && classObj.section?tempClassQueryArr.push('c.section ="'+classObj.section+'" '):'';
            query+=' where '+ tempClassQueryArr.join(" AND ");
        }else if(tempClassQueryArr.length>0){
            query+=' MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
            query+=' where '+ tempClassQueryArr.join(" OR ");
        }else{
            query+=' OPTIONAL MATCH  (n:User)-[r1:STUDENT_OF{isCurrent:true}]- (c:Class) ';
        }
        query+=' RETURN count(n)';
       
    }else{
    	
    	 var query='MATCH (s:School) <-[r1:USER_OF]-(u:User) where s.schoolId="'+schoolId+'" AND u.softDelete=false ';
         if(searchObj.hasOwnProperty('userName') && searchObj.userName){
             query+=' AND u.userName=~"(?i).*'+searchObj.userName+'.*" '
         }

         if(searchObj.hasOwnProperty('firstName') && searchObj.firstName){
             query+=' AND u.firstName=~"(?i).*'+searchObj.firstName+'.*" '
         }
         if(searchObj.hasOwnProperty('middleName') && searchObj.middleName){
             query+=' AND u.middleName=~"(?i).*'+searchObj.middleName+'.*" '
         }
         if(searchObj.hasOwnProperty('lastName') && searchObj.lastName){
             query+=' AND u.lastName=~"(?i).*'+searchObj.lastName+'.*" '
         }
         if(searchObj.hasOwnProperty('regID') && searchObj.regID){
             query+=' AND u.regID=~"(?i).*'+searchObj.regID+'.*"'
         }

         if(searchObj.hasOwnProperty('userType') && searchObj.userType){
             query+=' AND u.userType="'+searchObj.userType+'" optional match (s)<-[:CLASS_OF]-(c)<-[r2:STUDENT_OF{isCurrent:true}]-(u) '
             query+=' WITH u,s,r2,c';
         }else{
         	 query+=' WITH u,s ';
         }

         if(searchObj.hasOwnProperty('class') && searchObj.class){
             var classObj=JSON.parse(searchObj.class);
             query+=' MATCH (c:Class) <-[r2:STUDENT_OF{isCurrent:true}]-( u ) WHERE c.name="'+classObj.name+'" AND c.section ="'+classObj.section+'" '
         }
         if((searchObj.hasOwnProperty('emailPrimary') && searchObj.emailPrimary)||
             (searchObj.hasOwnProperty('phonePrimary') && searchObj.phonePrimary)){
             query+=' MATCH (ct:Contact) -[r3:CONTACT_OF]-> ( u ) WHERE';
         }
         if(searchObj.hasOwnProperty('emailPrimary') && searchObj.emailPrimary){
             query+='  ct.emailPrimary=~"(?i).*'+searchObj.emailPrimary+'.*" '
         }
         if(searchObj.hasOwnProperty('phonePrimary') && searchObj.phonePrimary){
             query+='  ct.phonePrimary=~"(?i).*'+searchObj.phonePrimary+'.*" '
         }
        query+=' RETURN  count(u) ';

    }
    console.log("query",query);
    db.cypherQuery(query,function(err,reply){
        console.log("searchUser",query,err);
        if(!err){
            responseObj.responseData=reply;
            res.json(responseObj);
        }else{
            responseObj.error=true;
            responseObj.errorMsg="No Data found.";
            res.json(responseObj);
        }
    });

//	var schoolId=loggedInUser.schoolDetails.schoolId;
//	var queryAllUsersCount= "MATCH (n:User) RETURN count(n) ";
//	console.log("getAllUserCount",queryAllUsersCount);
//    var responseObj = new Utils.Response();
//	db.cypherQuery(queryAllUsersCount, function(err, reply) {
//		console.log(err);
//		if (!err) {
//			responseObj.responseData = reply;
//			res.json(responseObj);
//		} else {
//			responseObj.error = true;
//			responseObj.errorMsg = "No Data found.";
//			res.json(responseObj);
//		}
//	});
	log.info("@@@@@ ::::: User.getAllUserCount : EXIT.");
}

/* find the available registration ID for the given registration ID to create new user */
module.exports.searchRegId = function(requestObj,schoolID,res) {
	log.info("@@@@@ ::::: User.searchRegId : ENTER.");
//	console.log("is User Name exist ?", requestObj);
	var responseObj = new Utils.Response();
    var query='Match (s:School{schoolId:"'+schoolID+'"})<-[:USER_OF]-(n:User{regID:"' + requestObj.regIdText + '"}) RETURN n';

	console.log("registration ID availability query :", query);
	db.cypherQuery(query, function(err, reply) {
		console.log("searchRegId :", query, err, reply);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	log.info("@@@@@ ::::: User.searchRegId : EXIT.");
}
module.exports.checkIn=function(requestObj,res){
	log.info("@@@@@ ::::: User.checkIn : ENTER.");
	var responseObj = new Utils.Response();
	var query = "";
	db.cypherQuery("",function(err,result){
		if (!err) {
			responseObj.responseData = result;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	})
	log.info("@@@@@ ::::: User.checkIn : EXIT.");
}

/* Search  user for user summary & userName availability*/
module.exports.searchUser = function(requestObj,res) {
	log.info("@@@@@ ::::: User.searchUser : ENTER.");
//	console.log("is User Name exist ?", requestObj);
	var responseObj = new Utils.Response();
	var query = 'MATCH (n:User{userName:"' + requestObj + '"})  RETURN n';

	console.log("username availability query :", query);
	db.cypherQuery(query, function(err, reply) {
		console.log("searchUser :", query, err, reply);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	log.info("@@@@@ ::::: User.searchUser : EXIT.");
}

/*
* Get selected User details
*/
module.exports.getSelectedUser=function(value,req,res){
	log.info("@@@@@ ::::: User.getSelectedUser : ENTER.");
	var userName = value;
	var responseObj = new Utils.Response();
	var userClass='';
	userDetail.getUserDetailsByUserName(userName, req, res, function(req, res,result) {
		//console.log("getSelectedUser", result.data);

		if (result && result.data.length > 0) {
			var userDetailsArray=[];
			var userDet, pAddress, sAddress, sn, school, contact;
			result.columns.length > 0 ? userDet = result.data[0][0] : null;
			result.columns.length > 1 ? pAddress = result.data[0][1] : null;
			result.columns.length > 2 ? sAddress = result.data[0][2] : null;
			result.columns.length > 3 ? sn = result.data[0][3] : null;
			result.columns.length > 4 ? school = result.data[0][4] : null;
			result.columns.length > 4 ? contact = result.data[0][5] : null;
			
			//          console.log("result : ",result);
			//console.log(userDet, pAddress, sAddress, sn, school, contact);
			if (userDet != null) {
				userDetail.setUserDetails(userDet, pAddress, sAddress, sn, school, contact);
				//console.log("req.session.userDetails", userDetail);
				
				if(school!=null && userDet.userType==school.schoolId+"||1"){
		        	var query='Start n=node('+userDet._id+') with n match (n)-[s:STUDENT_OF{isCurrent:true}]->(b) return b';
		    		db.cypherQuery(query, function(err, reply) {
		    			console.log("class query $$$$$$$$$:", query,'\n err :', err, '\n reply.data[0] :',reply.data[0],'\n reply.data : ', reply.data );
		    			if (reply && reply.data.length>0) {
		    				userClass=reply.data[0];
		    				userDetail.userClass=userClass;
		    				responseObj.responseData = userDetail;
		    				res.json(responseObj);
		    			} 
		    			else if(err || reply.data.length!=1)
		    			{
		    				userDetail.userClass='';
		    				responseObj.responseData = userDetail;
		    				res.json(responseObj);
						}
		    		});
				}else{
//					console.log("@@@@@ userDet @@@@@ ",userDet);
					responseObj.responseData = userDetail;
					res.json(responseObj);
				}
			} else {
				console.log("User Details not found.");
				responseObj.error = true;
				responseObj.responseData = null;
				responseObj.errorMsg = "No Data found.";
				res.json(responseObj);
				
			}
		}
	});
	log.info("@@@@@ ::::: User.getSelectedUser : EXIT.");
}
module.exports.getSelectedUserImageData=function(user,req,res){
	log.info("@@@@@ ::::: User.getSelectedUserImageData : ENTER.");
	var responseObj = new Utils.Response();
    try{
        var userName=user.userName;
        var query='match (i:Image) -[r1:IMAGE_OF]->(u:User{userName:"'+userName+'"}) return i';

        db.cypherQuery(query, function(err, result) {
            console.log("getSelectedUserImageData err",err);
            if(result && result.data && result.data.length>0){
            	responseObj.responseData = result.data;
				res.json(responseObj);
            }
            else{
            	responseObj.error = true;
				responseObj.responseData = null;
				responseObj.errorMsg = "Image not found.";
				res.json(responseObj);
            }
        });
    }catch(e){
    	log.error("@@@@@ ::::: User.getSelectedUserImageData : ERROR",e);
    	console.log("User.getSelectedUserImageData : ",e);
    }
    log.info("@@@@@ ::::: User.getSelectedUserImageData : EXIT.");
}

//var userDataList=[["Roll No","Scholar Number","Student Name","Class","Section","Primary Contact","Secondary Contact","DOB","CASTE"],["1","9956","ADARSH NAGRALE","9","A","9425347793","","24/09/2000","SC"],["2","10024","ADITYA PHILLIPS","9","A","9977587799","","04/09/2000","0"],["3","9912","ADITYA RAO","9","A","9893025779","","12/12/2000","0"],["4","10409","AKSHAT GOKHRU","9","A","9691857927","","09/05/2000","0"],["5","9932","AKSHAT JOSHI","9","A","9826018432","","26/05/2000","0"],["6","4353","AMAL THOMAS","9","A","7389056240","","27/01/2000","0"],["7","9890","AMAN SINGH CHANDEL","9","A","9425955660","","28/05/2000","0"],["8","9941","ANIK ASHIRWADAM","9","A","9424462497","","10/04/2000","0"],["9","9525","ANIRUDH BHALRAI","9","A","9926091516","","28/08/1999","SC"],["10","10046","ANWAR AYOON","9","A","9425104724","","05/07/2000","0"],["11","10017","AYAN FAROOQUI","9","A","9329783385","","24/08/2000","0"],["12","11484","AYUSH SHARMA","9","A","9826340408","","30/06/2000","0"],["13","10093","BHAVESH GAMI","9","A","9424301717","","15/05/2000","0"],["14","4402","DEVESH CHHAPOLA","9","A","","","25/02/2001","S.C "],["15","10029","DHANANJAY SHARMA","9","A","9425052045","","29/11/2000","0"],["16","9880","EDWIN PAULOSE","9","A","9926042434","","23/03/2000","0"],["17","11131","HARSH JAIN","9","A","9424013426","","31/07/2000","0"],["18","10061","HARSHODAYA PARMAR","9","A","9754642003","","27/08/2000","0"],["19","4383","HARSHWARDHAN SINGH BIST","9","A","9425904844","","36682","0"],["20","9831","HITESH DOBHAL","9","A","9229345483","","26/09/2000","0"],["21","9586","HRITHVIK GAUTAM","9","A","9826369940","","15/02/2000","0"],["22","9900","IDRIS AZAD","9","A","9329527212","","27/11/2000","0"],["23","10058","ISHAAN BHATI","9","A","9479714868","","23/03/2000","0"],["24","9839","ISHAN DWIVEDI","9","A","9826081296","","36892","0"],["25","9597","JANMESH UPADHYAYA","9","A","9425353811","","12/10/1999","0"],["26","11134","KARANDEEP SINGH GAMBHIR","9","A","9425316683","","05/08/2000","0"],["27","10462","MAYANK JOSHI","9","A","9827257244","","22/10/2000","0"],["28","9914","MOIZ SAIFEE","9","A","9826056665","","36575","0"],["29","9334","NAMAN PALLIWAL","9","A","9826567444","","36201","0"],["30","9931","PRAKHAR SINGH PALHARYA","9","A","9826806012","","01/06/2000","0"],["31","10042","PRANAV PALSHIKAR","9","A","9329548634","","36769","0"],["32","11473","PRANJAL RAI","9","A","9425096989","","24/05/2000","0"],["33","10030","PRIYAM CHOUHAN","9","A","9425077377","","20/04/2000","0"],["34","11122","RAJAT JHAWAR","9","A","9425910665","","16/03/2001","0"],["35","11177","RATISH SHARMA","9","A","9302121387","","36381","0"],["36","4348","RITESH SINGH MUJALDA","9","A","9406647820","","36799","0"],["37","9966","RITIK DUBEY","9","A","9826417252","","17/10/2000","0"],["38","10813","ROHIT SINGH KATIYAR","9","A","9329557051","","36557","0"],["39","9913","SAKSHAM SAXENA","9","A","8959979795","","20/06/2000","0"],["40","9988","SARTHAK SHARMA","9","A","9302222013","","36496","0"],["41","9917","SIDDHANT PANDEY","9","A","9827243617","","20/08/2000","0"],["42","9991","SIDDHARTH SINGH BAIS","9","A","9424877225","","36660","0"],["43","9970","STEVE ARPIT JOSEPH","9","A","8109030481","","05/04/2000","0"],["44","9855","SUDARSHAN PERWAL","9","A","9826095748","","09/11/2000","SC"],["45","10446","TANISHQ GOYAL","9","A","7587529220","","37073","0"],["46","9887","TANMAY JAIN","9","A","9827007067","","09/03/2000","0"],["47","10135","TARUN SINGH YADAV","9","A","8871373839","","37030","0"],["48","9833","TRIYANSH SONKAR","9","A","9425964272","","18/05/2000","0"],["49","10072","VISHRUT VARSHIKAR","9","A","9425313360","","13/03/2000","0"],["50","4403","YATHARTH TIWARI","9","A","9425001901","","12/08/1999","0"],["1","9865","AADISH GODHA","9","B","9425075069","","04/06/2000","0"],["2","11163","AAMIR KHAN","9","B","9300277508","","18/06/1999","0"],["3","9835","AARYAN SHARMA","9","B","9425065128","","26/07/2000","0"],["4","10002","AKSHAT VIJAYWARGIYA","9","B","9407119639","","01/07/2001","0"],["5","10485","AMAN KARAWAT","9","B","9926090764","","36900","0"],["6","11127","AMOL DUBEY","9","B","9424880709","","06/07/2000","0"],["7","10001","ANUJ GOYAL","9","B","9893699194","","09/08/2000","0"],["8","10773","AYUSH SINGH","9","B","9755099388","","14/10/2000","0"],["9","9253","BHUMIT DAWANI","9","B","9039631113","","36144","0"],["10","10487","CHIRAG MIRCHANDANI","9","B","9300365455","","10/12/2000","0"],["11","4279","CLEMENT MUNIYA","9","B","8827518496","","15/10/1998","0"],["12","10439","DHRUV GARG","9","B","9827300403","","10/06/2000","0"],["13","10363","FAIZANUL HASSAN ZAIDI","9","B","9907655834","","36093","0"],["14","9896","GITANSH PUJARI","9","B","9926841419","","31/03/2000","0"],["15","11183","GRAVISH PUROHIT","9","B","9617200755","","10/09/2000","0"],["16","10110","HARSH BISHNOI","9","B","9425061947","","22/05/2000","0"],["17","9921","HARSH NEMA","9","B","9826252617","","07/02/2000","0"],["18","10021","HARSH PRATAP SINGH HADA","9","B","9617699705","","15/05/2000","0"],["19","9949","HUZAIFA SAJID","9","B","9893077752","","09/09/2000","0"],["20","9929","JAY SHARMA","9","B","9893028570","","24/05/2000","0"],["21","10123","KARTIK BANODIYA","9","B","9425059055","","09/08/2000","0"],["22","9830","KEVIN GAJJAR","9","B","8758737780","","19/10/2000","0"],["23","4413","KOUTILYA PANDE","9","B","9425194152","","26/01/2001","0"],["24","9930","LINO JAMES","9","B","9669245260","","02/05/2001","0"],["25","11146","MANAS BAJAJ","9","B","9926278603","","36899","0"],["26","9844","MOHD. ALI GHAZI","9","B","9406800313","","02/05/2001","0"],["27","9836","MOHD. KHALID KHAN","9","B","9406800313","","03/08/2000","0"],["28","10789","MOHD. RIZWAN KHAN","9","B","9301315751","","07/03/1999","0"],["29","9990","MUKUL HIRANANDANI","9","B","9425935080","","25/09/2000","0"],["30","9983","NAMAN SINGH KUSHWAH","9","B","9425071838","","08/08/2000","0"],["31","9885","PRADUYAM SANKATH","9","B","9009099300","","02/12/2001","0"],["32","9920","PRARABDH KOTHARI","9","B","9425064957","","12/10/2000","0"],["33","10469","PRATHAM SINGH CHOUHAN","9","B","9425479594","","17/11/1999","0"],["34","10003","PRATIK AGRAWAL","9","B","9826023986","","09/01/2000","0"],["35","9883","PUNEET SINGH HORA","9","B","8889077701","","36762","0"],["36","9924","RUMAN KHAN","9","B","9302971855","","36566","0"],["37","9916","SAIYAM CHOPRA","9","B","9826083366","","10/11/2000","0"],["38","10666","SAMKIT SINGH NAHAR","9","B","9826064776","","06/06/2000","0"],["39","9915","SANSKAR SOLANKI","9","B","9826042516","","36895","0"],["40","10361","SARTHAK KALE","9","B","9300116363","","36818","0"],["41","9826","SHREYAS AGRAWAL","9","B","7748820005","","13/09/2000","0"],["42","11124","SOURABH DUKLAN","9","B","8965910992","","08/04/2000","0"],["43","11149","TUSHAR SABLOK","9","B","9826044417","","14/02/2001","0"],["44","9816","VAIBHAV CHOURASIA","9","B","9977224425","","01/07/2001","0"],["45","10489","VIBHOR SHARMA","9","B","9826070305","","06/03/2000","0"],["46","9942","YASH CHOUHAN","9","B","9301314638","","13/07/2000","SC"],["47","9892","YATENDRA RAIKUWAR","9","B","9300807774","","20/01/2001","0"],["48","4471","DEVA PALIWAL","9","B","9009226574","","19/03/2000","0"],["1","10096","ABDUL B. GOHRI","9","C","9425065486","","29/05/2000","0"],["2","9957","AISHWARYA JAIN","9","C","9425060505","","29/06/2000","0"],["3","9981","AKSHAT RAO","9","C","9753293234","","15/03/2000","0"],["4","9958","AMAN PATNI","9","C","9424583010","","12/11/2000","0"],["5","11194","ANANT SAXENA","9","C","9425057178","","03/07/2001","0"],["6","10799","ANIKESH JAIN SINGHAI","9","C","9826265903","","08/09/2000","0"],["7","9527","ANKIT NARONHA","9","C","7869362983","","21/12/1999","0"],["8","9938","ANSHUL SARAF","9","C","9977450555","","29/09/2000","0"],["9","10429","APOORVA CHOURASIA","9","C","9827348382","","08/09/2000","0"],["10","9994","AYAN AZHAR KHAN","9","C","9893112828","","30/06/2000","0"],["11","10776","AYUSH TOSHNIWAL","9","C","9826282375","","06/02/2000","0"],["12","4418","BEN BERNARD","9","C","9893037007","","28/05/2001","0"],["13","11151","BHOUMIK PARMAR","9","C","9425126657","","01/07/2000","0"],["14","9555","CHAITNYA JEET VERMA","9","C","9826018454","","21/11/1999","0"],["15","9814","DEVANK MATHUR","9","C","9425190634","","27/12/2000","0"],["16","10064","DEVANSH MANDLOI","9","C","9425066435","","24/06/2000","0"],["17","10038","DIVYANSH BHATIA","9","C","9826055123","","20/12/2000","0"],["18","9935","HARSH PATEL","9","C","9826422226","","06/06/2000","0"],["19","10433","HARSH TONDE","9","C","9827378817","","31/07/2000","0"],["20","10213","HARSHIT SINGH HORA","9","C","9826941840","","15/01/2001","0"],["21","9986","ISHPREET CHHABRA","9","C","7693021511","","06/08/2000","0"],["22","9907","MAANAV CHOUBEY","9","C","9826069073","","12/08/2000","0"],["23","10453","MANAN BOHRA","9","C","9425316449","","11/03/2000","0"],["24","9862","MOHD. FAHAD SHEIKH","9","C","9425074048","","23/11/1999","0"],["25","9989","MURTAZA ALI","9","C","9827302570","","29/09/2000","0"],["26","9937","MUSTAFA ARIF","9","C","9826528705","","16/06/2000","0"],["27","4419","NAYAN SHARMA","9","C","9893064614","","27/02/2000","0"],["28","9886","NEEL CHETNA","9","C","9893777220","","23/12/2000","0"],["29","9341","NELSON DIAS","9","C","9755513180","","08/04/1998","0"],["30","9857","PARIT JAIN","9","C","9893000545","","08/04/2000","0"],["31","4401","PHILIP EUGENE ABRAHAM","9","C","8982748939","","01/08/2001","0"],["32","9869","PRAKHAR MISHRA","9","C","9406717807","","08/08/2000","0"],["33","10016","PRANAV GUPTA","9","C","9425077806","","28/09/2000","0"],["34","10133","PRAYAS SURANA","9","C","9826533020","","36866","0"],["35","10055","PRIYANSHU UPASAK","9","C","7697240556","","05/08/2000","0"],["36","11143","PURVARDH RANADE","9","C","9425311541","","19/12/2000","0"],["37","11518","RAJDEV BRAHMBHATT","9","C","9575677798","","05/02/2000","0"],["38","9968","SANSKAR JOSHI","9","C","9981341007","","12/03/2000","0"],["39","10005","SHUBHAM KHALGE","9","C","9301632263","","09/08/2000","0"],["40","9974","SIDDHANT SHARMA","9","C","9425956926","","36645","0"],["41","9976","SOURAB SACHDEV","9","C","9425064744","","10/09/2000","0"],["42","9933","TANMAY AGRAWAL","9","C","9425954201","","24/04/2000","0"],["43","9877","TUSHAR MANDHAN","9","C","9329687780","","36848","0"],["44","11117","VINAY PURSNANI","9","C","9424082468","","23/08/2000","0"],["45","9962","YUVRAJ S. THAKUR","9","C","9827013033","","36760","0"],["46","10815","ZENUL ABEDEEN","9","C","9993811434","","16/01/2001","0"],["47","4469","ATUL KALYANE","9","C","9826063079","","01/07/2001","0"],["1","9965","ADARSH BURRA","9","D","9826011329","","18/02/2000","0"],["2","9838","ADITYA PERIVAL","9","D","9826077440","","23/09/2000","0"],["3","9909","AKSHAT BANDI","9","D","9827093430","","02/08/2000","0"],["4","9899","ANANT SINGH CHOUHAN","9","D","9926120257","","25/09/2000","0"],["5","10011","ANIKET TATTE","9","D","9307119804","","15/06/2000","0"],["6","9843","ANSH BAFNA","9","D","8878831333","","01/02/2001","0"],["7","4394","ARRAN PRATIK GONSALVES","9","D","9425515994","","18/12/2000","0"],["8","9982","ARSH JAIN","9","D","9827060632","","28/06/2000","0"],["9","10842","CHINMAY JAIN","9","D","9977249241","","36949","0"],["10","10050","DAKSH SHIVANI","9","D","9300686838","","30/11/2000","0"],["11","4397","DEEPANSHU THAWANI","9","D","9407413488","","23/07/2000","0"],["12","11188","DHRUV BHATHEJA","9","D","9826054109","","08/12/2000","0"],["13","9918","DHRUV TALREJA","9","D","9826871169","","23/01/2001","0"],["14","9889","DIVYAM JAIN","9","D","9826038336","","12/06/2000","0"],["15","9954","FAIZAN HUSSAIN","9","D","9827725620","","01/01/2001","0"],["16","10020","HAMZA NADEEM","9","D","9826116552","","17/10/2000","0"],["17","9895","KARAN JOSHI","9","D","9425056041","","15/03/2000","0"],["18","10057","KARAN KOTWAL","9","D","9303227418","","23/08/2000","0"],["19","4359","KENNEDY NELSON","9","D","9479577419","","36502","0"],["20","10457","MADHAV KHANDELWAL","9","D","8815161811","","08/01/2000","0"],["21","9884","MANAN SANGANERIA","9","D","8989464158","","07/06/2000","0"],["22","10010","MIRZA SAROSH BAIG","9","D","9691284613","","22/07/2000","0"],["23","9897","MOHD. BILAL PALWALA","9","D","9425900265","","15/01/2000","0"],["24","4273","MOHD. MAQSOOD GHORI","9","D","8966978607","","25/02/1999","0"],["25","9977","NAIRITYA BISWAS","9","D","9753465821","","27/04/2000","0"],["26","9908","NAVAL KHANDELWAL","9","D","9753424050","","09/04/2000","0"],["27","11494","PALLAV ARGAL","9","D","9827066100","","11/06/1999","0"],["28","10026","PRAKHAR GUPTA","9","D","9826980901","","19/11/2000","0"],["29","10015","RAVI JAIN","9","D","9993053359","","12/08/2000","0"],["30","4398","RHYTHM NAGAR","9","D","9303218397","","01/01/2000","0"],["31","9985","RISHIKESH TIWARI","9","D","9993969699","","18/09/2000","0"],["32","9842","RITIK JAIN","9","D","9993004560","","16/07/2000","0"],["33","10041","SANKALP DUBEY","9","D","9425314107","","27/11/2000","0"],["34","9905","SANYAM CHAURASIA","9","D","9098188828","","03/11/2000","0"],["35","10838","SANYAM DOSHI","9","D","9826021102","","36792","0"],["36","10025","SARTHAK CHOUDHARY","9","D","9425900367","","10/10/2000","0"],["37","9813","SARTHAK SHARMA","9","D","9425059481","","27/11/2000","0"],["38","9873","SHADAB KHAN","9","D","9425350077","","01/05/2000","0"],["39","10142","SHAHID AMAN","9","D","9425349013","","11/09/1998","0"],["40","9999","SHANTANU DUBEY","9","D","9826434575","","17/11/2000","0"],["41","9714","SHEIKH UNEZ MUKHTIYAR","9","D","9827365786","","36573","0"],["42","9980","SIDDHARTH SONI","9","D","9425318625","","02/08/2000","0"],["43","11129","VAIBHAV M. DESHMUKH","9","D","9977220440","","08/01/2000","0"],["44","9951","YASH SHIVLE","9","D","9425073933","","36581","0"],["45","9979","YUVRAJ KSHETRIMAYUM","9","D","9039057123","","08/09/2000","O B C"],["46","4466","RASIKH RASHEED","9","D","9829789101","","18/04/2001","0"],["47","4462","CHIRAG NAGDE","9","D","","","14/02/2001","0"],["48","4472","SAMARTH GARG","9","D","","","11/10/1999","0"],["49","4475","SAKSHAM GARG","9","D","","","25/12/1999","0"],["1","9922","AASTIK MISHRA","9","E","9827064862","","19/10/2000","0"],["2","9848","AFNAN SHEIKH","9","E","9893064542","","36901","0"],["3","9852","AKSHAT BAKHARIYA","9","E","9589322624","","07/01/2000","0"],["4","10492","AKSHAT JAIN","9","E","9425479206","","12/02/2000","0"],["5","9928","ANAS AHMED","9","E","9425321229","","10/10/2000","0"],["6","9532","ANUJ KHADDAR","9","E","9826049291","","25/12/1999","0"],["7","10044","ATHARV SOHANI","9","E","9752066666","","17/12/2000","0"],["8","9851","ARNAV YADAV","9","E","9926029194","","21/10/2000","0"],["9","11158","ASHWIN JAIN","9","E","9893561784","","03/10/2000","0"],["10","10039","DEVASHISH BHAND","9","E","9827015159","","12/07/2000","0"],["11","9878","DIVYANSHU LAHIRI","9","E","9424860005","","36901","0"],["12","9273","FAISAL REHMAN","9","E","9425074466","","20/09/98","0"],["13","9815","GAURAV KUKDESHWAR","9","E","9826080566","","16/08/2000","0"],["14","10034","GEETANSH RATHORE","9","E","7879666789","","09/11/2000","0"],["15","10068","HARDIK VAISHNAV","9","E","9630205104","","01/11/2001","0"],["16","9888","KARAN MEHRA","9","E","9329660655","","21/09/2000","0"],["17","10644","KARAN RAJ SHARMA","9","E","9302339865","","03/04/2001","0"],["18","11193","KARTIK ISRANI","9","E","9425054753","","25/08/2000","0"],["19","10051","KRISHNA JOSHI","9","E","9827211045","","36734","0"],["20","9811","KUNAL CHOUDHARY","9","E","9302105318","","16/11/2000","0"],["21","4399","MAYANK JAIN","9","E","9425453055","","23/10/2000","0"],["22","9998","MIHIR CHAKKARWAR","9","E","9425089947","","28/09/2000","0"],["23","4272","MOHD. MEHFOOZ GHORI","9","E","8878678629","","25/02/1999","0"],["24","9810","PARTH MATHUR","9","E","9826664060","","19/12/2000","0"],["25","9656","PARTH TIMANDE","9","E","9425125155","","36533","0"],["26","9861","PRADAM JAYAN","9","E","9752352819","","12/01/2000","0"],["27","4412","PRAHLAD GURJAR","9","E","9826953445","","04/01/2000","0"],["28","9939","PRITHVI SONI","9","E","9425325795","","23/11/2000","0"],["29","9894","RAHUL GOYAL","9","E","9424820505","","18/04/2000","0"],["30","9854","RAYYAN AHMED QURESHI","9","E","9827332855","","15/09/2000","0"],["31","9902","RITIK MITTAL","9","E","9893405670","","08/06/2000","0"],["32","4366","ROUNAK BHANDARI","9","E","8989738225","","23/03/2000","0"],["33","9972","RUDRAKSH TRIPATHI","9","E","9425955192","","07/08/2000","0"],["34","9964","SAHAJ SHRIVASTAVA","9","E","9229484381","","36691","0"],["35","9699","SAMARTH MALVIYA","9","E","9926882000","","26/04/2000","0"],["36","9817","SANSKAR JOSHI","9","E","9302409961","","01/01/2001","0"],["37","9953","SARANSH SURANA","9","E","9977505160","","36563","0"],["38","10067","SHIVENDRA PRATAP SINGH CHOUHAN","9","E","9827562719","","03/09/2001","0"],["39","9849","SIDDHARTH KHANDELWAL","9","E","9827562719","","20/07/2000","0"],["40","9858","SIFAT SINGH TUTEJA","9","E","9826038375","","05/03/2001","0"],["41","11500","SUMEET CHOUHAN","9","E","9425041787","","27/05/2000","0"],["42","10601","VAIBHAV SURANA","9","E","9893336713","","36680","0"],["43","10442","VEDIK ROHIRA","9","E","9977005566","","36926","0"],["44","9901","VINAYAK BANSAL","9","E","9827032488","","36929","0"],["45","9971","YASHVARDHAN SHARMA","9","E","9425903385","","36784","0"],["46","4468","PRAKIT KUMAR PANDEY","9","E","9200347030","","04/07/2000","0"],["47","4470","SAHIL GUPTA","9","E","9179462345","","19/04/2001","0"],["1","10851","ABDUL AHED KHAN","6","A","9926319619","","0","0"],["2","10862","ADITYA SONI","6","A","9893805926","","0","0"],["3","10865","ADWEYA TRIPATHI","6","A","9425076994","","0","0"],["4","10866","AGAM JAIN","6","A","9827300843","","0","0"],["5","10873","AKSHAT LADDHA","6","A","9425065007","","0","0"],["6","10870","AKSHAT SHARMA","6","A","9425904726","","0","0"],["7","11152","AKSHAT MEHTA","6","A","9302101312","","0","0"],["8","10877","ALI ASGAR TAMBAWALA","6","A","8818888799","","0","0"],["9","11819","ATIF RAJA","6","A","8718911111","","0","0"],["10","10511","AYUSH DIPAKE","6","A","8889524210","","0","0"],["11","10563","AZMAT ALI ZAIDI","6","A","9425054124","","0","0"],["12","12472","DEVRAJ NEPARKAR","6","A","9827022929","","0","0"],["13","12176","DHRUV JAIN","6","A","9425318717","","0","0"],["14","10930","DRON SHARMA","6","A","9826050103","","0","0"],["15","10938","GOPALA JOSHI","6","A","9893643618","","0","0"],["16","10940","HARDIK PATODI","6","A","9827290271","","0","0"],["17","10948","HRITIK SHARMA","6","A","9826016089","","0","0"],["18","10958","JAIVARDHAN SHARMA","6","A","9826081519","","0","0"],["19","10955","JAY THAKUR","6","A","9302101321","","0","0"],["20","10964","KANISHK KIMTEE","6","A","9098234097","","0","0"],["21","10966","KANISHQ SAHU","6","A","9827351209","","0","0"],["22","10968","KARTIKEY YADAV","6","A","9826546636","","0","0"],["23","10970","KAUSTUBH KAUSHAL","6","A","9425157724","","0","0"],["24","10528","KRISHNA BAGZAI","6","A","8305528555","","0","0"],["25","10977","KRISHNA TALWAR","6","A","9993904034","","0","0"],["26","10972","KUSH PORWAL","6","A","9826080366","","0","0"],["27","12141","LAKSHYA HARITWAL","6","A","9893134926","","0","0"],["28","10465","MIZAN KHAN","6","A","9826084727","","0","0"],["29","10994","MOHD. ARYAN","6","A","7898046322","","0","0"],["30","10996","MOHD. SAIF SHEIKH","6","A","9827027384","","0","0"],["31","11009","NIKUNJ MAHESWARI","6","A","9893405978","","0","0"],["32","11019","PARV KANUNGO","6","A","9926523760","","0","0"],["33","11014","PARTH BHATNAGAR","6","A","9826462777","","0","0"],["34","11018","PARTH VYAS","6","A","9826094219","","0","0"],["35","11028","PRANAMYA JAIN","6","A","9425062249","","0","0"],["36","10698","PRAVESH GUPTA","6","A","9303333323","","0","0"],["37","11838","RAGHAV KARAMCHANDANI","6","A","9575390891","","0","0"],["38","11038","RAJVEER SINGH CHOUHAN","6","A","9669410000","","0","0"],["39","11036","RAJTILAK SOLANKI","6","A","9407418631","","0","0"],["40","11043","ROHIT WADHWANI","6","A","9301078240","","0","0"],["41","11049","SAMEER DIXIT","6","A","8871860031","","0","0"],["42","11051","SANCHIT AGRAWAL","6","A","9425903283","","0","0"],["43","11080","SHAURYA SISODIYA","6","A","9926056007","","0","0"],["44","11077","SOHAM PATIL","6","A","9617777274","","0","0"],["45","11078","SOMIL AGRAWAL","6","A","9229664200","","0","0"],["46","4447","SUJAL YADAV","6","A","9826033255","","0","0"],["47","11085","SYED MUHAMMED ZAQWAN","6","A","9826903800","","0","0"],["48","11086","TAHA KHOUSTER","6","A","9826095552","","0","0"],["49","11097","UTKARSH YADAV","6","A","9893492527","","0","0"],["50","12496","YASH SADHAV","6","A","8959289620","","0","0"],["1","12152","ABDUL RUHAN BILAL TAHAMI","6","B","9300051562","","09/01/2003","0"],["2","10863","ADITYAVIKRAM VAIDYA","6","B","9826419225","","25/12/2003","0"],["3","10878","ALMAS KHAN","6","B","8989463517","","05/07/2003","0"],["4","10884","ANAGH DESHPANDE","6","B","9691020520","","16/12/2003","0"],["5","10888","ANIMESH MISHRA","6","B","9752841530","","18/01/2003","0"],["6","10814","ANSH TANEJA","6","B","9424454493","","25/11/2002","0"],["7","10889","ANIRUDH ARORA","6","B","9827222430","","27/02/2003","0"],["8","10890","ANIRUDH SONI","6","B","9826533858","","25/09/2003","0"],["9","10908","AUGUSTINE MARSHALL","6","B","7566002861","","25/04/2003","0"],["10","10915","BHAVJOT S. TUTEJA","6","B","9826061640","","14/03/2003","0"],["11","10919","DANZIL MASIH","6","B","9981896971","","22/05/2003","0"],["12","10926","DHRUVIL PATEL","6","B","9425060822","","27/02/2003","0"],["13","10934","GAGANPREET BHATIA","6","B","9826829030","","20/01/2003","0"],["14","10937","GAUTTAM MANDAN","6","B","9669681449","","05/07/2003","0"],["15","10946","HARSH GUPTA","6","B","9826064216","","20/10/2003","0"],["16","10957","JAINIL SHAH","6","B","9301511265","","28/03/2003","0"],["17","11133","JANAMEJAY SINGH BANKURA","6","B","9826125347","","16/09/2003","0"],["18","10959","JATIN PATEL","6","B","9826610631","","09/07/2003","0"],["19","10960","JAYESH SEWLANI","6","B","8085279132","","03/01/2003","0"],["20","11155","JAYESH SHARMA","6","B","9425480966","","21/04/2003","0"],["21","10963","KALASH SISODIYA","6","B","9827272704","","31/08/2003","0"],["22","10978","KSHITIJ BORKAR","6","B","9827266539","","14/07/2003","0"],["23","10980","KUNAL LUNKAD","6","B","9425911149","","03/12/2003","0"],["24","10988","MEET DODEJA","6","B","8818972000","","23/09/2003","0"],["25","11161","MIRAJUDDIN SHEIKH","6","B","9827431828","","09/01/2003","0"],["26","10998","MOHAMMAD ZAID","6","B","9826825141","","12/02/2003","0"],["27","11012","NISHIT DANI","6","B","9893652348","","05/11/2003","0"],["28","11020","PAWAN THAKURDWARE","6","B","9425076552","","06/08/2003","0"],["29","11021","PIYUSH MOTWANI","6","B","9827954696","","29/11/2002","0"],["30","11025","PRAKHAR GANGWAL","6","B","9827237623","","13/05/2002","0"],["31","11799","PRAVEEN BUDHWANI","6","B","9926638605","","26/09/2003","0"],["32","11037","RAJDEEP SINGH BHATIA","6","B","9826829030","","20/01/2003","0"],["33","11120","RISHABH PATIDAR","6","B","9425460309","","17/04/2003","OBC"],["34","11042","ROHIT GODHA","6","B","9302110143","","26/11/2002","0"],["35","11046","SAHEB SALUJA","6","B","9893894062","","02/08/2003","0"],["36","11050","SAMAKSH TIWARI","6","B","9926433052","","06/06/2003","0"],["37","11055","SANMAY SETHIA","6","B","9826038958","","27/01/2003","0"],["38","11056","SANSKAR SHUKLA","6","B","9827336319","","27/12/2002","0"],["39","11060","SARTHAK PAWAR","6","B","9425075850","","17/06/2003","0"],["40","11821","SHASHVAT BAJPAI","6","B","9009387053","","14/08/2003","0"],["41","11071","SHUBHAM SILAWAT","6","B","9425311646","","13/08/2003","0"],["42","11073","SIDDHARTH SHAH","6","B","9827237560","","03/10/2003","0"],["43","11504","SUYASH SINGH","6","B","8878600404","","23/01/2003","0"],["44","11083","SWAPNIL JOHN RAWAT","6","B","9990471809","","11/08/2003","0"],["45","11088","TANAY KOTIA","6","B","9827442213","","26/01/2003","0"],["46","11092","TANMAY PORWAL","6","B","7354918949","","16/05/2003","0"],["47","11098","UTKARSH MISHRA","6","B","9827250064","","23/10/2003","0"],["48","11099","VAIDIK YADAV","6","B","9893312395","","20/01/2003","0"],["49","11101","VANSHAJ YADAV","6","B","9827021447","","04/03/2003","0"],["50","11102","VATSAL SHARMA","6","B","9425355891","","27/06/2003","0"],["51","11104","VIBHANSHU GARGE","6","B","9425082119","","15/01/2003","0"],["52","11828","YUVRAJ MEV","6","B","9425055616","","21/05/2003","0"],["1","11189","ABHISHEK SINGH","6","C","9826046017","","12/05/2003","0"],["2","10858","ADEESH JAIN","6","C","9424096704","","26/03/2003","0"],["3","10874","AKSHAT JAIN","6","C","9827014676","","12/08/2003","0"],["4","10871","AKSHAT SANOTIA","6","C","9926036999","","16/07/2003","0"],["5","10879","AMAL KALLARAKKAL","6","C","9039465990","","02/02/2003","0"],["6","10883","AMEY ALEX PAUL","6","C","9302131442","","10/12/2003","0"],["7","10885","ANANT VIDYARTHI","6","C","7869389948","","09/09/2003","0"],["8","10561","ANIRUDH SILAWAT","6","C","9907555553","","19/02/2002","0"],["9","10891","ANISH DABIR","6","C","8461886344","","03/01/2003","0"],["10","12476","ARYAN KYATHAM","6","C","9893567456","","12/06/2003","0"],["11","10900","ASHLEY GOMES","6","C","9425058677","","08/10/2003","0"],["12","10906","ATHARVA BILLORE","6","C","9425959561","","13/12/2003","0"],["13","10911","AYAAN KHAN","6","C","8889778660","","09/04/2003","0"],["14","10918","DANISH ANWAR","6","C","9826624154","","09/11/2003","0"],["15","10924","DHRUV KUMAVAT","6","C","9713134000","","26/02/2003","0"],["16","10927","DIVRAJ SINGHY KHANUJA","6","C","9893108089","","25/05/2003","0"],["17","10929","DIVYANSHU SOLANKI","6","C","9826042516","","10/09/2003","0"],["18","10931","EMMANUEL FERNANDO","6","C","8982703843","","25/11/2003","0"],["19","10932","FAHAD KHOKAR","6","C","9406652211","","30/09/2003","0"],["20","10947","HATIM ALI BAGWALA","6","C","9893230852","","02/02/2003","0"],["21","11503","HRADAYAM SHRIVASTAVA","6","C","9425691381","","06/05/2003","0"],["22","10982","KUSH JAIN","6","C","9926497947","","27/06/2003","0"],["23","10983","KUSHAL PATIDAR","6","C","9406621626","","06/02/2003","0"],["24","10987","MAYUR JAIN","6","C","9993024969","","23/07/2003","0"],["25","12135","MOHD.KASHIF KHAN","6","C","9826789208","","27/08/2002","0"],["26","10532","MOHD.SHAZAN KHAN","6","C","9300098439","","06/07/2002","0"],["27","10997","MOHD. SUBHAM ANSARI","6","C","9425353657","","16/03/2003","0"],["28","10999","MOHD. ZAID GHAZI","6","C","9009906906","","11/07/2003","0"],["29","11010","NIMESH MITTAL","6","C","9893491042","","07/10/2003","0"],["30","11015","PARTH KANOJIYA","6","C","9826199544","","12/10/2003","0"],["31","11023","PRABHAV GARG","6","C","9826070454","","27/09/2003","0"],["32","11026","PRAKAHR SINGH PANWAR","6","C","9425316528","","19/05/2003","0"],["33","11030","PRATHAM BAGORE","6","C","9827683849","","26/09/2003","0"],["34","11031","PRATYUSH TIROLE","6","C","9977305405","","02/10/2004","0"],["35","11034","RACHIT SHAH","6","C","9826084120","","20/01/2004","0"],["36","11039","RIJAK CHHABRA","6","C","7389469456","","04/08/2003","0"],["37","11040","RISHAV MISHRA","6","C","9300808094","","07/11/2003","0"],["38","11162","SAHIL HAMIDANI","6","C","9302122690","","01/03/2002","0"],["39","11048","SAMARTH GARG","6","C","9826039035","","21/05/2003","0"],["40","11053","SANIDHYA RAWAT","6","C","9993499999","","11/12/2003","0"],["41","11059","SARTHAK YADAV","6","C","9425352846","","17/07/2003","0"],["42","11156","SIDDHARTH KHURANA","6","C","9826313272","","03/05/2003","0"],["43","11076","SIRGEN CHHABRA","6","C","9425077468","","30/11/2003","0"],["44","11079","SOMITRA SONI","6","C","7354064439","","11/04/2003","0"],["45","11081","STEVE FRANCIS","6","C","9826212603","","01/07/2003","0"],["46","11090","TANISHK GUPTA","6","C","9893030667","","29/09/2003","0"],["47","11106","VINAY MANDLOI","6","C","9826941101","","02/11/2003","0"],["48","11107","VINAYAK AGRAWAL","6","C","9826762661","","16/09/2003","0"],["49","11110","VISHWAVARDHAN SAROSHE","6","C","9425312393","","25/03/2003","0"],["50","11174","ZAID AHMED ANSARI","6","C","9752255566","","21/04/2003","0"],["1","10846","AADHYAN YADAV","6","D","9893586515","","26/05/2003","0"],["2","10847","AADITH RAJEEV","6","D","9424578912","","12/11/2003","0"],["3","10512","AAYUSHMAN NARVARIYA","6","D","9926562418","","20/07/2002","0"],["4","10857","ABHISHEK CHOUHAN","6","D","9977009820","","25/12/2003","0"],["5","10855","ABHISHEK PANCHAL","6","D","9826755599","","28/04/2003","0"],["6","10856","ABHISHEK PAWAR","6","D","9179759990","","04/03/2003","OBC"],["7","12182","ADITYA SHUKLA","6","D","7566409706","","15/08/2004","0"],["8","10872","AKSHAT JAIN","6","D","9425062672","","06/12/2003","0"],["9","10869","AKSHAT SHRIVAS","6","D","9406600909","","26/04/2003","0"],["10","10875","AKSHAY JAIN","6","D","9827223094","","30/10/2003","0"],["11","10886","ANGOD SINGH SALUJA","6","D","9826025830","","02/12/2003","0"],["12","10896","ARIN DANIEL","6","D","8889067770","","09/10/2003","0"],["13","10895","AREEN PAUL","6","D","9827231148","","14/10/2003","0"],["14","11171","ARYAN SHUKLA","6","D","9752042985","","16/01/2003","0"],["15","10904","ATHARV SONI","6","D","9907161076","","13/10/2003","0"],["16","12490","DAKSH MULCHANDANI","6","D","9926502154","","18/07/2003","0"],["17","11168","DENNIS SEBASTIAN","6","D","9424891510","","30/07/2003","0"],["18","10923","DEVANSHU SAINI","6","D","9424596125","","26/05/2003","OBC"],["19","10941","HARDIK SHARMA","6","D","9425480798","","23/09/2003","0"],["20","10949","HARSHIT SAINI","6","D","9753993281","","15/11/2003","0"],["21","10522","ISHAN SHUKLA","6","D","9826685896","","16/05/2002","0"],["22","10523","ISHU CHOUHAN","6","D","9009013124","","13/01/2003","0"],["23","10951","INIYAN ANDRUS","6","D","9425903487","","16/04/2003","0"],["24","10975","KRISHNA SILAWAT","6","D","9977907305","","25/06/2003","0"],["25","10976","KRISHNANSHU S. BILARWAN","6","D","9826546780","","02/11/2003","0"],["26","10979","KUNAL BHARGAVA","6","D","9425052107","","14/11/2003","0"],["27","11138","KUNAL SONI","6","D","9993387333","","18/02/2004","0"],["28","12166","LAVESH VYAS","6","D","9993857294","","20/06/2003","0"],["29","10984","MANAN RATHORE","6","D","9826723777","","07/03/2003","0"],["30","10989","MEET SHARMA","6","D","9827095378","","05/10/2003","0"],["31","11005","NAMAN MAROLIA","6","D","9826099981","","17/12/2003","0"],["32","11823","NIDHISH SHARMA","6","D","9425495919","","05/06/2004","0"],["33","11011","NISHANT PAHARE","6","D","9977385866","","19/09/2002","0"],["34","11029","PRATEEK RANE","6","D","9926956048","","15/03/2003","0"],["35","11032","PRIYESH JAIN","6","D","9827028295","","20/12/2003","0"],["36","11150","RAJBHAAN SINGH SHEKHAWAT","6","D","9407100556","","20/01/2004","0"],["37","11041","ROHAN TIWARI","6","D","9826094361","","03/06/2003","0"],["38","11044","RUDRANSH CHOURASIA","6","D","9826698759","","14/07/2003","0"],["39","11045","RUDRANSH GUPTA","6","D","7869950155","","18/10/2003","0"],["40","11190","SAHEB SISODIYA","6","D","9977765033","","24/01/2004","SC"],["41","12469","SAMYAK JAIN","6","D","9826428653","","08/08/2003","0"],["42","11057","SANSKAR UPADHYA","6","D","9425494383","","22/05/2003","0"],["43","11159","SAVIO BASTIAN","6","D","9179230222","","30/03/2003","0"],["44","11064","SHASHANK SHARMA","6","D","9425350614","","23/11/2003","0"],["45","11063","SHALOM RAM","6","D","9300001674","","10/11/2003","0"],["46","11074","SIDDHARTH SHASTRI","6","D","9893433201","","10/04/2003","0"],["47","11103","VEDANSH CHOURASIA","6","D","9977224425","","11/01/2003","OBC"],["48","11112","YASH JAIN","6","D","9893699149","","09/04/2003","0"],["1","10868","AAKASH JAIN","6","E","9098327666","","13/07/2003","0"],["2","10852","ABDUL AHAD GHORI","6","E","9907612046","","20/08/2003","OBC"],["3","10867","AJAIBEER SINGH BHATIA","6","E","9425076935","","31/12/2003","0"],["4","10826","AKSHAT MAKWANA","6","E","9009832999","","19/12/2003","0"],["5","11135","ANAS KHAN","6","E","9893599970","","29/08/2003","0"],["6","10892","ANAS ADDAS","6","E","9826601944","","28/12/2002","0"],["7","10893","ANSHUL BIYANI","6","E","9039096954","","04/07/2003","0"],["8","10848","ARJAV JAIN","6","E","9826560302","","14/06/2003","0"],["9","10905","ATHARVE RAHINJ","6","E","9826500987","","24/07/2003","0"],["10","10909","AVIJEET JOSHI","6","E","9826590565","","27/06/2003","0"],["11","11825","AVINEET SHARMA","6","E","9993807307","","18/04/2003","0"],["12","4429","CHIRAG SINGH","6","E","9826099267","","14/12/2002","0"],["13","11167","DHRUV TANDON","6","E","9575311901","","29/07/2003","0"],["14","10936","GAURAV SONKAR","6","E","","","01/03/2004","S.C."],["15","10945","HARSH GAUR","6","E","9425400538","","12/06/2003","0"],["16","10956","JAIRAJ MANDIA","6","E","9827251611","","04/07/2003","0"],["17","10962","JUZER SAFDARI","6","E","9827237803","","01/09/2003","0"],["18","10967","KARTIK KHANDELWAL","6","E","9827014446","","27/06/2003","0"],["19","10969","KAUSTUBH GURNANI","6","E","9425904992","","02/12/2003","0"],["20","10971","KESHAV GARG","6","E","9425312377","","14/11/2003","0"],["21","10985","MANAS RAJAWAT","6","E","9827538320","","28/08/2003","0"],["22","10986","MANAV CHOPRA","6","E","9827021551","","05/10/2003","0"],["23","10993","MOHAMMED SAIFEE","6","E","9424051222","","02/01/2003","0"],["24","11003","MUSTAFA NOORANI","6","E","9826305057","","02/12/2003","0"],["25","11006","NAYAN DEOKAR","6","E","9893088519","","30/09/2003","0"],["26","11007","NAYAN PATWARI","6","E","9827223473","","27/01/2003","0"],["27","11017","PARTH SHUKLA","6","E","9826762610","","25/09/2003","0"],["28","11022","PRABHAKAR AGRAWAL","6","E","9827330951","","27/06/2003","0"],["29","11024","PRACHIT PATKI","6","E","9827025368","","19/12/2003","0"],["30","11033","RACHIT GANGWAL","6","E","8989066180","","01/01/2004","0"],["31","12470","RAJ SHARMA","6","E","9425109536","","11/05/2002","0"],["32","11165","SAMARTH RAWLANI","6","E","9826010399","","10/06/2003","0"],["33","11054","SANKALP SINGH RAJPUT","6","E","8982848123","","30/10/2003","0"],["34","11061","SATVIK JAIN","6","E","9827019564","","14/08/2003","0"],["35","11517","SHAMAN SHARMA","6","E","9300080502","","22/09/2003","0"],["36","11066","SHATRUANJAY SINGHVI","6","E","9827050000","","01/05/2003","0"],["37","11488","SIDDHARTH PARE","6","E","7898909020","","01/09/2003","0"],["38","11069","SHUBH GOYAL","6","E","8982820082","","11/07/2003","0"],["39","11170","SUYASH SHARMA","6","E","9589864110","","29/07/2003","0"],["40","11089","TANISHQ KANTHED","6","E","9826032336","","29/09/2003","0"],["41","11093","TARUN FATEHCHANDANI","6","E","8989200119","","04/04/2003","0"],["42","11094","TEJAS JOSHI","6","E","9977572972","","18/04/2003","0"],["43","11096","UTKARSH THANWAR","6","E","9009917000","","01/05/2003","0"],["44","12497","VAISHAK S. NAIR","6","E","9406717645","","18/11/2003","0"],["45","11105","VIBHASH TRIVEDI","6","E","9039917879","","31/05/2003","0"],["46","10603","VINIT SEN","6","E","9893260031","","21/11/2002","0"],["47","11111","YASH JAIN","6","E","9826526591","","16/02/2004","0"],["48","11166","ZAID UMER","6","E","9826476474","","20/05/2003","0"],["1","10607","AAKASH VIJAYVERGIYA","7","A","9827244298","","18/02/2002","0"],["2","10502","AARYAN CHOUREY","7","A","7272425295","","10/12/2002","0"],["3","10553","AASTIK PAHADIYA","7","A","9826066699","","01/01/2003","0"],["4","10503","ABUZER JAFRI","7","A","9425050529","","10/10/2002","0"],["5","10506","AMAN DIXIT","7","A","9425052759","","12/03/2002","0"],["6","10721","AMANDEEP SINGH MONGA","7","A","9827331466","","23/05/2002","0"],["7","11499","AMIT CHOUHAN","7","A","9425041787","","13/04/2002","0"],["8","10722","ANGAD YADAV","7","A","9893050522","","16/07/2002","0"],["9","10615","ANUBHAV PATIDAR","7","A","9425066416","","16/12/2002","0"],["10","10723","ANUJ KAKANI","7","A","9425054404","","18/10/2002","0"],["11","10833","APOORV SINGH PARIHAR","7","A","9302160981","","08/03/2002","0"],["12","10670","ARYAN DALAL","7","A","9425060915","","23/09/2002","0"],["13","12168","AYUSH VERULKAR","7","A","9977602233","","29/03/2002","0"],["14","11185","BHAVESH KHATURIA","7","A","9826343500","","14/09/2002","0"],["15","11835","CHAITANYA DARWAL","7","A","9425034026","","04/02/2003","0"],["16","11483","CHITRANSH KHARE","7","A","9425460364","","01/11/2003","0"],["17","10674","DEVANSH TRIPATHI","7","A","9826016496","","28/08/2002","0"],["18","10569","DEVESH SHARMA","7","A","9826088307","","06/05/2002","0"],["19","10625","HARDIK SHUKLA","7","A","9981510508","","17/12/2002","0"],["20","10627","HARMAN SINGH CHAWLA","7","A","9425062730","","24/07/2002","0"],["21","11801","ISH PANDEY","7","A","9165826739","","28/04/2002","0"],["22","10573","ISHAAN SINGHAL","7","A","9424897850","","24/09/2002","0"],["23","11842","ISHAN SHARMA","7","A","9826410033","","05/10/2002","0"],["24","10740","KANISHK CHUGH","7","A","9926476546","","16/09/2002","0"],["25","10686","KRISHNA CHATURVEDI","7","A","9303200161","","29/11/2003","0"],["26","10810","MANAS HALDHAR","7","A","9826148844","","17/02/2003","0"],["27","10581","MOHAMMED BAQUIR NAQVI","7","A","9200632796","","09/09/2002","0"],["28","10637","NAMAN GARG","7","A","9827726362","","20/07/2002","0"],["29","10692","NAMAN RANA","7","A","9713851291","","31/12/2002","0"],["30","10638","PARTH KAPSE","7","A","9893924212","","23/05/2002","0"],["31","10774","PARV PANCHOLI","7","A","9907073000","","13/08/2002","0"],["32","10585","PRASAD TAYDE","7","A","9179106649","","04/10/2002","0"],["33","10753","RAJVEER SINGH PARIHAR","7","A","9425902803","","18/07/2002","0"],["34","11512","RAJWARDHAN SINGH THAKUR","7","A","9893059257","","08/12/2002","0"],["35","10758","RHYTHM GHANSHYAM NAGRE","7","A","9713075361","","28/06/2002","0"],["36","10755","RISHI JAIN","7","A","8989983743","","12/11/2001","0"],["37","10756","RISHIK CHHABRA","7","A","9977216605","","24/05/2002","0"],["38","10775","SACHAL HABLANI","7","A","9826661678","","22/08/2002","0"],["39","10646","SARTHAK PATHAK","7","A","9300027291","","02/09/2002","0"],["40","10763","SATVIK DUBE","7","A","9827239738","","10/10/2002","0"],["41","10595","SHIKHAR THAKUR","7","A","9981547433","","29/03/2002","0"],["42","10713","SHRESHTH JAISWAL","7","A","9425032601","","06/03/2002","OBC"],["43","10598","TAHA ZAFAR","7","A","9826150403","","11/11/2001","0"],["44","10406","TANISHQ VISHWAKARMA","7","A","8435679582","","01/07/2002","0"],["45","10806","TUSHAR PATIL","7","A","8109252400","","03/04/2002","0"],["46","10550","VANSH VYAS","7","A","9425076331","","21/04/2002","0"],["47","10717","VIKRAMADITYA GUPTA","7","A","9425069224","","27/09/2002","0"],["1","10720","AADIL KHAN","7","B","786930689","","14/10/2002","OBC"],["2","12153","ABDUL REHMAN TAHAMI","7","B","9300051562","","17/10/2001","0"],["3","10719","ABHISHEK PAUL","7","B","9301469790","","16/07/2002","0"],["4","12148","ADITYA CHAWLA","7","B","8889957999","","07/04/2002","0"],["5","10611","ADITYA PRATAP SINGH SENGAR","7","B","9754865556","","29/01/2002","0"],["6","11139","AGASTTYA DIXIT","7","B","9755266552","","08/09/2002","0"],["7","10505","ALLEN GEORGE","7","B","9425480277","","10/08/2002","0"],["8","10668","ANIKET BANDI","7","B","9826018863","","12/10/2002","0"],["9","10559","ANIMESH DOSHI","7","B","9926020902","","04/03/2002","0"],["10","10724","ANUSHK KHAWASE","7","B","9993799097","","24/09/2002","0"],["11","10207","ARIB KHAN","7","B","9300838705","","20/09/2001","0"],["12","10669","ARUNIM MALVIYA","7","B","9826030090","","01/03/2003","0"],["13","10618","ARYAN SAXENA","7","B","8719979398","","02/01/2002","0"],["14","10515","CHIRANJEEV SINGH RAYET","7","B","9826094466","","14/03/2002","0"],["15","10570","DHRUV JAIN","7","B","7869479828","","30/01/2003","0"],["16","9822","EDMOND ROBIN DAIS","7","B","9755513180","","19/02/2000","0"],["17","10675","EKANSH CHANGAN","7","B","9826032320","","20/02/2002","0"],["18","10253","GAURAV PATIL","7","B","9826344110","","21/11/2001","0"],["19","10519","HARSHVARDHANA SURANA","7","B","9826082652","","26/01/2002","0"],["20","10738","JAYANT YADAV","7","B","9827559383","","04/06/2002","0"],["21","10683","JEET AIREN","7","B","9826084083","","27/03/2002","0"],["22","10525","JUSTINE CHACKO","7","B","9893545422","","14/03/2002","0"],["23","10527","KEVIN RAPHAEL","7","B","9926700758","","26/08/2002","0"],["24","10633","KSHITIJ TRIVEDI","7","B","9827371232","","18/11/2002","0"],["25","10809","KUSHAGRA JAIN","7","B","9584715242","","22/11/2002","0"],["26","11493","LAKSHYARAJ SINGH CHAUHAN","7","B","9770352708","","24/04/2001","0"],["27","10323","MOHAMMED ZAID MULTANI","7","B","9164230715","","14/06/2001","0"],["28","10315","MOHD. FARAZ GHAZI","7","B","9009906906","","26/12/2001","0"],["29","10744","NIMISH SHARMA","7","B","9424540800","","01/09/2002","0"],["30","10745","NISHANT TOSHNIWAL","7","B","9826282375","","29/04/2002","0"],["31","12158","POORV WAGHMARE","7","B","9425062093","","25/04/2002","0"],["32","10640","PRATIKRAJ HADA","7","B","9926630032","","09/09/2002","0"],["33","10754","RAJWARDHAN SINGH RATHORE","7","B","9425400858","","10/07/2002","0"],["34","11142","RAMANDEEP SINGH SALUJA","7","B","9827225210","","25/02/2002","0"],["35","10702","RISHABH ROYCE HARRY","7","B","9993448863","","09/12/2002","0"],["36","11140","ROHIT SHARMA","7","B","8817478850","","10/08/2002","0"],["37","10757","RUCHIR PORWAL","7","B","9425001707","","11/04/2002","0"],["38","10706","SAMUEL SWAMY","7","B","9893623939","","23/08/2002","0"],["39","10708","SAUMMYA HARDIA","7","B","9826740667","","25/02/2003","0"],["40","10624","SHAIKH ELHAMUDDIN","7","B","9893170876","","19/01/2003","0"],["41","10596","SHREYANSH JAIN","7","B","9406843348","","07/10/2002","0"],["42","10715","SIDDHANTH NAIR","7","B","9826013528","","20/06/2002","0"],["43","10599","TARUN KUMAR SURANA","7","B","8959141476","","01/04/2003","0"],["44","10658","TUSHAR VERMA","7","B","9826278013","","17/09/2002","SC"],["45","10604","VISHAL PARASHAR","7","B","9424810718","","18/04/2002","0"],["46","10552","YASH KATHNAWAL","7","B","9425318998","","25/12/2002","0"],["47","11181","YASH PANT","7","B","9926288444","","20/04/2003","0"],["48","10772","ZAID AHMED KHAN","7","B","9826039954","","28/09/2002","0"],["1","10555","ADITYA CHOUKSEY","7","C","9826048034","","16/08/2002","0"],["2","10609","ADITYA MUCHHAL","7","C","9425900475","","30/04/2002","0"],["3","10557","ADITYA WARVADEKAR","7","C","9301636659","","22/06/2002","0"],["4","10179","AKSHAT KHANDELWAL","7","C","9425903121","","14/07/2001","0"],["5","10663","AMAN YADAV","7","C","9301814462","","26/02/2002","0"],["6","10794","ANUJ DIXIT","7","C","9425902840","","18/06/2002","0"],["7","11116","ANURAG THORAT","7","C","9826039346","","01/02/2002","0"],["8","10725","AREEN THOMAS","7","C","9826135035","","12/04/2002","0"],["9","10728","ATHARVA A. JOSHI","7","C","9425089611","","17/07/2002","0"],["10","12174","AYUSH TRIPATHI","7","C","9993599090","","16/12/2002","0"],["11","10620","AZAIN KHAN","7","C","9754466195","","02/09/2002","0"],["12","10731","CHINMAY NAVALAKHA","7","C","9425352219","","21/10/2002","0"],["13","10516","CHITRESH NEEMA","7","C","9425953511","","27/08/2002","0"],["14","10568","DEVESH DAWANI","7","C","9039631113","","27/06/2002","0"],["15","10571","GAURANG PALEKAR","7","C","9561703330","","05/04/2002","0"],["16","10733","GOVIND VYAS","7","C","9424889241","","22/10/2002","0"],["17","12131","HARDIK BHARGAVA","7","C","9424880780","","17/05/2002","0"],["18","10679","HIMANSHU PATIL","7","C","8982000414","","04/11/2003","0"],["19","10739","JITESH KUKREJA","7","C","9827018259","","25/05/2002","0"],["20","10593","KARTIK JAIN","7","C","9826023502","","02/04/2003","0"],["21","10685","KESHAV SHARMA","7","C","9425351552","","11/10/2002","0"],["22","10634","KUSHAGRA JAIN","7","C","9826723838","","06/08/2003","0"],["23","10577","KHUSH MANE","7","C","9826065289","","03/10/2002","0"],["24","10530","LOKESH SHARMA","7","C","9406600439","","19/02/2002","0"],["25","10531","MANAL RIJHWANI","7","C","9827071017","","10/04/2002","0"],["26","10699","MOHD. RAHIL ANSARI","7","C","9827324800","","05/03/2002","0"],["27","10780","OM OJHA","7","C","9303277958","","03/03/2003","0"],["28","10748","PRABAL POPHALEY","7","C","9827730220","","11/02/2002","0"],["29","10639","PRADHUMAN SUGANDHI","7","C","9589005868","","09/07/2002","0"],["30","10695","PRANZHAL JAIN","7","C","9893272226","","27/06/2002","0"],["31","10750","PRASANNA SAMADHIYA","7","C","9425058922","","09/03/2002","0"],["32","11141","PRIYANSHU SHRIVASTAVA","7","C","9826074097","","24/09/2002","0"],["33","10701","RISHABH PATEL","7","C","9926005594","","03/02/2002","OBC"],["34","10588","ROHIT GOME","7","C","9425444466","","13/11/2001","0"],["35","10540","SAHIL BARHANPURKAR","7","C","9754423700","","15/12/2002","0"],["36","10643","SAHIL SANGTANI","7","C","9425032445","","07/01/2002","0"],["37","10375","SANKET SANCHAR","7","C","9424570297","","09/06/2001","0"],["38","10652","SHIMRAAN KHAN","7","C","9981179025","","17/12/2002","0"],["39","10709","SHIVADITYA SINGH PANWAR","7","C","9826297978","","25/07/2002","0"],["40","10390","SHREYAS KSHIRE","7","C","9425320434","","09/03/2001","0"],["41","10651","SIDDHARTH NAGPAL","7","C","9826050606","","19/09/2002","0"],["42","10766","SOHAM KEKRE","7","C","9424820881","","06/08/2002","0"],["43","10600","TEJAS KOLHATKAR","7","C","9893095595","","28/04/2002","0"],["44","10768","UMAIR AHMED","7","C","9826606688","","27/05/2002","0"],["45","10742","V. MOHIT RAO","7","C","9755097993","","08/11/2002","0"],["46","10424","WILSON AYUSH TOPPO","7","C","9406803110","","25/09/2001","ST"],["47","10605","YASH VYAS","7","C","9009015101","","05/08/2002","0"],["48","10823","YASHRAJ SINGH CHOUHAN","7","C","9424574898","","05/11/2003","0"],["1","10665","ADITYA MAROO","7","D","9893045139","","02/10/2002","0"],["2","10175","AKASH SOLANKI","7","D","9425064967","","29/01/2000","SC"],["3","4423","AKSHAT CHOUDHARY","7","D","7566555486","","27/10/2001","0"],["4","10783","AKSHAT JOSHI","7","D","9826016568","","23/03/2002","0"],["5","10613","ANANTYA S. PAUL","7","D","9826427011","","25/01/2003","0"],["6","10614","ANEESH SUTRAVE","7","D","9425316277","","21/04/2002","0"],["7","10205","APOORV SAXENA","7","D","9752984201","","12/07/2001","0"],["8","10616","ARNAV SOKAL","7","D","9425057277","","07/06/2002","0"],["9","10617","ARYAMAN AHUJA","7","D","9977333339","","24/02/2002","0"],["10","10566","AYUSH SHARMA","7","D","9826058080","","18/11/2002","0"],["11","10730","CHAHAT NAGAR","7","D","9893345735","","14/03/2002","0"],["12","11814","CHIRAG SHRIVASTAVA","7","D","9993042626","","08/12/2002","0"],["13","10673","DEV PANDEY","7","D","9827654124","","31/10/2002","0"],["14","10518","DUSHYANT DWIVEDI","7","D","9826081296","","05/08/2002","0"],["15","10572","GAURAV PARE","7","D","7879269066","","29/09/2001","0"],["16","10628","HARSHIT PARE","7","D","9826066541","","27/06/2001","0"],["17","10735","HARSHWARDHAN VERMA","7","D","9826572777","","02/08/2002","0"],["18","10736","ISHAN MUJUMDAR","7","D","8889911993","","17/02/2002","0"],["19","10682","JAY AIREN","7","D","9826084083","","27/03/2002","0"],["20","10630","JYOTIRMAY VASWANI","7","D","9303129578","","17/09/2002","0"],["21","10526","KETAN PARASWANI","7","D","9479719997","","02/05/2002","0"],["22","10529","KRITIK JOSHI","7","D","9425055050","","20/12/2002","0"],["23","10308","MANAS SHARMA","7","D","8889033301","","05/03/2001","0"],["24","10689","MOHAMMAD HASHIR SIDDIQUI","7","D","9893767772","","23/07/2002","0"],["25","10688","MOHAMMED ARFIN KHAN","7","D","9977608131","","28/12/2002","0"],["26","10322","MOHD. SHOAIB ANSARI","7","D","9826064141","","25/04/2001","0"],["27","10536","PRAJWAL PATIL","7","D","9826386342","","25/07/2002","0"],["28","10694","PRAKHAR KATHED","7","D","9425056627","","11/11/2001","0"],["29","10697","PRATHAM PACHORI","7","D","9425057600","","05/09/2002","0"],["30","10537","PRATHMESH PIMPALKAR","7","D","8871603359","","11/02/2002","0"],["31","10752","RAGHAV SONI","7","D","9425055519","","22/02/2002","0"],["32","10769","RAJVANSH JAIN","7","D","9406600193","","24/05/2002","0"],["33","10375","ROMARIC SUJAL SWAMY","7","D","8878724603","","21/11/2001","0"],["34","10760","SAHIL BAIG","7","D","9039153686","","29/04/2002","0"],["35","10704","SAKSHAM GUPTA","7","D","9826091754","","14/10/2002","0"],["36","10591","SALWYN JOSEPH MATHEW","7","D","9424040965","","13/04/2002","0"],["37","10762","SANSKAR GOUR","7","D","9926699831","","18/06/2002","0"],["38","10544","SAQLAIN AHMED CHOWDHARY","7","D","9713250191","","04/12/2002","0"],["39","10714","SHREYTAM GOYAL","7","D","9406668076","","22/10/2002","0"],["40","10649","SHUBH JAIN","7","D","7869284719","","19/09/2002","0"],["41","10545","SPARSH KATHED","7","D","9827038567","","17/01/2002","0"],["42","10548","TANMAY JAIN","7","D","9981954355","","12/08/2002","0"],["43","10656","TINU TOM JOSEPH","7","D","9826056521","","18/04/2002","0"],["44","10659","UDIT BADJATIYA","7","D","9827045820","","04/01/2002","0"],["45","11192","VARUN SEN","7","D","9826161664","","15/01/2003","OBC"],["46","10590","VIDHAN SONGARE","7","D","9826632511","","04/09/2002","0"],["47","11508","YASH BAGHERWAL","7","D","7898048070","","24/06/2002","0"],["48","10662","YOGIT NAINANI","7","D","9826067622","","10/11/2002","0"],["1","10504","AKSHAT SHAH","7","E","9826190039","","06/04/2002","0"],["2","4430","AKSHAT YADAV","7","E","9303978789","","24/12/2002","0"],["3","10832","AMARSH JAISWAL","7","E","9074921214","","05/12/2002","OBC"],["4","10558","AMBAR MITTAL","7","E","9826763303","","27/11/2002","0"],["5","10718","ANIKET PAGARE","7","E","9424579097","","10/07/2002","0"],["6","10820","ARJUN PANDEY","7","E","9826617424","","11/12/2002","0"],["7","10619","AVI JINDAL","7","E","9827266411","","18/06/2002","0"],["8","11186","AYAN SINGH","7","E","9425103160","","19/04/2002","0"],["9","10671","BHASKAR TRIVEDI","7","E","9302117372","","30/05/2002","0"],["10","10514","CHAITANYA AGRAWAL","7","E","9993480210","","07/11/2002","0"],["11","10517","DUSHYANT SARAF","7","E","7869907262","","05/01/2002","0"],["12","10678","HARSH KUMAR LAL","7","E","9425069216","","09/04/2002","0"],["13","11839","HARSHWARDHAN SINGH TANWAR","7","E","9893748703","","26/02/2002","0"],["14","10521","HATIM PITHAWALA","7","E","9826436889","","30/12/2002","0"],["15","10680","HUSAIN RAJGARHWALA","7","E","9425345730","","26/06/2002","0"],["16","10741","KARAN PANWAR","7","E","9575145927","","06/11/2002","0"],["17","10298","KUSHAGRA SHARMA","7","E","9755038891","","30/12/2001","0"],["18","10579","MANAN SARDA","7","E","9425056660","","09/06/2002","0"],["19","10687","MEHUL VYAS","7","E","9993140095","","09/09/2002","0"],["20","10636","MOULIK GUPTA","7","E","9407147466","","27/02/2002","0"],["21","10691","NABEEL ANSARI","7","E","9827255117","","21/02/2002","0"],["22","10827","PALASH PAL","7","E","9977505122","","21/08/2002","0"],["23","10693","PARTH DHAGE","7","E","9826383977","","06/04/2002","0"],["24","10747","PRABAL BAFNA","7","E","9827773331","","28/12/2002","0"],["25","11144","PRIYANSHU VAISHNAV","7","E","9926448009","","08/01/2002","OBC"],["26","10751","RAGHAV MANTRI","7","E","9826069254","","24/05/2002","0"],["27","10700","RAHUL LADDHA","7","E","9425065008","","06/08/2002","0"],["28","10539","RAJEEV GULANI","7","E","9926204132","","06/07/2002","0"],["29","10587","RAJVEER SINGH PABLA","7","E","9827775577","","10/12/2002","0"],["30","10541","SAKSHAM JAIN","7","E","9826020204","","14/05/2002","0"],["31","10542","SAMARTH NIJHAWAN","7","E","9826088086","","27/04/2002","0"],["32","10761","SAMBHAV MAHAJAN","7","E","9752224974","","18/11/2002","0"],["33","10594","SHASHANK YADAV","7","E","7869284020","","11/08/2002","0"],["34","10647","SHASHWAT ASATHI","7","E","9827224016","","06/03/2002","0"],["35","10543","SHUBH SHARMA","7","E","9893441696","","04/09/2002","0"],["36","10653","SUBRAT JAIN","7","E","9406615476","","28/05/2002","0"],["37","10767","SWATAM JHANJHARI","7","E","9424837005","","14/02/2002","0"],["38","11807","TANMAY SHARMA","7","E","9424881408","","19/07/2002","0"],["39","10661","UDIT RAJPUT","7","E","9826431305","","15/04/2002","0"],["40","10660","UDIT SEN","7","E","982724420","","02/10/2003","OBC"],["41","10602","VIDIT BADJATYA","7","E","9907248199","","15/04/2002","0"],["42","10771","VINIT CHAUDHARY","7","E","9826047922","","14/01/2003","0"],["43","10551","VIVEK BHANDARI","7","E","9009901886","","08/04/2002","0"],["44","10423","WALID KHAN","7","E","9039736575","","24/12/2001","0"],["45","10168","ABHISHEK SILAWAT","7","E","9826391616","","03/01/2002","0"],["1","10173","AAGAM JAIN","8","A","9406682509","","16/12/01","0"],["2","10162","AARYAN TRIVEDI","8","A","9424515407","","31/10/01","0"],["3","10480","AAYUSH SHARMA","8","A","9993390986","","29/03/01","0"],["4","11515","ABDUL QADEER KHAN","8","A","9575512458","","14/07/01","0"],["5","10166","ABHI AWAD","8","A","9826015015","","26/01/02","0"],["6","11132","ADITYA CHHABRA","8","A","8878874000","","17/11/00","0"],["7","10185","AMAL RAJEEV","8","A","9826078287","","10/10/2001","0"],["8","10188","AMAN KHAN","8","A","9301354445","","13/06/00","0"],["9","9934","AMEY GOSWAMI","8","A","9424008194","","18/06/00","0"],["10","10195","ANISH PANDYA","8","A","9424594302","","25/06/2001","0"],["11","10204","APURV GARGE","8","A","9754174199","","03/08/2001","0"],["12","10223","ATHARVA DWIVEDI","8","A","9826042287","","18/06/01","0"],["13","10230","AYUSH JUNEJA","8","A","9827030020","","19/11/01","0"],["14","10235","CHINMAY VANKAR","8","A","9826018441","","24/12/01","0"],["15","4420","CHIRAG CHAWLA","8","A","9826057054","","26/11/2001","0"],["16","10237","DEEPTANSHU SAINI","8","A","9424596125","","09/04/2001","OBC"],["17","10239","DEVA GANESH NAIR","8","A","9826092159","","29/07/01","0"],["18","10260","HARSH AGRAWAL","8","A","9425318080","","24/06/01","0"],["19","10266","HEMANG AGRAWAL","8","A","8989504386","","24/03/02","0"],["20","10272","ISHAAN PATHAK","8","A","9425077300","","20/03/01","0"],["21","10273","ISHAN SINGH RAWAT","8","A","9755043222","","20/02/02","0"],["22","10278","JAI BHOJE","8","A","9425063063","","22/07/01","0"],["23","10779","JASPREET SINGH CHHABRA","8","A","9926666025","","21/06/02","0"],["24","10297","KSHITIJ SINGH RAJPUT","8","A","9893224077","","07/07/2001","0"],["25","10309","MANAN JADHWANI","8","A","9425058538","","12/07/2001","0"],["26","11118","MANAS SINGH","8","A","9406717680","","24/11/01","0"],["27","10320","MOHAMMED DARAB SHEIKH","8","A","9424000786","","20/09/01","0"],["28","10803","MOHD. ZAID ANSARI","8","A","9826777732","","23/01/01","0"],["29","10335","NIHIT GUPTA","8","A","9302100498","","07/03/2001","0"],["30","11816","PARTH A SATPUTRE","8","A","9827039123","","02/10/2001","0"],["31","10348","PRASHANT DAS","8","A","9406628761","","18/08/01","0"],["32","10337","PRAVAR MORE","8","A","9406606637","","11/07/2001","0"],["33","11477","PREET DODEJA","8","A","9425459998","","18/12/00","0"],["34","10359","RISHABH SONEJA","8","A","9893248617","","12/10/2001","0"],["35","10477","SAJAL RAO","8","A","7415598263","","17/11/01","0"],["36","10373","SAMAY JHANJHARI","8","A","9425052175","","20/12/01","0"],["37","10378","SARTHAK D JAIN","8","A","9826788500","","15/07/01","0"],["38","10379","SARTHAK GOYAL","8","A","9827636111","","09/12/2001","0"],["39","10392","SHUBHAM JAIN","8","A","9755595084","","29/09/01","0"],["40","10395","SIDDHARTH JAIN","8","A","9329555115","","23/05/01","0"],["41","10399","SWAPNIL SINHA","8","A","9425350160","","21/03/01","0"],["42","10402","TANAY RAJVAIDYA","8","A","9755097155","","06/04/2001","0"],["43","10437","TANMAY PAWAR","8","A","7745999554","","14/03/01","0"],["44","10411","UJJWAL JAISWAL","8","A","9425064372","","15/09/01","0"],["45","10417","VASU OJHA","8","A","9827094626","","20/06/01","0"],["46","11520","YASH JAIN","8","A","9479544623","","18/11/01","0"],["47","10425","YASH PUROHIT","8","A","9826013609","","05/10/2001","0"],["48","10428","YASHANK PATIDAR","8","A","9826353961","","21/10/01","0"],["49","10812","ZAINUL A. LODHI","8","A","7415244106","","26/05/00","OBC"],["50","4467","AKSHAY GUPTA","8","A","9425415916","","14/07/01","0"],["1","10163","AAYUSH PERIWAL","8","B","9826085336","","09/07/2001","0"],["2","10165","ABHAY GOVIL","8","B","8889056379","","28/02/01","0"],["3","10177","AKSHAT GOYAL","8","B","9039318883","","11/02/2001","0"],["4","4350","ALBIN RAJU THOMAS","8","B","9425033645","","13/02/02","0"],["5","10490","AMAN SALWADIYA","8","B","9329539406","","09/03/1999","0"],["6","11803","AMITESH SHUKLA","8","B","9926419893","","11/08/2000","0"],["7","10190","AMOGH KAPSE","8","B","7566215607","","08/02/2001","0"],["8","10318","ANFAL ANSARI","8","B","9826025026","","21/06/00","OBC"],["9","10192","ANIK KHARE","8","B","9827016501","","27/07/01","0"],["10","10194","ANISH JAIN","8","B","9425319580","","25/07/01","0"],["11","10206","AQUEEL KANCHWALA","8","B","9424830916","","11/03/2001","0"],["12","10216","ARYAN LEANDER WISHARD","8","B","9826041954","","28/11/01","0"],["13","10217","ASHLEY JOSEPH","8","B","9009988477","","20/10/01","0"],["14","10231","BALDEEP SINGH CHHABRA","8","B","9425081565","","09/11/2001","0"],["15","10785","DANISH KHAN","8","B","9301315751","","13/04/01","0"],["16","10243","DEVRAJ JETHWANI","8","B","9425312933","","24/12/01","0"],["17","10245","DHAWAL PADLIYA","8","B","9893197751","","23/10/01","0"],["18","10252","FARHAN ALI","8","B","9425032853","","10/01/2001","0"],["19","10254","GAUTAM SAREEN","8","B","9826061467","","16/04/01","0"],["20","11169","HIMANSHU CHANDEL","8","B","9713078853","","30/08/01","0"],["21","11843","HIMANSHU SHARMA","8","B","9826410033","","21/05/01","0"],["22","10268","HITESH YADAV","8","B","9826585752","","20/07/01","0"],["23","10277","IZHAAN KHAN","8","B","9425900871","","29/11/01","0"],["24","9955","JAYESH CHOUDHARY","8","B","7879933343","","27/12/2000","0"],["25","10280","JAPISH TRIVEDI","8","B","9926043578","","09/01/2001","0"],["26","10293","KARTIK YADAV","8","B","9301259848","","06/10/2001","0"],["27","11481","LAVESH AGRAWAL","8","B","9425053243","","09/08/2001","0"],["28","10303","MADHUR DUBEY","8","B","9301385880","","11/05/2001","0"],["29","10310","MARYLL CASTELINO","8","B","9755097358","","20/12/01","0"],["30","9834","MAX D' SOUZA","8","B","8461008037","","28/07/00","0"],["31","10314","MOHAMMAD ALI BURHANIWALA","8","B","9302108195","","17/11/01","0"],["32","10321","MOHAMMED HABIB SHEIKH","8","B","9425353788","","05/01/2001","0"],["33","10326","MOIN KHAN","8","B","9425480858","","14/09/2001","0"],["34","11811","NIKET PATHAK","8","B","9827046030","","02/07/2001","0"],["35","10226","OVES KHOKAR","8","B","","","18/05/01","0"],["36","10351","PRITHVIRAJ PARMAR","8","B","9425057783","","31/05/01","0"],["37","10360","RISHI YADAV","8","B","93038841844","","01/03/2002","0"],["38","10364","ROHIT SILAWAT","8","B","9425311646","","28/04/01","0"],["39","10432","SARTHAK JAIN","8","B","9826054041","","14/12/01","0"],["40","10386","SHIKHAR RAWAT","8","B","9425065704","","13/11/01","0"],["41","10391","SHUBH NAHAR","8","B","9826079764","","27/12/01","0"],["42","4459","SHUBHAM KAMAL","8","B","9425001565","","22/03/01","S.C"],["43","10394","SIDDHARTH SHARMA","8","B","9425059509","","19/02/01","0"],["44","10467","SYED DAYAN ALI","8","B","9009575976","","07/02/2001","0"],["45","10404","TANISHQ AGRAWAL","8","B","9406852139","","03/04/2002","0"],["46","10408","TARUN SINGH","8","B","9753279300","","13/03/01","0"],["47","10413","UTKARSH ODHEKAR","8","B","9826048115","","19/12/01","0"],["48","10415","VAIBHAV GOHAR","8","B","9669240737","","29/03/01","0"],["49","10422","VIVEK MANDLIK","8","B","9826431709","","10/07/2001","0"],["50","11492","YASH R JAIN","8","B","9479872760","","21/01/01","0"],["1","4384","ABHIJEET SINGH SODHI","8","C","9827636045","","26/08/2002","0"],["2","10171","ADITYA JOSHI","8","C","9303235472","","22/09/01","0"],["3","10781","ALLEN D' SANTOS","8","C","9826926147","","11/05/1999","0"],["4","10191","ANADI SHARMA","8","C","9826037470","","08/09/2001","0"],["5","10197","ANKUSH GROVER","8","C","7828655644","","17/04/01","0"],["6","9891","ANSHUL PATHAK","8","C","9425353083","","28/08/1999","0"],["7","10208","ARINJAY SARAF","8","C","9826799927","","18/11/01","0"],["8","10043","ARJUN KOTWAL","8","C","9303227418","","23/08/00","0"],["9","10214","ARUSH VYASH","8","C","9926189422","","27/05/01","0"],["10","10220","ASHWIN ELIAS SAMUEL","8","C","9893023535","","07/09/2001","0"],["11","11121","AVISH PANDIT","8","C","9827346808","","10/10/2001","0"],["12","9961","BHARAT LALWANI","8","C","9893011378","","17/06/00","0"],["13","10468","BIAGGIO JOSEPH","8","C","9826344395","","24/10/00","0"],["14","10234","CHAITANYA PATIL","8","C","9425315251","","20/07/01","0"],["15","10240","DEVANG DWIVEDI","8","C","9826046001","","06/04/2001","0"],["16","10244","DEWANSH MALVIYA","8","C","9425056785","","25/09/01","0"],["17","9797","DIVESH RANIWAL","8","C","9827256547","","03/08/2000","0"],["18","4410","GARVIT JOSHI","8","C","9993089752","","28/09/01","0"],["19","10257","HAKIMUDDIN LEMONWALA","8","C","9977729786","","20/04/01","0"],["20","10258","HARDIK MAHAHJAN","8","C","9827352155","","30/04/01","0"],["21","10267","HITENDRA PATEL","8","C","9425477129","","17/08/2001","0"],["22","10274","ISHAAN SUPEKAR","8","C","9098167219","","19/06/01","0"],["23","10282","JASMEET SINGH DHIR","8","C","9303213352","","16/12/00","0"],["24","10283","JAY DUBEY","8","C","9406609403","","25/05/01","0"],["25","10287","JOEL PATRICK LEWIS","8","C","9617784551","","05/05/2001","0"],["26","10294","KAUKAB MOHD. KHAN","8","C","9425081194","","24/06/01","0"],["27","10821","KESHAV GOYAL","8","C","9827252536","","10/10/2001","0"],["28","9995","KRISHNA VERMA","8","C","9302544747","","17/07/2000","0"],["29","10305","MALAV PATEL","8","C","9893300699","","24/07/01","0"],["30","10316","MOHAMMED FIDVI","8","C","9826037096","","28/05/01","0"],["31","10319","MOHD. ARSH KHAN","8","C","9826212113","","02/04/2002","0"],["32","10325","MOHIT KUMAR","8","C","9425081970","","16/09/01","0"],["33","10327","MOIS AZAD","8","C","9827282786","","26/06/01","0"],["34","11513","PIYUSH CHANDAK","8","C","9617774233","","06/02/2001","0"],["35","10356","RAJVARDHAN SINGH PANWAR","8","C","9926084410","","25/12/01","0"],["36","11511","RAMANSH SHARMA","8","C","9993051007","","31/10/01","0"],["37","10362","ROHAN BANODIYA","8","C","9425990777","","14/11/01","0"],["38","10381","SAARTHAK MITTAL","8","C","9826343242","","28/10/01","0"],["39","11519","SAMANVAY CHOUDHARY","8","C","9425327305","","26/06/01","0"],["40","9904","SEJAL SINGH MUTNEJA","8","C","8878788888","","20/03/2000","0"],["41","4422","SHIVANSH JADHAV","8","C","9993006563","","23/09/2000","0"],["42","10389","SHREYAS AGRAWAL","8","C","9827250348","","12/01/2001","0"],["43","11514","SIDDHARTH KUMAR","8","C","9893675333","","06/04/2001","0"],["44","10161","STANLEY SWAMI","8","C","9009068029","","07/12/2001","0"],["45","10400","SYED SARIM ALI","8","C","9977221188","","20/01/02","0"],["46","10412","URVISH VERMA","8","C","9993427281","","03/02/2001","0"],["47","10416","VARAD GATTANI","8","C","9329509966","","13/10/01","0"],["48","10418","VEDANT BHENIA","8","C","9691666465","","18/07/01","0"],["49","10426","YASH MITTAL","8","C","9826019989","","24/09/01","0"],["50","10431","YATHARTH BHAGWAT","8","C","9425081080","","15/11/01","0"],["1","10169","ADITYA SINGH","8","D","9826012991","","25/12/01","0"],["2","10176","AKSHAT MISHRA","8","D","9827387424","","27/07/01","0"],["3","10182","ALEX HERMAN","8","D","9827796447","","06/08/2001","0"],["4","11820","AMAAN RAZA MAJIDI","8","D","8718911111","","28/08/01","0"],["5","10193","ANIKET GOYAL","8","D","9826060655","","03/09/2002","0"],["6","10201","ANUJ PARASHAR","8","D","9827726796","","03/07/2001","0"],["7","10209","ARJAV JAIN","8","D","9827079815","","18/09/01","0"],["8","10218","ASHIR DALE","8","D","9669500094","","12/04/2001","0"],["9","10219","ASHISH SETHI","8","D","9826023550","","30/05/01","0"],["10","20222","ATHARVA JOSHI","8","D","9329512008","","29/01/02","0"],["11","10228","AYAAZ BUNGLOWALA","8","D","9039910758","","24/06/01","0"],["12","10233","BHAVARTH BHANGDIA","8","D","9926611031","","06/07/2001","0"],["13","10241","DEVANSH JOSHI","8","D","9893043363","","09/05/2001","0"],["14","10248","DIVYANSH SOOD","8","D","9425958490","","14/12/01","0"],["15","10250","DIVYANSH VIJAYVARGIYA","8","D","9425068989","","24/03/01","0"],["16","10256","GURSIMRAN SINGH TUTEJA","8","D","9893723727","","31/03/02","0"],["17","10159","HARSH VERMA","8","D","9425301036","","02/10/2001","0"],["18","4391","HARSHAL BEZAWADA","8","D","9425422088","","11/06/2002","0"],["19","11164","HARSHAL PATANKAR","8","D","9826878300","","04/04/2001","0"],["20","10270","IBRAHIM ALI","8","D","9893087050","","08/09/2001","0"],["21","10279","JANISH PANCHOLI","8","D","8889970555","","11/01/2001","0"],["22","10456","JAYANT SONI","8","D","9826031842","","01/08/2001","OBC"],["23","4421","KARIMULLA MOHAMMAD","8","D","9981144227","","15/04/2002","0"],["24","10291","KARTIK TIWARI","8","D","9893192740","","03/02/2001","0"],["25","10299","KUSHAGRA SHARMA","8","D","9826687474","","03/11/2002","0"],["26","10578","LAKSHYA VYAS","8","D","9977354000","","11/11/2000","0"],["27","10302","LIJO JOSEPH","8","D","9993907660","","01/08/2001","0"],["28","11822","MANU SHEPHERD","8","D","9893452075","","29/12/2000","0"],["29","4424","MOHIT RAJ MEENA","8","D","9893514161","","14/09/2002","0"],["30","10331","MUFADDAL MURABI","8","D","9754794733","","28/08/01","0"],["31","10334","NEERAJ DEVNANI","8","D","9827083552","","05/08/2001","0"],["32","10340","PRABHAV BAHETY","8","D","9926412451","","03/10/2001","0"],["33","10341","PRAFUL JOHN","8","D","7354513483","","24/09/01","0"],["34","10342","PRAJAL RATHI","8","D","8989166898","","29/06/01","0"],["35","10343","PRAJJAWAL MARK MOSES","8","D","9424007848","","28/12/01","0"],["36","10345","PRANAV BHARDWAJ","8","D","9977148687","","01/06/2002","0"],["37","10352","PRIYANSH MAHESHWARI","8","D","9425900895","","27/09/01","0"],["38","10357","RAUNAK SINGHAL","8","D","9827037222","","19/02/2001","0"],["39","10443","RISHABH PATNI","8","D","9893341507","","15/03/02","0"],["40","11507","RONAK KOTHARI","8","D","9826020903","","20/09/01","0"],["41","10366","RUCHIR NIMGAONKAR","8","D","9425350273","","13/11/01","0"],["42","10372","SAMAY JAIN","8","D","9827211525","","22/12/01","0"],["43","11496","SHUBHAM GUPTA","8","D","9826050178","","17/09/01","0"],["44","10397","STEVE PUNNOOSE","8","D","9826137622","","09/01/2001","0"],["45","11472","TANISHQ GUPTA","8","D","9755077797","","27/07/01","0"],["46","10817","VIPLAVE AGRAWAL","8","D","8602545647","","01/07/2001","0"],["47","10420","VIRENDRA HAKSAR","8","D","9425067126","","08/01/2001","0"],["48","10805","VISHWAJEET BHARADIA","8","D","9630034018","","12/11/2000","0"],["49","10430","YATHARTH SINGHAI","8","D","9827067292","","08/03/2001","0"],["1","10167","ABHISHEK GALVE","8","E","9009418891","","11/08/2001","0"],["2","10172","ADITYA SINGH CHOUHAN","8","E","9827255660","","12/12/2001","0"],["3","10178","AKSHAT JAIN","8","E","8889910727","","25/07/01","0"],["4","10180","AKSHAT NARUKA","8","E","9826040056","","24/10/01","0"],["5","9828","ALI ASGAR","8","E","9479445151","","28/12/00","0"],["6","9575","AMAN KUNHARE","8","E","9229440967","","10/05/1999","0"],["7","10189","AMAN NAREDI","8","E","9302561034","","28/02/01","0"],["8","11157","ANIMESH SOLANKI","8","E","9827260000","","23/10/2000","0"],["9","10198","ANMOL MANGAL","8","E","9425055362","","12/05/2001","0"],["10","10037","ARYAN KUSHWAHA","8","E","9826026286","","22/12/00","0"],["11","10221","ATHARVA VOHRA","8","E","9425349037","","04/02/2001","0"],["12","10225","ATISHAY JAIN","8","E","8989505392","","21/11/01","0"],["13","10232","BHANU KUMAR UJJWAL","8","E","8120061078","","25/09/01","0"],["14","10238","DEV JAIN","8","E","9425057450","","24/03/01","0"],["15","10242","DEVANSH MALVIYA","8","E","9993200073","","19/05/01","0"],["16","10249","DIVYANSH SHARMA","8","E","7566660165","","30/01/01","0"],["17","10255","GURMAN SINGH BHATIA","8","E","9826999206","","11/06/2001","0"],["18","10263","HARSH PHERWANI","8","E","9826083436","","11/06/2001","0"],["19","10265","HARSHVARDHAN SHARMA","8","E","9826081519","","20/01/02","0"],["20","10269","HUMED ANSARI","8","E","9827320555","","15/11/01","0"],["21","10275","ISHAAN MUDGAL","8","E","8251088222","","05/02/2001","0"],["22","10276","ISHAN PANDEY","8","E","9425070810","","04/01/2001","0"],["23","10284","JAYESH KASLIWAL","8","E","9827444800","","13/05/01","0"],["24","10290","KARTIK AGRAWAL","8","E","9826382616","","11/06/2001","0"],["25","10289","KARTIK JAIN","8","E","9826011366","","01/06/2002","0"],["26","10292","KARTIK JOSHI","8","E","9926189746","","11/06/2001","0"],["27","4387","KUSHAL JAIN","8","E","9424052469","","25/04/02","0"],["28","10301","LEEN CHOUDHARY","8","E","9827247787","","24/04/01","0"],["29","10777","MANAN SHRISHRIMAL","8","E","8989066894","","02/10/2001","0"],["30","10324","MOHIT SONI","8","E","9424837037","","16/04/01","0"],["31","10380","MURTAZA HAKIMUDDIN","8","E","9826911718","","15/02/01","0"],["32","10333","NAKUL PANT","8","E","8109553613","","19/10/01","0"],["33","10346","PRANSHU PALIWAL","8","E","9425962048","","10/05/2001","0"],["34","10347","PRANSHUL JAIN","8","E","9993099010","","12/11/2001","0"],["35","11148","QUSAI KANCHWALA","8","E","9826251540","","06/09/2001","0"],["36","10354","RACHIT JAIN","8","E","7898900420","","30/06/01","0"],["37","10367","SAGAR GANGWANI","8","E","9826417557","","28/09/01","0"],["38","10845","SANCHIT MATAI","8","E","9981119290","","03/06/2001","0"],["39","10684","SANKALP BANSAL","8","E","9893035371","","19/05/01","0"],["40","10376","SANSKAR BANDI","8","E","9827205992","","22/06/01","0"],["41","10384","SHANJAY SHARMA","8","E","9425350614","","09/02/2001","0"],["42","10387","SHOBHIT JAIN","8","E","9826389797","","06/07/2001","0"],["43","10398","SUYASH KALWANI","8","E","9425069345","","12/10/2001","0"],["44","10403","TANISHQ YADAV","8","E","9425351577","","25/07/01","0"],["45","10407","TANMAY BARANIYA","8","E","9303266654","","11/09/2001","0"],["46","11829","TUSHAR PARMARTHI","8","E","9425125576","","21/09/01","0"],["47","10421","VISHISHTHA GAHOI","8","E","9926061680","","08/10/2001","0"],["48","10427","YASH RAISINGHANI","8","E","9893098264","","06/07/2001","0"],["49","10459","YATHARTH GAMI","8","E","9926718182","","23/09/01","0"],["1","9497","AAYUSH KURIL","10","A","9826980707","","08/08/1999","0"],["2","9503","ADITYA SHARMA","10","A","9893088601","","05/01/1999","0"],["3","9505","ADITYA THAPA","10","A","9826026070","","08/10/1999","0"],["4","10491","AMAN SHARMA","10","A","8871072551","","16/03/99","0"],["5","9518","AMBUJ MISHRA","10","A","9826047609","","31/01/2000","0"],["6","9521","AMEYA BHANNARE","10","A","9425350437","","01/10/2000","0"],["7","9787","ANIKET SHARMA","10","A","9826015946","","30/04/1999","0"],["8","9528","ANMOL AJMERA","10","A","9425910540","","13/07/99","0"],["9","9530","ANSHUL TIWARI","10","A","9827036373","","29/11/99","0"],["10","9496","ASHUTOSH PANCHAL","10","A","9981806350","","01/01/2000","0"],["11","9546","AVIRAL PATHAK","10","A","9893385633","","03/03/2000","0"],["12","10095","AZIM KHAN","10","A","9893244428","","22/02/2000","0"],["13","9559","DAKSH PARIHAR","10","A","9425318114","","08/02/1999","0"],["14","9563","DEVANG DESAI","10","A","9893182881","","02/09/2000","0"],["15","9571","DIVYAM KUMAR SHRIVASTAVA","10","A","9893335649","","12/08/1999","0"],["16","9596","DIVYANSHU JAIN","10","A","9826376275","","08/01/1999","0"],["17","9574","GAURAV SONKAR","10","A","9826019273","","10/02/1999","0"],["18","9576","GIRISH TALREJA","10","A","9425955849","","01/10/2000","0"],["19","9577","GUNWANT MISHRA","10","A","9893811080","","01/10/2000","0"],["20","9589","HUSSAIN SHAMSI","10","A","9827257216","","29/12/98","0"],["21","9592","IDRIS SAIFEE","10","A","9424009922","","18/12/98","0"],["22","9605","KARAMDEEP SINGH CHHABRA","10","A","9827048184","","06/09/1999","0"],["23","9608","KARTIK DOSHI","10","A","9926020973","","12/11/1999","0"],["24","4428","KRISHNA MALVIYA","10","A","9407171777","","36349","0"],["25","9613","KRISHNA UPADHYAY","10","A","9669201210","","09/03/1999","0"],["26","9629","MEHUL YADAV","10","A","9179495556","","23/09/99","O B C"],["27","10580","MOHD. AASIM KHAN","10","A","9826366099","","15/12/99","0"],["28","10681","NAMANDEEP SINGH SODHI","10","A","9755544771","","21/04/2000","0"],["29","9646","NEEHAL KANOJIYA","10","A","9926084071","","13/10/99","0"],["30","9655","PARTH LODHA","10","A","7869282924","","24/05/99","0"],["31","9659","PIYUSH KULKARNI","10","A","9425313879","","19/05/99","0"],["32","9776","PRAKHAR TIWARI","10","A","9424507564","","17/03/99","0"],["33","4389","PRINCE YADAV","10","A","7879939866","","36605","0"],["34","9678","RAJARAM JOSHI","10","A","9826622126","","14/08/99","0"],["35","9689","RONAK GANGWAL","10","A","8989066180","","10/08/1999","0"],["36","9692","S. YESUDHASAN PILLAI","10","A","9425479501","","01/04/1999","0"],["37","9698","SAMARTH JOSHI","10","A","8871365615","","09/03/1999","0"],["38","9707","SARTHAK JARIYA","10","A","9981543733","","10/04/1999","0"],["39","10497","SARTHAK SINGH","10","A","7869106747","","14/01/ 2000","0"],["40","9713","SHASHWAT POTE","10","A","9424598184","","17/11/99","0"],["41","9720","SHREYANS AGRAWAL","10","A","9907331765","","26/12/99","0"],["42","9730","SHUBHAM SURANA","10","A","9425911080","","24/10/99","0"],["43","9726","SPARSH TRIVEDI","10","A","9425058750","","29/05/99","0"],["44","9731","SUBODH YADAV","10","A","9425054092","","10/08/1999","OBC"],["45","9743","UTKARSH KESKAR","10","A","9301817937","","27/10/99","0"],["46","9473","VINAYAK SHARMA","10","A","9425061879","","06/12/1998","0"],["47","9749","VIVEK VIJU","10","A","9826859491","","28/11/99","0"],["48","4460","YASH KAMAL","10","A","9425001565","","03/08/1999","S C"],["49","9752","YASH MODI","10","A","9981048002","","11/06/1999","0"],["50","10452","YUVRAJ SINGH SENGAR","10","A","9893153000","","05/05/1999","0"],["1","9795","ADITYA PARIHAR","10","B","8085466224","","06/11/2000","0"],["2","10818","AKSHAY JAISWAL","10","B","9406621766","","26/04/2000","0"],["3","4179","AKSHAY MISHRA","10","B","9826359393","","15/12/96","0"],["4","9516","AMAN SOLANKI","10","B","9893267854","","02/04/1999","0"],["5","9520","AMEY OZA","10","B","8962839312","","26/05/99","0"],["6","10472","AMIT PALSHIKAR","10","B","9826065083","","10/07/1999","0"],["7","10120","ARIK RAWAT","10","B","9827212081","","01/02/2000","0"],["8","11153","ARPIT GUPTA","10","B","9425108722","","13/09/99","0"],["9","9557","CHAYAN SHARMA","10","B","7697390768","","19/03/99","0"],["10","11182","CHINMAY MANJREKAR","10","B","9406628820","","18/03/99","0"],["11","4331","CHIRAYU SHARMA","10","B","8817710054","","02/02/2000","0"],["12","9560","DARSHIT JAIN","10","B","9425479790","","06/09/1999","0"],["13","10286","HARDIK SONI","10","B","9826627768","","06/03/1999","0"],["14","8956","HIMANSHU CHAUHAN","10","B","9009506669","","16/10/1997","0"],["15","9593","ISHAAN TIWARI","10","B","9425315269","","01/03/2000","0"],["16","9594","ISHAN KHARE","10","B","9826029006","","13/05/99","0"],["17","9757","JITESH OCHANI","10","B","9827288864","","28/07/99","0"],["18","11195","KARTIK PANJWANI","10","B","9806177168","","26/11/99","0"],["19","9610","KARTIKEY SHARMA","10","B","9425317105","","25/07/99","0"],["20","9611","KAVISH RATHOD","10","B","9425318154","","25/02/99","0"],["21","9317","KSHITIJ SAXENA","10","B","9644858874","","06/06/1998","0"],["22","9616","KUSHAL JHAMAD","10","B","9425320519","","25/03/99","0"],["23","9619","MADHUSUDAN YADAV","10","B","9669610999","","24/04/99","0"],["24","9628","MEHUL CHOUDHARY","10","B","8962002612","","01/07/1999","0"],["25","9630","MELVIN S MATHEW","10","B","9993655062","","07/06/1999","0"],["26","9631","MIHIR NEEMA","10","B","9425087429","","17/01/99","0"],["27","9347","NOEL DANIEL","10","B","9977101212","","26/12/97","0"],["28","9779","PALASH UPADHYAY","10","B","9993860171","","13/10/99","0"],["29","9658","PIAS SAMUEL","10","B","9424800222","","16/08/99","0"],["30","9660","PRABAL JAIN","10","B","9425490488","","28/07/99","0"],["31","9672","PRAYAG JAIN","10","B","9826938258","","19/07/99","0"],["32","9676","RACHIT DUBEY","10","B","9893545906","","27/09/99","0"],["33","9682","RISHI PATIDAR","10","B","9826847319","","25/12/99","0"],["34","9683","RISHI YADAV","10","B","9425072049","","29/01/2000","0"],["35","9685","RITIK SAHU","10","B","9424337798","","01/01/2000","0"],["36","9696","SAHIL VYAS","10","B","9302566667","","14/05/99","0"],["37","9703","SANJIT AGRAWAL","10","B","9425065556","","27/07/99","0"],["38","10143","SARTHAK KHARIWAL","10","B","9993690009","","30/03/ 2000","0"],["39","4426","SAUMYA CHATURVEDI","10","B","9424589427","","09/11/1999","0"],["40","9398","SHANTANU ARYA","10","B","9302106208","","20/12/98","0"],["41","9717","SHIVAM AGRAWAL","10","B","9826543354","","17/05/99","0"],["42","9723","SIDDHARTH DIXIT","10","B","9827060837","","22/09/99","0"],["43","9798","SIDDHARTH SINGH SOLANKI","10","B","9406668239","","13/12/99","0"],["44","9727","SRIJAN AGRAWAL","10","B","9826018590","","05/11/1999","0"],["45","9739","TANISHQ BHATIA","10","B","9425062981","","12/06/1999","0"],["46","9748","VIVEK RATHI","10","B","8989549330","","21/12/99","0"],["47","11154","YASH KOTHARI","10","B","9424588994","","27/10/99","0"],["48","9753","YASH RATNAPARKHI","10","B","9893618277","","12/08/1999","0"],["49","9754","YASHVEER SINGH JHALA","10","B","","","27/02/ 2000","0"],["1","9499","ADHIR LOT","10","C","9893264951","","04/11/1999","0"],["2","11180","AKHTAR PATEL","10","C","7898346069","","06/02/1999","0"],["3","9510","AKSHAT BHACHAWAT","10","C","9826297767","","02/11/1999","0"],["4","10787","AMAN AGRAWAL","10","C","7415766029","","22/02/99","0"],["5","4297","ANUP JOSEPH","10","C","9826445671","","22/05/99","0"],["6","9534","ARBAB KHAN","10","C","7803805309","","16/11/99","0"],["7","9240","ARKAN KHAN","10","C","9425075786","","21/11/98","0"],["8","9542","ATHARVA VADNERE","10","C","9826909950","","26/10/99","0"],["9","10499","AUSAF AHMAD SIDDIQUI","10","C","9407137629","","24/07/99","0"],["10","9541","AVNISH SHIRISH YADAV","10","C","8889222345","","08/04/1999","0"],["11","9549","AYUSH DUA","10","C","9826058071","","29/07/99","0"],["12","9551","AZIZ KABA","10","C","8871139192","","01/04/1999","0"],["13","9558","CHINMAY BADJATYA","10","C","9826089900","","01/04/2000","0"],["14","10091","CHRIS LAZARUS","10","C","9893263115","","16/03/99","0"],["15","9564","DEVANG JOSHI","10","C","9039045362","","20/09/99","0"],["16","9567","DEVASHISH PANDIT","10","C","9669696725","","23/10/99","0"],["17","9265","DHANANJAY JOSHI","10","C","9425059169","","22/02/98","0"],["18","4342","GULSHAN BETALA","10","C","8109982360","","26/11/98","0"],["19","9591","HUZEFA COLLEGEWALA","10","C","9827010852","","12/10/1999","0"],["20","9595","ISHANSH MALVIYA","10","C","9425076498","","19/10/99","OBC"],["21","11198","JASIM AHMED KHAN","10","C","9827282158","","11/09/1999","0"],["22","9600","JATIN VERMA","10","C","9826052614","","24/08/99","0"],["23","11145","KARAN KARAMCHANDANI","10","C","9826862626","","27/1198","0"],["24","4395","LEO S MICHAEL","10","C","9406609806","","30/07/99","9617"],["25","9326","MOHAMMAD BHANPURAWALA","10","C","9302566644","","30/10/98","0"],["26","11173","MOHD. SAIM BIN KHALIL","10","C","9826313052","","01/10/1999","0"],["27","9639","MOHIT JAISWAR","10","C","9826079338","","04/08/1999","OBC"],["28","9644","NAMAN BAFNA","10","C","8989409122","","11/10/1999","0"],["29","10460","OJAS KHAMKAR","10","C","8349907050","","14/02/2000","0"],["30","9350","PARAG LODWAL","10","C","9827247833","","06/04/1998","0"],["31","9863","PRASAD KELKAR","10","C","8959989797","","22/12/99","0"],["32","10837","PRASHANT SINGH","10","C","9893262108","","36315","0"],["33","9673","PRIYANSH SHARMA","10","C","9826358218","","17/06/2000","0"],["34","9675","PRIYESH JAISWAL","10","C","9424076433","","17/07/99","0"],["35","9686","ROBINSON JOHNSON","10","C","9826809361","","02/09/1999","0"],["36","9688","ROHIT BHATIA","10","C","9425058634","","23/09/98","0"],["37","9695","SAHIL BUNDELA","10","C","8889185557","","19/09/99","SC"],["38","9694","SAHIL GARANI","10","C","9827079878","","29/12/98","0"],["39","9701","SAMRADDH SAXENA","10","C","9425316670","","12/12/1999","0"],["40","10458","SARTHAK JAISWAL","10","C","9300439293","","15/03/2000","0"],["41","9709","SARTHAK SURANA","10","C","8889022291","","25/10/99","0"],["42","9710","SHALEEN MAKHANI","10","C","9826161327","","10/11/1999","0"],["43","9719","SHIVANG JAIN","10","C","9425957445","","27/08/99","0"],["44","9721","SIDDHANT SURANA","10","C","9827531343","","25/12/98","0"],["45","9728","SRIJAN MANDORA","10","C","9425312241","","24/07/99","0"],["46","9729","STYRISH PAUL","10","C","9575982846","","29/10/99","0"],["47","9735","TAHER METRO","10","C","9826050521","","21/09/99","0"],["48","9738","TANISHQ BAGDI","10","C","9425057211","","27/08/99","SC"],["49","4330","UTKARSH RATHI","10","C","9301240333","","20/03/1999","0"],["50","9764","UTKARSH SHARMA","10","C","9425315164","","25/11/99","0"],["51","9432","VEDANT PATHAK","10","C","9425077300","","10/09/1998","0"],["1","9501","ADARSH BHANDARI","10","D","8959393939","","21/06/99","0"],["2","9506","AKASH GOYAL","10","D","9893699194","","06/11/1999","0"],["3","9507","AKHIL BABU JOSEPH","10","D","9039465990","","27/11/99","0"],["4","4170","ALBY FRANCIS","10","D","9713272488","","21/09/98","0"],["5","4427","AMAN SADHAV","10","D","9425102242","","36315","SC"],["6","9519","AMBUJ OJHA","10","D","9926029664","","27/10/99","0"],["7","11184","ANUJ JAIN","10","D","9302100330","","10/10/1999","0"],["8","9531","ANUJ JOSHI","10","D","9826421769","","21/02/99","0"],["9","11175","APOORV DUBEY","10","D","9407056600","","08/12/1999","0"],["10","4404","AVISH DOSHI","10","D","9338061453","","11/10/1999","0"],["11","11126","CHINMAY SHRIVASTAVA","10","D","9424596634","","07/06/1999","0"],["12","9565","DEVANSH MANGAL","10","D","9406666199","","16/09/99","0"],["13","9568","DEVANSH SWAMI","10","D","9827551662","","11/01/1999","0"],["14","9266","DHANANJAY MAHOBIA","10","D","9826074103","","29/09/98","0"],["15","4363","DIVYANSH TIWARI","10","D","9826040408","","36477","0"],["16","10793","HARDIK BADJATIYA","10","D","9302595153","","13/07/99","0"],["17","9582","HARSHIT JAIN","10","D","9826377400","","10/05/1999","0"],["18","9581","HARSHVARDHAN SINGH PANWAR","10","D","9826088450","","19/05/99","0"],["19","9590","HUSSAIN TOPIWALA","10","D","9907108951","","02/05/1999","0"],["20","9598","JASON MASIH","10","D","9827285918","","28/03/99","0"],["21","9599","JASRAJ SINGH JUDGE","10","D","9303226199","","19/12/99","0"],["22","10084","JERRY JOHN","10","D","7566496853","","03/09/1997","0"],["23","9308","JONATHAN FRANCIS","10","D","9826212603","","28/01/99","0"],["24","9614","KUNAL ASRANI","10","D","9827634242","","28/10/99","0"],["25","9620","MANAS KURERIHA","10","D","9827344818","","09/12/1999","0"],["26","9622","MANN RATHORE","10","D","9926018600","","08/06/1999","0"],["27","9623","MAULIK PALOD","10","D","9893307800","","10/07/1999","0"],["28","9627","MEET PALOD","10","D","9425312145","","18/06/99","0"],["29","9635","MOHAMMAD ALI DEHLVI","10","D","9425059862","","18/08/99","0"],["30","10830","MOHD.DEWASWALA","10","D","9425951552","","05/04/1998","0"],["31","10782","NEERAV JADHAV","10","D","9977608064","","17/09/99","ST"],["32","9649","NIKHIL ROY","10","D","9746746515","","22/05/99","0"],["33","9653","PARAG RAGHAV","10","D","9669604546","","10/11/1999","0"],["34","4405","PRAKHAR PRATEEK","10","D","8989788110","","19/03/99","0"],["35","9668","PRATEEK NARSINGHANI","10","D","9893243617","","20/06/99","0"],["36","9670","PRAVAR KARWA","10","D","9425062233","","30/12/99","0"],["37","9677","RAHUL DUBEY","10","D","9827036356","","07/02/1999","0"],["38","4351","RITIK JAIN","10","D","9425339970","","36441","0"],["39","9691","RUPANSH SINGH","10","D","9826210870","","11/02/1999","ST"],["40","10801","SAHIL GATHIYA","10","D","7693052910","","24/03/2000","SC"],["41","9708","SARTHAK PERWAL","10","D","9826095748","","29/09/99","SC"],["42","9711","SHANE JOSEPH","10","D","9425081423","","06/11/1999","0"],["43","9463","SHARUL LODHA","10","D","9425104552","","11/11/1997","0"],["44","9715","SHERON SISODIYA","10","D","9425906685","","26/11/99","0"],["45","9716","SHIKHAR SENGAR","10","D","9827513484","","08/12/1999","0"],["46","9718","SHIVAM JAISWAL","10","D","9425410007","","29/05/99","0"],["47","10853","SHIVANSH JOSHI","10","D","9977006083","","26/04/99","0"],["48","4431","SHOBHIT MISHRA","10","D","8871739850","","12/05/1997","0"],["49","9734","TAHA MUNSHI","10","D","9098049152","","17/10/99","0"],["50","11172","TUSHAAR CHAUDHARY","10","D","9406717277","","05/01/1999","0"],["51","9744","VAIBHAV DUBEY","10","D","9826090164","","12/05/1999","0"],["1","9504","ADITYA SHARMA","10","E","9827726377","","16/08/99","0"],["2","10052","ALLEN PETER","10","E","9093066990","","30/07/99","0"],["3","10677","ANIMESH AGRAWAL","10","E","9827635695","","14/08/99","0"],["4","9523","ANIMESH JAIN","10","E","9424000030","","19/12/99","0"],["5","9526","ANIRUDH KUMAR SHARMA","10","E","9425070016","","22/11/99","0"],["6","9537","ASHAR NOMAN KHAN","10","E","7828196941","","12/12/1998","0"],["7","9539","ASHUTOSH DUBEY","10","E","8720872795","","09/09/1999","0"],["8","10804","ATIF IRSHAD","10","E","9425318411","","12/07/1998","0"],["9","9544","ATISHAY JAIN SETHI","10","E","8989741617","","16/05/99","0"],["10","9545","AUDARYA AWASTHI","10","E","8349907007","","17/06/99","0"],["11","9566","DEVASHISH JOSHI","10","E","8085611254","","06/09/1999","0"],["12","10070","FARAZ AHMED KHAN","10","E","8989499486","","12/07/1999","0"],["13","10778","GAURAV PATIDAR","10","E","8871919021","","19/05/98","0"],["14","9572","GANDHARVA CHOUDHARY","10","E","9189791845","","26/12/99","0"],["15","9575","GEET THAKKAR","10","E","9826016672","","12/11/1999","0"],["16","9580","HARSH CHIMNANI","10","E","8085655853","","10/01/1999","0"],["17","10073","HARSHAL CHOUDHARY","10","E","9907490331","","31/10/99","0"],["18","9583","HEMANT SINGH","10","E","9425900872","","21/01/00","0"],["19","9585","HRITHIK DAVID","10","E","9977649270","","08/07/1999","0"],["20","10791","JAYESH GURNANI","10","E","9827965692","","03/03/2000","0"],["21","9602","JOY SINGH","10","E","9406834385","","17/09/99","0"],["22","9609","KARTIK PILLAI","10","E","9800464333","","23/11/99","0"],["23","4157","MALAY BAHETI","10","E","9893390303","","23/08/98","0"],["24","9625","MAYUR ISRANI","10","E","9907579041","","09/09/1999","0"],["25","9626","MEET CHOPRA","10","E","9827593281","","11/03/1999","0"],["26","9634","MOHAK SHUKLA","10","E","9074943757","","36483","0"],["27","9638","MOHAMMED SEHOREWALA","10","E","7049737317","","07/11/1999","0"],["28","9640","MOIZ ALI LOKHANDWALA","10","E","9827614852","","23/08/99","0"],["29","9641","MONISH TULSIANI","10","E","7389901599","","10/06/1999","0"],["30","9650","NIMIT VERMA","10","E","8234063343","","01/01/2000","0"],["31","9652","PALASH GUPTA","10","E","9827238659","","14/05/99","0"],["32","9654","PARAS BAID","10","E","9039390007","","01/01/2000","0"],["33","9657","PARV JAIN","10","E","9827034076","","28/12/99","0"],["34","9357","PRADHUMAN SHARMA","10","E","9302108513","","04/12/1998","0"],["35","9662","PRAKHAR PARASHAR","10","E","9827055877","","22/06/99","0"],["36","9665","PRANAY GARG","10","E","9827240955","","30/12/99","0"],["37","9667","PRATEEK ISRANI","10","E","8871990069","","02/04/1999","0"],["38","9671","PRAVAR PARASHAR","10","E","9827055877","","22/06/99","0"],["39","9684","RITIK PENDSE","10","E","9479721922","","17/08/99","0"],["40","9697","SAIF SHEIKH","10","E","8109624701","","17/09/99","0"],["41","9705","SARTHAK BAPNA","10","E","9301647291","","03/06/2000","0"],["42","9706","SARTHAK KANOJIYA","10","E","9617306112","","14/12/99","0"],["43","10790","SATVIK AGRAWAL","10","E","9907292161","","01/05/2000","0"],["44","10438","SHREYAS HANDIEKAR","10","E","9406630055","","16/12/99","0"],["45","10839","SHUBHAM KAPOOR","10","E","8889697971","","31/07/99","0"],["46","9725","SIMRAT CHHABRA","10","E","9425350125","","11/06/1998","0"],["47","9736","TANAY DARDA","10","E","9479357158","","25/12/99","0"],["48","9740","TEJAS AJNAR","10","E","9406681443","","23/06/99","ST"],["49","9742","UMANG CHATURVEDI","10","E","9630445333","","14/03/99","0"],["50","9746","VARUN CHAWLA","10","E","8103182662","","28/01/99","0"],["51","11179","VINAMRA KULKARNI","10","E","9301420009","","28/10/99","0"],["1","8896","ADEEB ALI","11","A1","9425937710","","04/08/1998","0"],["2","4357","ADWAIT JOSHI","11","A1","9425796987","","13/11/98","0"],["3","10796","AMAN SAWANI","11","A1","9575226005","","09/08/1997","0"],["4","9097","ANSHUL GOHAR","11","A1","9669240737","","18/09/97","0"],["5","9235","ANSHUL YADAV","11","A1","9301814462","","07/12/1998","0"],["6","9001","ASHLEY ARUJA","11","A1","9977783762","","29/11/97","0"],["7","4452","ATUL KAUSHAL","11","A1","9893441747","","22/06/98","SC"],["8","9003","ATUL VERMA","11","A1","9993650392","","20/09/97","0"],["9","9053","DHEERAJ SUNDRANI","11","A1","9425963114","","19/07/97","0"],["10","10464","DHIRESH SINGH RATHORE","11","A1","9009543783","","28/08/97","0"],["11","9286","HARSH ARORA","11","A1","9993302911","","01/09/1999","0"],["12","10482","HARSHWARDHAN MEENA","11","A1","9827218211","","18/04/98","0"],["13","9305","JAYESH GARG","11","A1","8226061642","","30/10/98","0"],["14","8919","JOBIN JOSE","11","A1","9754945934","","19/12/97","0"],["15","10099","KARAN KUMAWAT","11","A1","9713134000","","21/07/98","0"],["16","9327","MOHIT JADWANI","11","A1","9425032123","","28/06/98","0"],["17","8721","NOHIT KHERAT","11","A1","9425190740","","19/09/96","0"],["18","4456","PRAJJWAL MATERA","11","A1","8269119713","","12/01/1998","0"],["19","4464","PRATEEK GUPTA","11","A1","9425120673","","03/12/1998","0"],["20","8786","PRIYANK PHILIPS","11","A1","9826555500","","24/06/96","0"],["21","4442","RAGHVENDRA KUMAR SAHU","11","A1","9827949519","","17/03/97","0"],["22","9370","RAJWARDHAN SINGH","11","A1","9827033445","","31/07/98","0"],["23","4441","RISHIRAJ SINGH","11","A1","9926792881","","15/3/98","0"],["24","8450","RONALD SWAMY","11","A1","8964009012","","08/05/1995","0"],["25","9026","SANIL GEORGE","11","A1","9981513433","","14/12/97","0"],["26","8931","SANJAY JOSHI","11","A1","9039189001","","04/10/1997","0"],["27","4438","SARTHAK CHOUBEY","11","A1","9425400596","","26/06/98","0"],["28","9412","SOURABH MEDA","11","A1","","","17/03/98","ST"],["29","8982","SHREYANSH PUNGLIYA","11","A1","7806027080","","22/11/97","0"],["30","4382","SHRVAN KUMAR LAHOTI","11","A1","8602517702","","07/01/1999","0"],["31","9411","SIDDHANT VIREH","11","A1","8349200133","","25/06/98","0"],["32","9034","STEVE TITUS THOMAS","11","A1","9826819926","","21/12/97","0"],["33","10564","TOUQUEER ALI","11","A1","9425055247","","28/02/98","OBC"],["34","9436","VINAY PRATAP SINGH BHADORIA","11","A1","9977818387","","04/01/1998","0"],["35","4465","VIPIN PATIDAR","11","A1","","","08/12/1997","OBC"],["36","4458","YASH CHOPRA","11","A1","7568687060","","26/07/98","0"],["37","4474","NAYAN SONI","11","A1","","","06/04/1998","OBC"],["38","9287","HARSH MANGAL","11","A1","9425055362","","12/02/1998","0"],["39","9008","HITESH BHATIA","11","A1","9074258191","","06/10/1997","0"],["40","4300","PARTH SHARMA","11","A1","9424599901","","31/03/98","0"],["41","4445","PUNIT CHOUDHARY","11","A1","8959202434","","14/09/96","0"],["1","9196","ABDE ALI GULREZ","11","A2","9827262621","","24/01/98","0"],["2","9206","ADITYA GUPTA","11","A2","9826222644","","09/10/1998","0"],["3","9219","AKASH JAIN","11","A2","9893157156","","29/09/98","0"],["4","10089","AMAN BOHRA","11","A2","9425056449","","15/06/98","0"],["5","4362","AMAN JADHAV","11","A2","7879267444","","12/09/1998","OBC"],["6","9241","ARPIT ADVAL","11","A2","9039014588","","03/03/1998","0"],["7","4372","ASHWARY KATHED","11","A2","9926072731","","25/01/98","0"],["8","10141","BURHANUDDIN METRO","11","A2","7566035353","","23/07/98","0"],["9","9259","CHIRAG DODEJA","11","A2","9301230055","","28/03/98","0"],["10","10138","DARSH GANDOTRA","11","A2","9827062709","","30/05/98","0"],["11","10538","DIPANSHU PORWAL","11","A2","9826424924","","19/02/99","0"],["12","9276","GAURAV JAIN","11","A2","9827220107","","09/05/1998","0"],["13","9277","GEET GORANI","11","A2","9826701000","","03/08/1998","0"],["14","9297","HUSSAIN KABA","11","A2","9893327512","","31/08/98","0"],["15","10474","HUZEFA ZAFAR","11","A2","9826150403","","24/01/98","0"],["16","9303","JAI KUMAR MANGHNANI","11","A2","9302569831","","20/04/98","0"],["17","10447","KAMAL RATHORE","11","A2","9826033306","","16/10/97","0"],["18","9318","KUSHAGRA LAHOTI","11","A2","9826084298","","10/11/1998","0"],["19","4450","MANMEET SINGH CHHABRA","11","A2","9425428600","","15/01/98","0"],["20","9331","MURTAZA KIRANAWALA","11","A2","9826087673","","08/12/1998","0"],["21","4365","NAMAN CHHABRA","11","A2","8889370777","","20/06/97","0"],["22","9335","NANDA KRISHNA","11","A2","9425312493","","17/05/98","0"],["23","9336","NANDIT MEHROTRA","11","A2","9827024934","","16/12/98","0"],["24","9344","NIKHIL DODEJA","11","A2","9926300397","","13/10/98","0"],["25","9346","NITIN AGRAWAL","11","A2","9827621858","","25/09/98","0"],["26","10486","NOMAN KHAN","11","A2","9926198457","","11/09/1997","0"],["27","9353","PIYUSH AGRAWAL","11","A2","9827012240","","22/09/98","0"],["28","10078","PRANJAL SHARMA","11","A2","9300003015","","18/12/98","0"],["29","9363","PRASUK JAIN","11","A2","9827093725","","26/01/98","0"],["30","9366","PRIYANSH VIJAYVARGIYA","11","A2","9300024000","","04/03/1998","0"],["31","9371","RAMLAKHAN YADAV","11","A2","9827316939","","25/01/98","0"],["32","9379","RUDRAKSH AGRAWAL","11","A2","9826077075","","29/04/98","0"],["33","9382","SAGAR DODEJA","11","A2","9826023455","","26/03/98","0"],["34","10835","SANDEEP GURNANI","11","A2","9826097305","","05/11/1999","0"],["35","4210","SARTHAK MANDOVRA","11","A2","8305948477","","04/08/1998","0"],["36","4437","SARTHAK AGRAWAL","11","A2","9425060583","","10/06/1998","0"],["37","10498","SAVINAY NATH","11","A2","8103109198","","16/06/98","SC"],["38","9408","SHUBHAM SALGIA","11","A2","9977351448","","17/08/98","0"],["39","9416","SUYASH PRATAP SINGH SENGAR","11","A2","9981531663","","16/05/98","0"],["40","9418","TANAY JAIN","11","A2","9425353935","","07/04/1998","0"],["41","10149","UTSAV BADERA","11","A2","9713460247","","12/03/1998","0"],["42","9448","YOGESH HASIJA","11","A2","9425312284","","07/08/1998","0"],["43","9446","YASHOVARDHAN SENGAR","11","A2","9425059009","","25/12/98","0"],["44","4473","PULKIT ARORA","11","A2","","","05/09/1997","0"],["45","9412","SAURABH MEDA","11","A2","9406717694","","17/03/98","ST"],["1","9193","AASHAY MAMMEN","11","B","9893203510","","08/07/1998","0"],["2","9211","ADITYA RAJ MALOO","11","B","9425063729","","24/12/98","0"],["3","9425","AKSHAT JOSHI","11","B","9926013665","","30/12/98","0"],["4","10597","AKSHAT VERMA","11","B","9301606644","","07/12/1998","0"],["5","9479","ANIRUDH SHRIVASTAVA","11","B","9425311600","","03/11/1998","0"],["6","9234","ANSHUL KHANDELWAL","11","B","","","26/11/98","0"],["7","9239","AREEB JAFRI","11","B","9425050529","","06/08/1998","0"],["8","4367","ATUL SOLANKI","11","B","","","01/09/1998","OBC"],["9","9249","AVIKAL CHATURVEDI","11","B","9425315179","","15/06/98","0"],["10","9255","BURHANUDDIN DEWASWALA","11","B","7869031703","","12/03/1998","0"],["11","9264","DEVESH MEV","11","B","9425066900","","28/03/98","0"],["12","9272","DIVYANSH TRIPATHI","11","B","9329433510","","03/07/1998","0"],["13","9284","HARDIK SHAH","11","B","9893224949","","11/11/1998","0"],["14","9296","HRIDYANSH JOSHI","11","B","8989548380","","30/09/98","0"],["15","9791","KARTIKEYA GARGAV","11","B","9424083195","","01/07/1999","0"],["16","9313","KANISHK PANDEY","11","B","9893026152","","10/12/1998","0"],["17","9460","KRISHNA BUDHOLIA","11","B","9584621888","","12/07/1998","0"],["18","9315","KRISHNA SONI","11","B","9425031996","","02/09/1999","0"],["19","10122","MANVENDRA SINGH JADAUN","11","B","9425332711","","26/06/98","0"],["20","10481","MUBASHIR ZAMAN KHAN","11","B","8959789312","","15/04/98","0"],["21","9342","NICK AGRAWAL","11","B","9826064721","","19/03/98","0"],["22","9368","RAHIL JAIN","11","B","9827049169","","12/09/1998","0"],["23","9374","RISHABH SARRAF","11","B","8962536123","","18/12/97","0"],["24","9377","ROHIT TIWARI","11","B","9826076434","","05/10/1998","0"],["25","9387","SAHIL TELANG","11","B","945060705","","26/04/98","0"],["26","9391","SARTHAK NEEMA","11","B","9827740908","","13/09/98","0"],["27","9393","SARTHAK VIREH","11","B","9827247166","","25/06/98","0"],["28","9288","SANKET PANDEY","11","B","9827243617","","22/03/99","0"],["29","4451","SHIVPAL SINGH SOLANKI","11","B","9926841365","","31/08/97","0"],["30","9792","SURYANSH SINGH PARMAR","11","B","9826013311","","20/06/98","0"],["31","9421","TANISHQ KHETPAL","11","B","9993051011","","12/10/1998","0"],["32","9427","VASU AGRAWAL","11","B","9165900001","","29/05/98","0"],["33","9433","VEDISH BELANI","11","B","9424819333","","12/03/1998","0"],["34","8939","WASI SHEIKH","11","B","9827069440","","18/10/97","0"],["35","9443","YASH JAIN","11","B","9893243198","","28/09/98","0"],["36","8901","ANIKET VATSA","11","B","9407406338","","28/01/98","0"],["37","4375","ANSHUL AD","11","B","9425362671","","13/08/98","ST"],["38","9328","MOHIT YADAV","11","B","8435769298","","12/03/1998","0"],["39","4446","NARAYANE VANAD VIVEK","11","B","9752496051","","26/10/98","0"],["40","9360","PRAKHAR S. SENGAR","11","B","9329779890","","16/09/98","0"],["41","9372","RISHABH GONTIYA","11","B","945060705","","12/10/1998","0"],["42","8679","SAMUEL DANIEL","11","B","9303225587","","09/10/1996","0"],["43","9400","SHANTANU PAL","11","B","8305696141","","18/01/99","0"],["44","9767","SHUBHAM BHAWAR","11","B","9926500530","","23/11/99","0"],["45","10819","YASH GUPTA","11","B","9424091567","","30/08/98","0"],["1","9202","ABHISHEK DUBEY","11","C","9977478666","","02/10/1999","0"],["2","4220","ABDULLAH ANSARI","11","C","9406631650","","15/07/98","0"],["3","9205","ADISH JAIN","11","C","9425869803","","17/08/98","0"],["4","9220","AKSHAT GUJRAL","11","C","9926039210","","13/08/98","0"],["5","4376","ANSHUL BHARTI","11","C","9406718016","","30/03/98","SC"],["6","10153","ARBAZ KHAN","11","C","9826917862","","29/04/97","0"],["7","9778","AYUSH DIXIT","11","C","9827308891","","07/05/1998","0"],["8","9267","DHAWAL SHAH","11","C","9826655204","","06/11/1998","0"],["9","9790","GANDHARVA PABLE","11","C","7354270448","","15/06/98","OBC"],["10","9279","GLENN D SOUZA","11","C","9301154001","","17/03/99","0"],["11","4302","HARSH SHARMA","11","C","9425804970","","20/01/99","0"],["12","9292","HARSH WALTER","11","C","8889579177","","08/01/1998","0"],["13","9298","HUSSAIN ENGINEERINGWALA","11","C","9039937272","","15/09/98","0"],["14","9312","KANISHKA JAIN","11","C","","","27/05/98","0"],["15","10014","KARANPAL SINGH CHHABRA","11","C","9754527567","","19/01/99","0"],["16","9314","KEYUR SHAH","11","C","9827650543","","13/09/98","0"],["17","9316","KSHITIJ AWASTHI","11","C","9770050598","","12/05/1998","0"],["18","9323","MANEET SINGH SALUJA","11","C","9425475270","","29/06/98","0"],["19","4454","MD. FAHAD KHAN","11","C","","","19/07/98","0"],["20","10476","MILIND MEHTA","11","C","","","24/04/98","0"],["21","8964","MRATUNJAY SINGH CHOUHAN","11","C","9165454707","","01/01/1998","0"],["22","9332","NACHIKET KATE","11","C","8964091964","","07/06/1998","0"],["23","4315","ROBIN SHIBU BABY","11","C","9074770077","","10/02/1998","0"],["24","9450","ROMIL JAIN","11","C","9827096228","","17/01/99","0"],["25","9378","RONIT KUMAR EMMANUEL","11","C","9406800551","","24/06/98","ST"],["26","8961","SAAYED MAZIN ALI","11","C","9827253532","","18/09/97","0"],["27","9386","SAHIL NARULA","11","C","9630009585","","10/04/1998","0"],["28","9388","SAMUEL ANMOL MASIH","11","C","8234949372","","09/10/1998","0"],["29","9389","SAQUIB SADIQUE QURESHI","11","C","9827360080","","17/10/98","0"],["30","4407","SHAIEL MURZE","11","C","","","18/01/99","0"],["31","9403","SHIVAM SHUKLA","11","C","9926612699","","23/05/98","0"],["32","4364","SHUBHAM PANDEY","11","C","9826614261","","03/11/1999","0"],["33","9081","SIDDHANT MASIH","11","C","9424052255","","29/10/97","0"],["34","9032","SIMRANJEET SINGH SALUJA","11","C","9630550066","","01/10/1998","0"],["35","9413","SPARSH AGRAWAL","11","C","900921799","","06/02/1998","0"],["36","10102","SUHAIB SHEIKH","11","C","8818888610","","03/08/1997","0"],["37","10784","SUMIT SINGH RAJAWAT","11","C","9893612233","","29/12/98","0"],["38","10562","UMANG KANTAWALA","11","C","9425032420","","26/05/98","0"],["39","9454","VANSHAJ SINGH","11","C","9407138179","","27/11/99","0"],["40","9428","VED VYAS","11","C","9425056123","","20/06/98","0"],["41","9439","VISHESH SAXENA","11","C","9300063911","","04/02/1998","0"],["42","9447","YASH PARMAR","11","C","9826953273","","08/08/1998","0"],["43","9449","YUVRAJ SINGH MEHTA","11","C","9826297709","","28/09/98","0"],["1","9203","ABHISHEK SARASWAT","11","D","9993232857","","22/03/98","0"],["2","9208","ADITYA MATHUR","11","D","8989759472","","12/08/1998","0"],["3","9210","ADITYA PAUL","11","D","9826427011","","09/05/1998","0"],["4","9212","ADITYA SANGANERIA","11","D","9827735466","","10/08/1998","0"],["5","4206","AMMAR ALAVI","11","D","9893494852","","12/05/1997","0"],["6","4461","ANANT AARADHYA SINHA","11","D","8889568885","","11/09/1998","0"],["7","9237","ARADHYA TONGIA","11","D","9826020767","","15/11/98","0"],["8","9257","CHINMAY PACHARNE","11","D","9827038921","","10/06/1998","OBC"],["9","9278","GITESH BHAYANA","11","D","9826429159","","22/04/98","0"],["10","9282","HARDIK BANSAL","11","D","9425074043","","15/09/98","0"],["11","4449","HITESH MISHRA","11","D","9425460081","","14/01/98","0"],["12","4455","HUSAIN SAIFY BARDAWALA","11","D","9668916748","","07/05/1998","0"],["13","9783","KHAWAR MOHAMMAD KHAN","11","D","9425081194","","28/08/98","0"],["14","10147","MAYANK SEN","11","D","9893260031","","13/11/98","0"],["15","9345","NISHANT DEVNANI","11","D","9827083552","","17/09/98","0"],["16","9348","NOMAN HAMZA KHAN","11","D","8120964112","","08/05/1997","0"],["17","9369","RAHUL GANGWAL","11","D","9893113294","","07/04/1998","0"],["18","9380","RUDRAKSH SHUKLA","11","D","9425312849","","02/02/1998","0"],["19","4368","SAARTHAK SANGAMNERKAR","11","D","9023277888","","31/01/99","0"],["20","9381","SACHMEET SINGH BHATIA","11","D","9826630786","","25/12/98","0"],["21","9405","SHIVANK AWASTHI","11","D","9826038033","","13/07/98","0"],["22","4448","SOURAV YADAV","11","D","9826013158","","08/01/1998","0"],["23","4301","SWARAJ GUPTA","11","D","9993375342","","14/04/98","0"],["24","9417","SWETANK VAIDYA","11","D","7049609020","","09/10/1998","0"],["25","9762","YATHARTHA PATANKAR","11","D","9229426996","","31/08/98","0"],["26","9217","AKANSH SHARMA","11","D","9425059042","","10/05/1998","0"],["27","4436","ASHWIN JOHNSON","11","D","9827535983","","15/05/99","0"],["28","9227","ANEESH ISSAC","11","D","9575432535","","10/09/1998","0"],["29","9236","ANUKOOL SHRIVASTAVA","11","D","9424829068","","04/05/1998","0"],["30","9274","FAIZAN AHMED ANSARI","11","D","9425347117","","27/07/98","0"],["31","9295","HEMANT KUMAR PARE","11","D","7879269066","","04/04/1998","0"],["32","9310","JYOTIRADITYA SINGH CHANDEL","11","D","9425073530","","28/04/98","0"],["33","9216","KABEER AHAD HUSSAIN","11","D","9826178655","","11/07/1998","0"],["34","9459","KRISHNA KHATRI","11","D","9424090811","","16/09/98","0"],["35","4440","KUNJAN THEODORE JOSEPH","11","D","9009906003","","05/09/1998","0"],["36","10101","MOHAMMAD ATIF SHEIKH","11","D","8818888610","","30/03/99","0"],["37","4443","MOHD. SULTAN FAROOQUI","11","D","9826330951","","13/09/98","0"],["38","4361","NAHUSH SINGARE","11","D","9753759688","","04/06/1999","ST"],["39","9340","NEERAJ VERMA","11","D","7694012202","","03/09/1999","0"],["40","4463","PARAKH KHICHI","11","D","","","12/12/1998","0"],["41","4182","PIYUSH NAGORE","11","D","9473766870","","30/10/97","0"],["42","4293","PRAKHAR JYOTI","11","D","8109008545","","14/09/98","0"],["43","8975","SAMUEL P EMMANUEL","11","D","9907244900","","12/08/1997","0"],["44","10707","SWARAJ BATHAM","11","D","9893028450","","13/12/98","0"],["45","9426","VAIBHAV YADAV","11","D","9926912818","","23/10/98","0"],["1","9093","AKSHANK JAIN","12","A","9826010834","","35700","0"],["2","8947","AMBER MANGAL","12","A","9229076713","","35561","0"],["3","4435","ANSHUL TIWARI","12","A","9425948088","","35445","0"],["4","9000","ANUJ VERMA","12","A","9826043145","","35771","0"],["5","9101","AYUSH CHOPRA","12","A","9099022856","","35554","0"],["6","9060","JALAJ RANKA","12","A","9630032001","","35603","0"],["7","8670","NIKHIL WADHWANI","12","A","9926008000","","35271","0"],["8","9072","PRANAY MEHTA","12","A","9301265930","","25/11/97","0"],["9","9120","PULKIT KHANDELWAL","12","A","9926805504","","35576","0"],["10","9076","RAVINDER SINGH AHUJA","12","A","9827060590","","35804","0"],["11","8973","SAJAL CHANDAK","12","A","9926667928","","35465","0"],["12","8984","SHUBHAM KAPOOR","12","A","9425912809","","35580","0"],["13","8687","TUSHAR MANGLANI","12","A","9826289592","","12/12/1996","0"],["14","10076","VARUN GUPTA","12","A","9425054041","","35586","0"],["15","4335","VISHAL KALANI","12","A","9425066821","","35748","0"],["16","9786","VIVEK MEENA","12","A","9826363166","","35582","0"],["17","8525","AAYUSH GHADGE","12","A","","","11/01/1995","0"],["18","8891","AAYUSH KESWANI","12","A","9425906800","","35473","0"],["19","4388","ABHIJEET EKKA","12","A","7869993555","","35860","0"],["20","8637","ABHIJIT YADAV","12","A","9630200686","","35304","0"],["21","8303","ABHISHEK DOMINIC","12","A","9754799878","","34762","0"],["22","8757","AKSHAY TOMAR","12","A","9826374540","","25/12/96","0"],["23","9047","AMAN ARORA","12","A","9993302911","","35579","0"],["24","8900","AMANDEEP CHHABRA","12","A","9425057581","","35367","0"],["25","4444","ANSHUL JAIN","12","A","9644437773","","02/04/1998","0"],["29","8702","ANSHUL SOLANKI","12","A","","","35174","0"],["30","8365","BHALESH KUSHWAHA","12","A","9039573510","","34946","0"],["31","8915","DEVAESH BHATIA","12","A","9755020064","","35652","0"],["32","8771","DILPREET SINGH TUTEJA","12","A","7415773200","","35412","0"],["33","9760","FLEVIN ALEX","12","A","9425494566","","35681","0"],["34","8089","GREGORY D SOUZA","12","A","7748008319","","34659","0"],["35","8544","JOYISH JOSEPH","12","A","9630271334","","34827","0"],["36","9065","MCCLAIN ERIC BASTIAN","12","A","9425911310","","35783","0"],["37","9066","MEET SHAH","12","A","9827025101","","35565","0"],["38","8718","MOHIT THAWRANI","12","A","9407122068","","35392","0"],["39","4233","MUDASSIR CHANDOREWALA","12","A","9754032691","","10/09/1997","0"],["40","9015","MUKUL AGRAWAL","12","A","9926059776","","35719","0"],["41","4305","NIKHIL KUJUR","12","A","","","29/08/1996","0"],["42","9075","RAHUL JAIN","12","A","9826158700","","35653","0"],["43","8971","RAJEEV AGRAWAL","12","A","9685526500","","35611","0"],["44","7746","SABESTIAN DIXON","12","A","9893957138","","34177","0"],["45","8792","SACHIN DOSHI","12","A","9425065329","","35256","0"],["46","9796","SAMEER KHAN","12","A","9827287032","","35166","0"],["47","8983","SHUBHAM JAISWAL","12","A","9826145153","","35773","0"],["48","8796","SPARSH SHUKLA","12","A","9826049628","","35181","0"],["49","9082","TAHER NADEEM","12","A","9826012476","","12/10/1996","0"],["50","8630","VIKAS VERMA","12","A","9425607744","","35078","0"],["51","8633","YASH JOSHI","12","A","9981780661","","35298","0"],["52","8898","AKSHAT TIWARI","12","A","9425319449","","29/06/97","0"],["53","9096","ANIMESH SAWLANI","12","A","","","35336","0"],["54","8911","ASHWIN CHOUKSEY","12","A","9098272596","","35904","OBC"],["55","4415","RAJEEV ARNOLD FRANCIS","12","A","9669696742","","35850","0"],["56","9122","RISHABH JAIN","12","A","9425318005","","35387","0"],["57","8855","RUDRA YADAV","12","A","9425351516","","35407","0"],["58","8797","SUDANSH MISHRA","12","A","9009877322","","35429","0"],["59","9135","VIRAL DHANOTE","12","A","9425313016","","35450","0"],["60","10152","YASH MATAI","12","A","","","10/08/1997","0"],["1","9004","AAYUSH DESHMANKAR","12","B","9827255950","","35668","0"],["2","10086","ABHISHEK LALWANI","12","B","9425125691","","35718","0"],["3","8899","AISHWIK WADHWANI","12","B","9826310101","","35530","0"],["4","8944","AKASH GAUTAM","12","B","9425055032","","35589","0"],["5","4235","ARYAN KAUSHAL","12","B","","","26/12/98","OBC"],["6","4264","ASHUTOSH SHARMA","12","B","9926001261","","15/03/97","0"],["7","9478","DIVYANSH SHARMA","12","B","9826940752","","35821","0"],["8","4432","GARV SOLANKI","12","B","9827655963","","35591","SC"],["9","4219","HARDIK UPADHYAY","12","B","9827636460","","11/08/1997","0"],["10","4319","HARSHIT CHOURASIYA","12","B","9425122758","","11/03/1996","0"],["11","9882","HARSHIT SANWAL","12","B","9993487271","","35235","0"],["12","8918","HUZEFA SHAKIR","12","B","8602133631","","35627","0"],["13","9009","IBRAHIM KHAMBATI","12","B","9755999955","","35797","0"],["14","4159","JALAJ AGRAWAL","12","B","9406614950","","17/11/96","0"],["15","8922","KARTIK VYAS","12","B","9826094219","","25/09/97","0"],["16","8923","KUNAL DHANAITKAR","12","B","9826611156","","35613","0"],["17","9663","KUSHAGRA SHROFF","12","B","9826551701","","35478","0"],["18","10414","MOHAMMED SAFDARI","12","B","9479445252","","28/09/97","0"],["19","9113","MOHAMMED UMAR FAROQUE KHAN","12","B","9906800818","","35721","0"],["20","4339","MOHD. AMAN SYED","12","B","9827043000","","35936","0"],["21","9014","MOUSAM PATIDAR","12","B","9826013750","","35659","0"],["22","8724","PRANAM SHARMA","12","B","9302108513","","35319","0"],["23","9074","PRINCE KEWLANI","12","B","","","35678","0"],["24","4240","SAJAL SONI","12","B","9993344443","","11/08/1997","0"],["25","8930","SAMYAK JAIN","12","B","9425065422","","35580","0"],["26","8739","SATYAJIT SINGH KUSHWAH","12","B","8962648864","","34828","0"],["27","9079","SHIKHAR UPRETI","12","B","9302550499","","35633","0"],["28","8742","SIDDHARTH S. JAIN","12","B","7898981753","","35198","0"],["29","8987","SUDARSHAN DESHMANKAR","12","B","9827255950","","35668","0"],["30","9132","TASKEEN KHAN","12","B","","","35603","0"],["31","9133","UDIT SINGH","12","B","9755097528","","35613","0"],["32","4166","VIKALP S RAJPUT","12","B","8982848123","","27/03/97","0"],["33","9041","YASHWANT LADDHA","12","B","9826026500","","35737","0"],["34","9138","YUVRAJ NAGAR","12","B","","","35795","0"],["35","8755","ADHIKESH JADHAV","12","B","","","35250","SC"],["36","9044","AKSHAD MUKATI","12","B","9575325637","","08/12/1997","0"],["37","10028","PRASOON UPADHYAY","12","B","9977101212","","35670","0"],["38","9023","SAHIL JAISWAL","12","B","9826118239","","35641","OBC"],["39","4259","SAURAV ROZATKAR","12","B","9425085408","","12/07/1996","SC"],["40","10137","SUFIYAN GHORI","12","B","9827522432","","35184","0"],["41","4439","SUMUKH LAAD","12","B","9926524810","","03/11/1997","0"],["42","9170","VINAY SINGH YADAV","12","B","9425957343","","27/08/99","0"],["43","8940","YASH KUSHWAHA","12","B","9425066649","","35765","OBC"],["1","4311","ABHIJEET SINGH THAKUR","12","C","9827289868","","24/01/1998","0"],["2","9167","ABHISHEK KHANDELWAL","12","C","","","17/05/97","0"],["3","9153","ADITYA AJIT","12","C","9329212720","9691537242","35639","0"],["4","4202","AKSHAT KHARE","12","C","9826742580","","15/09/96","0"],["5","8996","AMAN MAHESHWARI","12","C","9303229621","9479981703","35777","0"],["6","4309","ANIRUDDH BHARADWAJ","12","C","9424577560","","03/11/1998","0"],["7","8999","ANUJ PAPRIWAL","12","C","9425313546","9406620965","35574","0"],["8","8648","ANURAG MINJ","12","C","9009784247","","12/02/1995","0"],["9","8906","ARBAN DOSSABHOY","12","C","9752593468","","35539","0"],["10","8912","AVIRAL MISHRA","12","C","9893868719","","35797","0"],["11","9051","AYUSH SHARMA","12","C","9669017005","7869061637","35595","0"],["12","9872","AYUSH SONI","12","C","9424578205","9406834362","35736","0"],["13","4222","BHUVANESH DANI","12","C","9589572001","","23/02/98","0"],["14","9104","DIVYANSH ACHARYA","12","C","9826022720","9826037560","18/06/98","0"],["15","4326","GAURAV KOHAD","12","C","9425003540","","19/03/1997","0"],["16","9006","HAMZA FIDVI","12","C","9826037096","9926002223","35584","0"],["17","9804","JEBIN TOMY","12","C","9424513878","9425351816","30/09/97","0"],["18","8958","LAVISH MEHTA","12","C","9425054470","","35693","0"],["19","4358","MADHAV GUPTA","12","C","9425481148","","35693","0"],["20","9800","MAYANK CONTRACTOR","12","C","9425059598","9425903698","35510","0"],["21","9111","MOHAMMED MILLWALA","12","C","9977252934","","35692","0"],["22","9112","MOHAMMED MUSHEER MEER","12","C","9009955786","8109494220","35719","0"],["23","4409","NAYAN DIXIT","12","C","9479670699","","12/10/1997","0"],["24","8928","RAM KUMAR CHUGH","12","C","9425347693","","35680","0"],["25","4327","RISHABH FAFRIYA","12","C","9009020347","","31/10/1996","0"],["26","10461","RISHI JAIN","12","C","8989505974","8821950124","35666","0"],["27","8972","SACHIN PATIL","12","C","9425064256","","35552","0"],["28","8785","SAURABH JAISWAL","12","C","9713133657","","35320","OBC"],["29","8980","SHANTANU PAGARE","12","C","9425032465","","35532","0"],["30","4417","SHASHANK RAMAN","12","C","9425984089","","20/05/97","S C "],["31","9028","SHASHWAT GUPTA","12","C","9669881477","2419682","35797","0"],["32","8981","SHIVANSH MODI","12","C","9425032111","","35737","0"],["33","9807","SHREYAN JOSHI","12","C","9770015810","9200241169","35552","0"],["34","4118","SIDDHARTH JHAWAR","12","C","9425160150","","35601","0"],["35","9083","TANISHQ SHUKLA","12","C","8989464460","9424539927","25/12/97","0"],["36","4282","TANMAY PATHAK","12","C","8827629657","","07/01/1998","0"],["37","4127","TEJESHWAR S. SOLANKI","12","C","9009555924","","35809","0"],["38","4250","VEDANT PARMAR","12","C","8818959577","","10/06/1997","0"],["39","10483","VIKAS BHUTRA","12","C","9303471010","9302217366","08/09/1996","0"],["40","9134","VINAY PANDHARIWAL","12","C","9425063104","8982439725","35613","0"],["41","8990","YASH GARG","12","C","","","35611","0"],["42","9088","YASH VERMA","12","C","8120888866","9425064738","35567","0"],["43","4332","AADITYA SINGH","12","C","8989936472","","35544","0"],["44","9127","SAMAGRA JAIN","12","C","9425058994","9406614297","35580","0"],["1","8994","AKASH LOVELY","12","D","9753468113","9179314372","35534","0"],["2","4355","AKSHAT MEHTA","12","D","9406934856","9424583506","18/08/97","0"],["3","10106","ANAMI KUMPAWAT","12","D","7354432033","8818910392","35739","SC"],["4","9095","ANIMESH NIGHOJKAR","12","D","9425055004","9893324646","35618","0"],["5","8998","ANSHUL JAIN","12","D","9303224752","9300480760","35530","0"],["6","4318","ANTRIKSH GUPTA","12","D","7746811558","9229641592","07/02/1997","0"],["7","9098","ANURAG JOHARI","12","D","9425055726","9826745171","35467","0"],["8","8910","ASHUTOSH YADAV","12","D","9425054092","9425910092","35765","OBC"],["9","10449","AVNISH BANSAL","12","D","8989548875","9981724454","35829","0"],["10","9005","BHAVIN JAWADE","12","D","9425935098","9827090097","35793","0"],["11","9651","CHIRAG KAHANDELWAL","12","D","9826149068","9926276589","35769","0"],["12","9064","MANAV BENIWAL","12","D","9425063759","7869874006","22/09/97","OBC"],["13","9012","MAYANK SALSANKAR","12","D","9617983359","9893920026","35729","0"],["14","9110","MITARTHA UPADHYAY","12","D","9179761106","9893496264","35758","0"],["15","10473","NIMISH PASTARIA","12","D","9425495776","9424395034","35736","0"],["16","4320","PRANJAL NAMDEO","12","D","","","02/06/1997","OBC"],["17","4303","PRATEEK ARORA","12","D","9977156753","9424811448","19/01/1998","0"],["18","9362","SHABARISH P PILLAI","12","D","7415184823","9039490593","35657","0"],["19","4255","SHIKHAR CHANDNANI","12","D","9893220215","8827355255","24/12/97","0"],["20","4411","SHUBHENDU OJAS TEWARY","12","D","9584933313","8518018983","27/09/97","0"],["21","9131","STEVE SHREEDHAR","12","D","9406903835","9755066531","35759","0"],["22","9162","VENKATESHA PANCHOLI","12","D","9893201377","9893271377","14/12/97","0"],["23","4201","YUGANSH ARORA","12","D","9826536363","9926760193","23/12/1997","0"],["24","8895","ABI WAQQAS GHORI","12","D","","","35867","OBC"],["25","10113","HIMANK AGRAWAL","12","D","9424899000","8989066900","35644","0"],["26","9107","JAYESH DARYANI","12","D","9977167714","9893432601","35686","0"],["27","9128","SAMARTH SHUKLA","12","D","9826020374","7697719876","35687","0"],["28","8179","ZEESHANUL HASAN ZAIDI","12","D","9179387269","9179387274","34661","0"],["29","4308","SHIVAM CHATURVEDI","12","D","9993690009","9993690008","23/02/1998","0"],["30","10080","SHUBHAM KAPSHE","12","D","9969220640","9424885010","35552","0"],["31","8907","ARJUN SHARMA","12","D","9039905858","","35766","0"],["32","4116","AYUSH MANDLOI","12","D","9755096055","9826066322","35742","0"],["33","4312","PANKAJ CHOUDHARY","12","D","9893915936","","16/11/1997","OBC"],["34","10479","PARIJAT MISHRA","12","D","9893431622","9425911231","35949","0"],["35","8610","PARTH YADAV","12","D","9826035400","2433110","21/11/96","0"],["36","9070","PRANAV GOSAVI","12","D","","","35789","0"],["37","4346","RAJESHWAR PAL","12","D","9425965931","9926233563","25/04/98","0"]];
//batchInsertUser(userDataList,"dav:cbse:1990:122001");

function batchInsertUser(jsonData,schoolId){
	log.info("@@@@@ ::::: User.batchInsertUser : ENTER.");
    var loggedInUser=new UserClassModel();
    loggedInUser.schoolDetails.schoolId=schoolId;
    //dummy res
    var res={"json":function(obj){console.log("obj",obj)}};
    //var userObjList=[];
    for(var i= 1,loopLen=jsonData.length;i<loopLen;i++){
        var row=jsonData[i];
        var strCheck=row.join("").replace(/\s+/g,"");
        if(strCheck=="") continue;
        var userObj=new UserClassModel();

        //regID
        userObj.basicDetails.regID=row[1];
        //cast text
        userObj.basicDetails.casteId=row[8];

        //name
        var name=row[2];
        var nameArr=name?name.split(" "):[];
        nameArr.length>0?userObj.basicDetails.firstName=nameArr[0]:"";
        nameArr.length>1?userObj.basicDetails.lastName=nameArr[1]:"";
        userObj.basicDetails.userName=nameArr.join("_")+userObj.basicDetails.regID;
        userObj.basicDetails.userType=schoolId+"||1";//student
        //DOB
        var dob=Utils.ddmmyyyyStrToTimeStamp(row[7]);
        (dob && !isNaN(dob))?userObj.basicDetails.DOB=dob:"";

        userObj.contact.phonePrimary=row[5];
        userObj.contact.phoneSecondary=row[6];

        userObj.class={"name":row[3],"section":row[4]};
        //userObj.class={"name":'X',"section":'A'};
        userObj.classRollNum=parseInt(row[0]);
        //userObjList.push(userObj);
        addNewUser(userObj,loggedInUser,res);
    }
    log.info("@@@@@ ::::: User.batchInsertUser : EXIT.");
}
module.exports.batchInsertUser=batchInsertUser;

/* Match given user for the requested user*/
module.exports.matchPasswordData = function(user,checkData,req,res) {
	log.info("@@@@@ ::::: User.matchPasswordData : ENTER.");
	var responseObj = new Utils.Response();
	var query = 'MATCH (n:User{userName:"' + user.userName + '",hashPassword:"' +checkData.oldPassword + '"})  RETURN n';

	console.log("matchPasswordDatar query :", query);
	db.cypherQuery(query, function(err, reply) {
		console.log("matchPasswordDatar :", query, err, reply);
		if (!err) {
			responseObj.responseData = reply.data.length;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "Password is wrong.";
			res.json(responseObj);
		}
	});
	log.info("@@@@@ ::::: User.matchPasswordData : EXIT.");
}

/****** Punch Time Details **************/

module.exports.punchTimeGetDetails = function(loggedInUser,res) {
	log.info("@@@@@ ::::: User.punchTimeGetDetails : ENTER.");
	var responseObj = new Utils.Response();
	var today=new Date();
	var todayStr=today.getFullYear()+"_"+(today.getMonth()+1)+"_"+today.getDate();
	var searchQueryConfig=userQueryRepository.searchCheckInQuery(todayStr);
	var dataResolver={
		"User":{userName:loggedInUser.basicDetails.userName}
	};
	var querySearchObj=Query(searchQueryConfig,dataResolver);
	console.log("Search Query",querySearchObj.responseData);
	db.cypherQuery(querySearchObj.responseData, function(err, reply) {
		if (!err && reply.data.length > 0) {
			var itrmData = reply.data[0];
			var arr = [];
			for(var key in itrmData){
				if(key!="_id") {
					arr.push(parseInt(key.split("_")[1]));
				}
			}
			arr=arr.sort(function(a,b){
				return a<b;
			});
			var newKey = "_"+arr[0];
			if(reply.data[0][newKey] == "checkout"){
				responseObj.responseData = reply;
				responseObj.status = true;
				responseObj.lastlogged = arr[0];
				res.json(responseObj);
			}else if(reply.data[0][newKey] == "checkin"){
				responseObj.responseData = reply;
				responseObj.status = false;
				responseObj.lastlogged = arr[0];
				res.json(responseObj);
			}
		} else if(!err) {
			for(var key in reply.data[0]){
				if(key!= "_id") {
					var d = parseInt(key.split("_")[1]);
					console.log("**************",d);
					responseObj.lastlogged = d;
				}
			}
			responseObj.responseData = reply;
			responseObj.status = true;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	log.info("@@@@@ ::::: User.punchTimeGetDetails : EXIT.");
};
function isCheckInOut(data){
	log.info("@@@@@ ::::: User.isCheckInOut : ENTER.");
	var tsArr=Object.keys(data);
    var retVal="";
    if(tsArr.length>0){
        var tempArr=[];
        for(var i= 0,len=tempArr.length;i<len;i++){
            var tempStr=tempArr[i];
            tempArr.push(parseInt(tempStr.split("_")[1]));
        }
        tempArr=tempArr.sort(function(a,b){
            return a<b;
        });
        var currentVal=data["_"+tempArr[0]];
        retVal=currentVal=='checkin'?"checkout":'checkout';
    }else{
        retVal= "checkin";
    }
    return retVal;
    log.info("@@@@@ ::::: User.isCheckInOut : EXIT.");
}
module.exports.saveUserPunchTimeDetailsFromREST = function(userName,res) {
	log.info("@@@@@ ::::: User.saveUserPunchTimeDetailsFromREST : ENTER.");
    var responseObj = new Utils.Response();
    var today=new Date();
    var todayStr=today.getFullYear()+"_"+(today.getMonth()+1)+"_"+today.getDate();
    var searchQueryConfig=userQueryRepository.searchCheckInQuery(todayStr);
    var dataResolver={
        "User":{userName:userName}
    };
    var querySearchObj=Query(searchQueryConfig,dataResolver);
    if(!querySearchObj.error){
        var querySearch=querySearchObj.responseData;
        console.log("CheckinOut Main:",querySearch);
        db.cypherQuery(querySearch,function(err,reply){
            if(err){
                console.log("Error Found",err);
            }else {
                var queryObj = [];
                console.log("******REPLY******",reply);
                if (reply && reply.data.length > 0) {
                    var data=reply.data[0];
                    var operation=isCheckInOut(data);
                    var tm=Date.now();
                    var ts="_"+tm;
                    var q = 'MATCH (us:User)<-[inoutRel:CheckInOut_' + todayStr + ']-(inout:CheckInOut)  WHERE us.userName="' + userName+ '" WITH inout ' +
                        'SET inout.' + ts + '="' + operation + '" RETURN inout';
                    db.cypherQuery(q, function(err, reply) {
                        console.log("updateCheckInQuery:", q, err, reply);
                        if (!err) {
                            var obj={};
                            obj[ts]=operation;
                            responseObj.responseData = {time:tm,operation:operation};
                        } else {
                            responseObj.error = true;
                            responseObj.errorMsg = "Contact Admin!";
                        }
                        res.json(responseObj);
                    });
                } else {
                    var operation="checkin";
                    var tm=Date.now();
                    var ts="_"+tm;
                    var itrObj={};
                    itrObj[ts]=operation;
                    queryObj = userQueryRepository.createCheckInQuery(todayStr);
                    dataResolver["CheckInOut"] = itrObj;
                    querySearchObj=Query(queryObj,dataResolver);
                    querySearch=querySearchObj.responseData;
                    db.cypherQuery(querySearch, function(err, reply) {
                        console.log("createCheckInQuery:", querySearch, err, reply);
                        if (!err) {
                            responseObj.responseData = {time:tm,operation:operation};
                        } else {
                            responseObj.error = true;
                            responseObj.errorMsg = "Contact Admin!";
                        }
                        res.json(responseObj);
                    });
                }
            }
        });
    }
    log.info("@@@@@ ::::: User.saveUserPunchTimeDetailsFromREST : EXIT.");
};
module.exports.saveUserPunchTimeDetails = function(user,punchDetails,req,res) {
	log.info("@@@@@ ::::: User.saveUserPunchTimeDetails : ENTER.");
	var responseObj = new Utils.Response();
	var today=new Date();
	var todayStr=today.getFullYear()+"_"+(today.getMonth()+1)+"_"+today.getDate();
	var searchQueryConfig=userQueryRepository.searchCheckInQuery(todayStr);
	var dataResolver={
		"User":{userName:punchDetails.userName}
	};
	var querySearchObj=Query(searchQueryConfig,dataResolver);
	var itrObj = {};
	if("checkin" in punchDetails){
		var checkinDate = (punchDetails.checkin).toString();
		checkinDate = "_"+checkinDate;
		itrObj[checkinDate] = 'checkin';
	}else if("checkout" in punchDetails){
		var checkoutDate = (punchDetails.checkout).toString();
		checkoutDate = "_"+checkoutDate;
		itrObj[checkoutDate] = 'checkout';
	}else{
		var checkinDate = (punchDetails.checkin).toString();
		checkinDate = "_"+checkinDate;
		itrObj[checkinDate] = 'checkin';
	}
	console.log("***********itrObj********",itrObj);
	if(!querySearchObj.error){
		var querySearch=querySearchObj.responseData;
		console.log("CheckinOut Main:",querySearch);
		db.cypherQuery(querySearch,function(err,reply){
			if(err){
				console.log("Error Found",err);
			}else {
				var queryObj = [];
				console.log("******REPLY******",reply);
				if (reply && reply.data.length > 0) {
					queryObj = userQueryRepository.updateCheckInQuery(todayStr);
					dataResolver["CheckInOut"] = itrObj;
					querySearchObj=Query(queryObj,dataResolver);
					querySearch=querySearchObj.responseData;
					for(var key in itrObj) {
						var q = 'MATCH (us:User)<-[inoutRel:CheckInOut_' + todayStr + ']-(inout:CheckInOut)  WHERE us.userName="' + punchDetails.userName + '" WITH inout ' +
							'SET inout.' + key + '="' + itrObj[key] + '" RETURN inout';
					}
					db.cypherQuery(q, function(err, reply) {
					console.log("updateCheckInQuery:", q, err, reply);
					if (!err) {
						if(itrObj[key] == "checkin"){
							responseObj.status = false;
							responseObj.lastlogged = parseInt(key.split("_")[1]);
						}else if(itrObj[key] == "checkout"){
							responseObj.status = true;
							responseObj.lastlogged = parseInt(key.split("_")[1]);
						}
						responseObj.responseData = reply.data.length;
						res.json(responseObj);
					} else {
						responseObj.error = true;
						responseObj.errorMsg = "Contact Admin!";
						res.json(responseObj);
					}
				});
				} else {
					queryObj = userQueryRepository.createCheckInQuery(todayStr);
					dataResolver["CheckInOut"] = itrObj;
					querySearchObj=Query(queryObj,dataResolver);
					querySearch=querySearchObj.responseData;
					db.cypherQuery(querySearch, function(err, reply) {
						console.log("createCheckInQuery:", querySearch, err, reply);
						if (!err) {
							responseObj.responseData = reply.data.length;
							for(var key in reply.data[0]){
								if(key!= "_id") {
									var d = parseInt(key.split("_")[1]);
									console.log("****************",d);
									responseObj.lastlogged = d;
								}
							}
							responseObj.status = false;
							res.json(responseObj);
						} else {
							responseObj.error = true;
							responseObj.errorMsg = "Contact Admin!";
							res.json(responseObj);
						}
					});
				}
			}
		});
	}
	log.info("@@@@@ ::::: User.saveUserPunchTimeDetails : EXIT.");
};

/* Save User Settings */
module.exports.saveUserSettings = function(user,settingsData,loggedInUser,req,res) {
	log.info("@@@@@ ::::: User.saveUserSettings : ENTER.");
  try{
	        var responseObj = new Utils.Response();
	        var currentTimestamp=(new Date()).getTime();
            var updateBy=loggedInUser.basicDetails.userName;
	        var defaultErrorMsg="Failed to update Password. Please contact administrator.";

	        var findUserQuery = 'MATCH (n:User{userName:"' + user.userName + '"})  RETURN n';
	        var updatePasswordQuery='MATCH (n:User{userName:"' + user.userName + '"}) set n.hashPassword="' + settingsData.newPassword + '" set n.updatedBy="' + updateBy + '" set n.updatedAt="' + currentTimestamp + '"return n';
	        console.log("@@@@ : findUserQuery :"+findUserQuery);
	        db.cypherQuery(findUserQuery, function(err, result) {
	        	console.log("@@@@ : updatePasswordQuery :"+updatePasswordQuery);
	            console.log("findUserQuery",err, result)
	            if(err || !result || (result && result.data && result.data.length==1)){
                 
	            	db.cypherQuery(updatePasswordQuery, function(err, reply) {
                        console.log("updatePasswordQuery err, reply",err, reply)
                    	if (!err) {
                			responseObj.responseData = reply;
                			res.json(responseObj);
                		} else {
                			responseObj.error = true;
                			responseObj.errorMsg = "No Data found.";
                			res.json(responseObj);
                		}	
                    });
	            }else{
	                Utils.defaultErrorResponse(res,defaultErrorMsg);
	            }
	        });//findUserQuery end
	    }catch(e){
	        console.log("Update password",e);
	        log.error("@@@@@ ::::: User.saveUserSettings : ERROR",E);
	        Utils.defaultErrorResponse(res,defaultErrorMsg);
	    }
	    log.info("@@@@@ ::::: User.saveUserSettings : EXIT.");
}
module.exports.getImageData=function(clonedUserDetails,res){
	log.info("@@@@@ ::::: User.getImageData : ENTER.");
    try{
        var userName=clonedUserDetails.basicDetails.userName;
        var query='match (i:Image) -[r1:IMAGE_OF]->(u:User{userName:"'+userName+'"}) return i';

        db.cypherQuery(query, function(err, result) {
            console.log("getImageData err",err);
            if(result && result.data && result.data.length>0)
                clonedUserDetails.basicDetails.profileImagePath=result.data[0].image;
            prepareUserProfileData(clonedUserDetails,res);
        });
    }catch(e){
    	log.error("@@@@@ ::::: User.getImageData : ERROR",e);
        prepareUserProfileData(clonedUserDetails,res);
    }
    log.info("@@@@@ ::::: User.getImageData : EXIT.");
}
function prepareUserProfileData(clonedUserDetails,res){
	log.info("@@@@@ ::::: User.prepareUserProfileData : ENETER.");
    var religionId=clonedUserDetails.basicDetails.religionId;
    var religionName="";
    console.log("religionId",religionId);
    religionId && religion[religionId]?religionName=religion[religionId].___name___:null;
    var fullName = " ";

    if(clonedUserDetails.basicDetails){
        var user= clonedUserDetails.basicDetails;
        var fullNameArr=[];
        user.firstName.length>0?fullNameArr.push(user.firstName):null;
        user.middleName.length>0?fullNameArr.push(user.middleName):null;
        user.lastName.length>0?fullNameArr.push(user.lastName):null;
        fullName = fullNameArr.join(" ");
    }

    var latestobj = {
        displayObject:{
            fullName : fullName,
            basicDetails: [
                {regID : clonedUserDetails.basicDetails.regID},
                {userName: clonedUserDetails.basicDetails.userName},
                {DOB: clonedUserDetails.basicDetails.DOB},
                {gender : Utils.resolveSex(clonedUserDetails.basicDetails.sex)},
                {religion : religionName},
                {SMSEnabled:Utils.resolveBoolean(clonedUserDetails.basicDetails.isSMSEnabled)},
                {EmailEnabled: Utils.resolveBoolean(clonedUserDetails.basicDetails.isEmailEnabled)}

            ],
            contact:[
                {emailPrimary: clonedUserDetails.contact.emailPrimary},
                {phonePrimary: clonedUserDetails.contact.phonePrimary},
                {emailSecondary: clonedUserDetails.contact.emailSecondary},
                {phoneSecondary: clonedUserDetails.contact.phoneSecondary},
                {_id: clonedUserDetails.contact._id}
            ],
            primaryAddress:[
                {street1: clonedUserDetails.primaryAddress.street1},
                {street2: clonedUserDetails.primaryAddress.street2},
                {pincode: clonedUserDetails.primaryAddress.pincode},
                /*{state: location.states[clonedUserDetails.primaryAddress.state.toString].state},
                 {country: location.countries[clonedUserDetails.primaryAddress.country.toString()].country},*/
                {_id:clonedUserDetails.primaryAddress._id}
            ]
        },
        hiddenObject:{
            profileImagePath:clonedUserDetails.basicDetails.profileImagePath,
            fullName:getFullName(clonedUserDetails.basicDetails),
            userFullData:clonedUserDetails
        }

    };
    var languageId=clonedUserDetails.basicDetails.languages_motherTongue;
    if(languageId && languages[languageId]){
        var languageName=languages[languageId].___name___;
        languageName?latestobj.displayObject.basicDetails.push({language :languageName}):latestobj.displayObject.basicDetails.push({language :""});
    }

    if(clonedUserDetails.primaryAddress.hasOwnProperty('country') && clonedUserDetails.primaryAddress.country.toString()){
        var countryId=clonedUserDetails.primaryAddress.country.toString();
        if(countryId && location[countryId]){
            var countryName=location[countryId].___name___;
            latestobj.displayObject.primaryAddress.push({country:countryName});
            if(countryName && clonedUserDetails.primaryAddress.hasOwnProperty('state') && clonedUserDetails.primaryAddress.state.toString()){

                var stateId=clonedUserDetails.primaryAddress.state.toString();
                if(stateId && location[countryId][stateId]){
                    var stateName=location[countryId][stateId].___name___;
                    latestobj.displayObject.primaryAddress.push({state:stateName});
                    if(stateName && clonedUserDetails.primaryAddress.hasOwnProperty('city') && clonedUserDetails.primaryAddress.city.toString()){
                        var cityId=clonedUserDetails.primaryAddress.city.toString();
                        if(cityId && location[countryId][stateId][cityId]){
                            var cityName=location[countryId][stateId][cityId].___name___;
                            latestobj.displayObject.primaryAddress.push({city:cityName});
                        }

                    }
                }

            }
        }
    }
    log.info("@@@@@ ::::: User.prepareUserProfileData : EXIT.");
    //sending response
    //console.log("clonedUserDetails",clonedUserDetails);
    var responseObj=new Utils.Response();
    responseObj.responseData=latestobj;
    res.json(responseObj);
}
function getFullName(user){
    //console.log("user",user);
    var fullNameArr=[];
    user && user.salutation && user.salutation.length>0?fullNameArr.push(user.salutation):null;
    user && user.firstName && user.firstName.length>0?fullNameArr.push(user.firstName):null;
    user && user.middleName && user.middleName.length>0?fullNameArr.push(user.middleName):null;
    user && user.lastName && user.lastName.length>0?fullNameArr.push(user.lastName):null;
    return fullNameArr.join(" ");

}

module.exports.getAutoUserFirstNameSearch = function(res,searchObj,schoolID) {
	log.info("@@@@@ ::::: User.getAutoUserFirstNameSearch : ENTER.");
//	var schoolId=loggedInUser.schoolDetails.schoolId;
	
    var queryFirstName=' Match (s:School{schoolId:"'+schoolID+'"})<-[:USER_OF]-(n:User{softDelete:false}) '+
    				   ' WHERE  ( n.firstName =~ "(?i).*'+searchObj.searchText+'.*" ) OPTIONAL MATCH  (n:User)-[r1:STUDENT_OF]- (c:Class)  '+
    				   ' RETURN distinct n.firstName order by n.firstName  LIMIT 10';
    
	console.log("getAutoUserFirstNameSearch",queryFirstName);
    var responseObj = new Utils.Response();
	db.cypherQuery(queryFirstName, function(err, reply) {
		console.log(err);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	
	log.info("@@@@@ ::::: User.getAutoUserFirstNameSearch : EXIT.");
}

module.exports.getAutoUserMiddleNameSearch = function(res,searchObj,schoolID) {
	log.info("@@@@@ ::::: User.getAutoUserMiddleNameSearch : ENTER.");
//	var schoolId=loggedInUser.schoolDetails.schoolId;
	
    var queryMiddleName=' Match (s:School{schoolId:"'+schoolID+'"})<-[:USER_OF]-(n:User{softDelete:false}) '+
    				   ' WHERE  ( n.middleName =~ "(?i).*'+searchObj.searchText+'.*" ) OPTIONAL MATCH  (n:User)-[r1:STUDENT_OF]- (c:Class)  '+
    				   ' RETURN distinct n.middleName order by n.middleName LIMIT 10';
    
	console.log("getAutoUserMiddleNameSearch",queryMiddleName);
    var responseObj = new Utils.Response();
	db.cypherQuery(queryMiddleName, function(err, reply) {
		console.log(err);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	
	log.info("@@@@@ ::::: User.getAutoUserMiddleNameSearch : EXIT.");
}

module.exports.getAutoUserLastNameSearch = function(res,searchObj,schoolID) {
	log.info("@@@@@ ::::: User.getAutoUserLastNameSearch : ENTER.");
//	var schoolId=loggedInUser.schoolDetails.schoolId;
	
    var queryLastName=' Match (s:School{schoolId:"'+schoolID+'"})<-[:USER_OF]-(n:User{softDelete:false}) '+
    				   ' WHERE  ( n.lastName =~ "(?i).*'+searchObj.searchText+'.*" ) OPTIONAL MATCH  (n:User)-[r1:STUDENT_OF]- (c:Class)  '+
    				   ' RETURN distinct n.lastName order by n.lastName LIMIT 10';
    
	console.log("getAutoUserLastNameSearch",queryLastName);
    var responseObj = new Utils.Response();
	db.cypherQuery(queryLastName, function(err, reply) {
		console.log(err);
		if (!err) {
			responseObj.responseData = reply;
			res.json(responseObj);
		} else {
			responseObj.error = true;
			responseObj.errorMsg = "No Data found.";
			res.json(responseObj);
		}
	});
	
	log.info("@@@@@ ::::: User.getAutoUserLastNameSearch : EXIT.");
}
