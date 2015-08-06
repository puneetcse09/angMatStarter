/**
 * Created by Pinki Boora on 5/23/14.
 */
var UserClass=require("../../manageUsers/models/UserClass.js");
var user=new UserClass();
var Utils=require("../../common/Utils/Utils.js");
var db=Utils.getDBInstance();
var appList=require("../../common/models/modules.js").getAppList();
//var appList=require("../../common/models/modules_dev.js").getAppList();
var Query=require("../../common/generic/Query.js");
var userQR=require("../../manageUsers/models/usersQueryRepository.js");
var logHandler = require("../../common/Utils/Logger.js"); 
var log=logHandler.LOG;

module.exports=function(app){

    app.get("/login",function(req,res){
    	log.info("@@@@@ ::::: loginCtrl : /login . ");
       res.render("login");
    });

    app.get("/getSidebarMenuList",function(req,res){
    	log.info("@@@@@ ::::: loginCtrl : /getSidebarMenuList : ENTER.  ");
    	var loggedInUser=req.session.userDetails.basicDetails.userName;
    	var currentTime=(new Date());
    	log.info("@@@@@ ::::: User logged in to application by reload : eM :  "+loggedInUser+" @ Date : "+currentTime);
        var responseObj=new Utils.Response();
        responseObj.responseData=req.session.menuList
        log.info("@@@@@ ::::: loginCtrl : /getSidebarMenuList : EXIT.  "+JSON.stringify(responseObj));
        res.json(responseObj);
    });

    app.post('/registerSubmit',function(req,res){
    	console.log("@@@@@@@@@@ register me @@@@@@@@@");
    	log.info("@@@@@ ::::: loginCtrl : /registerSubmit ");
    	 res.redirect("/index");
    });
    
    app.post('/loginSubmit',function(req,res){
    	var currentTime=(new Date());
    	 var userName=req.body.username;
         var password=req.body.password;
    	log.info("@@@@@ ::::: loginCtrl : /loginSubmit : ENTER.");
       
        console.log("userName",userName);
        console.log("password",password);

        user.getUserDetailsByUserName(userName,req,res,function(req,res,result){
            //console.log("result login",result);
            if(result && result.data.length>0){
                var userDet,pAddress,sAddress,sn,school,contact,userClass, rollNum;
                result.columns.length>0?userDet=result.data[0][0]:null;
                result.columns.length>1?pAddress=result.data[0][1]:null;
                result.columns.length>2?sAddress=result.data[0][2]:null;
                result.columns.length>3?sn=result.data[0][3]:null;
                result.columns.length>4?school=result.data[0][4]:null;
                result.columns.length>5?contact=result.data[0][5]:null;
                result.columns.length>6?userClass=result.data[0][6]:null;
                result.columns.length>6?rollNum=result.data[0][7]:null;
                //console.log(userDet,pAddress,sAddress,sn,school,contact);
                //set library details
                //school?getLibraryAndSetInSession(school.schoolId,req):null;
                log.info("@@@@@ ::::: loginCtrl : userDet : ENTER.  "+JSON.stringify(userDet));
                if(userDet!=null){
                    if(userDet.hashPassword==password){
                        user.setUserDetails(userDet,pAddress,sAddress,sn,school,contact);
                        user.setUserDataInSession(req);
                        
                        //console.log("req.session.userDetails",req.session.userDetails);

                        var menuList=Utils.filterMenuItems(new appList(),userDet.userType);
                        req.session.menuList=menuList;
                        req.session.currentClass=userClass;
                        req.session.rollNum=rollNum;
                        res.redirect("/index");
                        log.info("@@@@@ ::::: User logged in to application : eM :  "+userName+" @ Date : "+currentTime);
//                        user.getUserClass(userName,function(err,result){
//                            console.log("getUserClass");
//                            if(!err && result && result.data && result.data.length>0){
//                                console.log("result.data[0]",result.data[0]);
//                                req.session.currentClass=result.data[0];
//                                res.redirect("/index");
//                            }else{
//                                console.log("User has no class");
//                                res.redirect("/index");
//                            }
//                        })
                        
                    }else{
                        res.render("loginError");
                    }
                }else{
                    res.render("loginError");
                }
            }else{
                res.render("loginError");
            }
        });

    });
    app.get("/logout",function(req,res){
        req.session.userDetails=null;
        req.session.menuList=null;
        res.redirect("/login");
    });
    app.get("/getUserImage",function(req,res){
        console.log("getUserImage seesss data",req.session.userDetails.basicDetails);
        var userName=req.session.userDetails.basicDetails.userName;
       var  dataResolver={
            'User':req.session.userDetails.basicDetails
        }
        queryConfig=userQR.userProfileImage();
        query=Query(queryConfig,dataResolver);
        var responseObj=new Utils.Response();
        if(!query.error){
            query=query.responseData;
            console.log("getUserImage query",query);
            var responseObj=new Utils.Response();
            db.cypherQuery(query,function(err,reply){
                //console.log("searchBooks",err, reply);
                if(!err && reply){
                    if(reply.data.length>0)
                        responseObj.responseData=reply.data[0];
                    else responseObj.responseData={image:""};
                }else{
                    responseObj.responseData={image:""};
                }
                res.json(responseObj);
            });
        }else{
            res.json(query);
        }
    });
    
    app.get("/getSchoolImage",function(req,res){
        console.log("getSchoolImage seesss data",req.session.userDetails.basicDetails);
        var loggedInUser=req.session.userDetails;
        var schoolID=loggedInUser.schoolDetails.schoolId; 
        var query = 'match (i:Image) -[r1:IMAGE_OF]->(s:School{schoolId:"'+schoolID+'"}) return i;';
        var responseObj=new Utils.Response();
        
        console.log("getSchoolImage query",query);
            var responseObj=new Utils.Response();
            db.cypherQuery(query,function(err,reply){
                //console.log("searchBooks",err, reply);
                if(!err && reply){
                    if(reply.data.length>0)
                        responseObj.responseData=reply.data[0];
                    else responseObj.responseData={image:""};
                }else{
                    responseObj.responseData={image:""};
                }
                res.json(responseObj);
            });
    });
    
    app.get("/getSchoolInfo",function(req,res){
        var responseObj=new Utils.Response();
        var navBarData=[];
        navBarData.push(req.session.userDetails.schoolDetails);
        navBarData.push(req.session.userDetails.basicDetails.firstName);
        navBarData.push(req.session.userDetails.basicDetails.lastName);
        navBarData.push(req.session.userDetails.basicDetails.userName);
        navBarData.push(req.session.userDetails.basicDetails.profileImagePath);
        
        responseObj.responseData=navBarData;
//        responseObj.responseData=req.session.userDetails.schoolDetails;
        res.json(responseObj);
    });

}
//

