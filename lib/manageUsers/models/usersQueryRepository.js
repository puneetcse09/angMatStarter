/**
 * Created by ravikant on 7/12/14.
 */
function userProfileImage(){
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"IMAGE_OF",relationQueryAlias:"img_us"},
            endNode:{nodeName:"Image",nodeQueryAlias:"img"},
            returnAliases:["img"]
        }
    ]
    return queryConfig;
}
function searchCheckInQuery(dateStr){
    var relName="CheckInOut_"+dateStr;
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:relName,relationQueryAlias:"inoutRel"},
            endNode:{nodeName:"CheckInOut",nodeQueryAlias:"inout"},
            returnAliases:["inout"],
            queryType:'search'
        }
    ]
    return queryConfig;
}
module.exports.searchCheckInQuery=searchCheckInQuery;
function updateCheckInQuery(dateStr){
    var relName="CheckInOut_"+dateStr;
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:relName,relationQueryAlias:"inoutRel"},
            endNode:{nodeName:"CheckInOut",nodeQueryAlias:"inout"},
            returnAliases:["inout"],
            queryType:'search'
        },
        {
            updates:[
                {nodeName:"CheckInOut",nodeQueryAlias:"inout"},
            ],
            returnAliases:["inout"],
            queryType:'update'
        }
    ]
    return queryConfig;
}
module.exports.updateCheckInQuery=updateCheckInQuery;
function createCheckInQuery(dateStr){
    var relName="CheckInOut_"+dateStr;
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us",isNew:false},
            relation:null,
            endNode:null,
            returnAliases:["us"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us",isNew:false},
            relation:{relationName:relName,relationQueryAlias:"inoutRel"},
            endNode:{nodeName:"CheckInOut",nodeQueryAlias:"inout",isNew:true},
            returnAliases:["inout"],
            queryType:'create'
        }
    ]
    return queryConfig;
}
module.exports.createCheckInQuery=createCheckInQuery;
module.exports.userProfileImage=userProfileImage;