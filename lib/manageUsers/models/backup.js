/**
 * Created by ravikant on 19/11/14.
 */

module.exports = function(config) {
    this.me = config;

    this.createUser = function(callback) {
        var myData = this.me;
        var selectquery = 'MATCH (n:User{userName:"' + this.me.userName
            + '"})  RETURN n';
        db.cypherQuery(selectquery, function(err, result) {
            console.log("err", err, result.data.length);
            if (err)
                throw err;
            else if (result.data.length < 1) {
                console.log("Inserting node");
                var myDataNode = db.insertNode(myData, [ "User" ], function(
                    err, user) {
                    console.log("insertNode user", user);
                    if (user && user._id) {

                        var schoolIdVal = myData.schoolID;
                        var selectquery = 'MATCH (n:School{schoolId:"'
                            + schoolIdVal + '"})  RETURN n';
                        db.cypherQuery(selectquery, function(err, school) {
                            console.log("err", err);
                            if (err)
                                throw err;
                            else if (school.data.length == 1) {
                                var schoolNodeId = school.data[0]._id;
                                var relationShip = "USER_OF";
                                var relationShipData = {
                                    "since" : myData.createdAt
                                };
                                console.log("Before insert relationship",
                                    schoolNodeId, user._id);
                                db.insertRelationship(schoolNodeId, user._id,
                                    relationShip, relationShipData,
                                    function(err, result) {
                                        console.log("insertRelationship",
                                            err, result);
                                        callback(err, result);
                                    });
                            }
                        });
                        /*db.insertRelationship(3,user._id,"STUDENT_OF",{"batch":"2014-15"},function(err,result){
                         console.log("insertRelationship",err,result);
                         callback(err, result);
                         });*/
                    }

                });

            }

        });
    }
    this.createStudent = function(callcack) {
        this.me.userType = "student";
        this.me.admin = false;
        this.createUser(callcack);
    }
    this.createEmployee = function(callcack) {
        this.me.userType = "employee";
        this.me.admin = false;
        this.createUser(callcack);
    }
    this.createTeacher = function(callcack) {
        this.me.userType = "teacher";
        this.me.admin = true;
        this.createUser(callcack);
    }

}

