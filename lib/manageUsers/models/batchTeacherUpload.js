/**
 * Created by Pinki Boora on 5/25/14.
 */
var fs=require('fs');
var Utils=require("../../common/Utils/Utils.js");
var neo4j=require("node-neo4j");
var db=new neo4j("http://localhost:7474");
var User=require("../models/User.js");
var dataPath="../../data-files/Teacher-updated.csv";
fs.readFile(dataPath,function(err,csvData){
    var strData=csvData.toString();

    if(strData){
        var jsonData=Utils.csvToArray(strData);
        var columns=jsonData[0];
        var schoolIdVal="dav:cbse:1990:122001";

        for(var i= 1,loopLen=jsonData.length;i<loopLen;i++){
            if(i<3)continue;
            var userConfig={};
            userConfig.schoolID=schoolIdVal;
            userConfig.userName=jsonData[i][columns.indexOf("userName")];
            userConfig.firstName=jsonData[i][columns.indexOf("firstName")];
            userConfig.middleName=jsonData[i][columns.indexOf("middleName")];
            userConfig.lastName=jsonData[i][columns.indexOf("lastName")];
            userConfig.email=jsonData[i][columns.indexOf("email")];
            userConfig.regID=jsonData[i][columns.indexOf("regID")];
            userConfig.admin=false;
            userConfig.userType="teacher";
            userConfig.hashedPassword="password";
            userConfig.salt="salt";
            userConfig.resetPasswordCode="resetPasswordCode";
            userConfig.resetPasswordCodeUntil="resetPasswordCodeUntil";
            userConfig.createdAt=(Number(new Date())).toString();
            userConfig.updatedAt=(Number(new Date())).toString();
            console.log("userConfig",i,"---------");
            console.log("userConfig",userConfig);
            var user=new User(userConfig);
            user.createTeacher(function(err, result){
                console.log("create teacher",err, result);

            });

        }


    }
});

