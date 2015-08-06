/**
 * Created by Pinki Boora on 5/25/14.
 */
var fs=require('fs');
var Utils=require("../../common/Utils/Utils.js");
var neo4j=require("node-neo4j");
var db=new neo4j("http://localhost:7474");
var User=require("../models/User.js");
var dataPath="../../data-files/student.csv";
/*var deleteQ='MATCH (n:User{userType:"student"}) RETURN n';
db.cypherQuery(deleteQ,function(err,result){
    console.log(err,result);
})*/
fs.readFile(dataPath,function(err,csvData){
    var strData=csvData.toString();

    if(strData){
        var jsonData=Utils.csvToArray(strData);
        var columns=jsonData[0];
        var schoolIdVal="dav:cbse:1990:122001";
        for(var i= 1,loopLen=jsonData.length;i<loopLen;i++){
            var userConfig={};
            userConfig.schoolID=schoolIdVal;
            userConfig.userName=jsonData[i][columns.indexOf("userName")];
            userConfig.firstName=jsonData[i][columns.indexOf("firstName")];
            userConfig.middleName=jsonData[i][columns.indexOf("middleName")];
            userConfig.lastName=jsonData[i][columns.indexOf("lastName")];
            userConfig.email=jsonData[i][columns.indexOf("email")];
            userConfig.regID=jsonData[i][columns.indexOf("regID")];
            userConfig.DOB=jsonData[i][columns.indexOf("DOB")];
            userConfig.admin=false;
            userConfig.userType="student";
            userConfig.hashedPassword="password";
            userConfig.salt="salt";
            userConfig.resetPasswordCode="resetPasswordCode";
            userConfig.resetPasswordCodeUntil="resetPasswordCodeUntil";
            userConfig.createdAt=(Number(new Date())).toString();
            userConfig.updatedAt=(Number(new Date())).toString();
            console.log("userConfig",i,"---------");
            console.log("userConfig",userConfig);
            var user=new User(userConfig);
            user.createStudent(function(err, result){
                console.log("create student",err, result,result.id);

            });

        }


    }
});

