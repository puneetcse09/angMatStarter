/**
 * It prepares generic query based on configuration and search params
 * Created by ravikant on 12/10/14.
 */

var Utils=require('../Utils/Utils.js')
var queryRepository=require('./queryRepository.js')
//var mngSchoolRepository=require('../../manageSchool/models/mngSchoolQryRepository.js')
//var mngLibConfigRepository=require('../../manageLibraryConfig/models/libConfigQueryRepository.js')
//var libReports=require('../../libraryReports/models/libraryReportsConfigQuery.js')
//var userReg=require('../../userRegistration/models/userRegQryRepository.js')/
//var timetable=require('../../manageTimeTable/models/mngTimeTableQryRepository.js')


function Query(queryConfig,dataResolver,skipRows,isCount){
    var responseObj=new Utils.Response();
    var query="";
    for(var i= 0,len=queryConfig.length;i<len;i++){
        var q=queryConfig[i];
        var tempQuery;
        switch(q.queryType){
            case 'search':tempQuery=prepareSearchQuery(q,dataResolver);break;
            case 'create':tempQuery=prepareCreateQuery(q,dataResolver);break;
            case 'update':tempQuery=prepareUpdateQuery(q,dataResolver);break;
            default:tempQuery=prepareSearchQuery(q,dataResolver);break;
        }

        if(tempQuery){
            if(i!=0){
                query+=' WITH '+ (queryConfig[i-1]).returnAliases.join(",")+' '+tempQuery;

            }else{
                query+=tempQuery;
            }
            if(i==len-1){
                !isCount?query+=' RETURN '+q.returnAliases.join(","):query+=' RETURN COUNT(*)';
                !isCount && q.hasOwnProperty('orderBy')?query+=' ORDER BY '+ q.orderBy.join(",")+' ':null;
                skipRows?query+=' SKIP '+skipRows:null;
                q.limit && !isCount?query+=' LIMIT '+q.limit:null;
            }
        }else{
            responseObj.error=true;
            responseObj.errorMsg="ERROR while creating query for object- "+JSON.stringify(q);
            break;
        }
    }
    responseObj.responseData=query;
    return responseObj;
}
function prepareSearchQuery(q,data){

    //verifying input params q,data
    if(!q ) return false;
    if(q && (!q.hasOwnProperty('startNode') || !q.hasOwnProperty('endNode')) || !q.hasOwnProperty('relation')) return false;
    if(!q.startNode || (q.startNode && !(q.startNode.hasOwnProperty('nodeQueryAlias') || !q.startNode.hasOwnProperty('nodeName')))) return false;
    if(q.endNode && (!q.endNode.hasOwnProperty('nodeQueryAlias') && !q.endNode.hasOwnProperty('nodeName'))) return false;
    if((q.relation && (!q.relation.hasOwnProperty('relationQueryAlias') && !q.relation.hasOwnProperty('relationName')))) return false;

    //prepare query;
    var query='MATCH ('+ q.startNode.nodeQueryAlias+':'+ q.startNode.nodeName+')';
        (q.relation && q.relation.hasOwnProperty('relationQueryAlias') && q.relation.hasOwnProperty('relationName'))?query+='<-['+ q.relation.relationQueryAlias+':'+q.relation.relationName+']':null;
        (q.endNode && q.endNode.hasOwnProperty('nodeQueryAlias') && q.endNode.hasOwnProperty('nodeName'))?query+='-('+ q.endNode.nodeQueryAlias+':'+ q.endNode.nodeName+') ':null;
        var whereClause=[];

        var s=getWhereCondition(q.startNode.nodeQueryAlias,data[q.startNode.nodeName],"AND");
        if(s) whereClause.push(s); //where clause for start node
        if(data.hasOwnProperty("__RANGE__")){
            var startNodeRange=addRangeCondition(q.startNode.nodeQueryAlias,data.__RANGE__[q.startNode.nodeName]);
            startNodeRange?whereClause.push(startNodeRange):null;
        }

        var r,e;
        if((q.relation && q.relation.hasOwnProperty('relationQueryAlias') && q.relation.hasOwnProperty('relationName'))){
            console.log("q.relation.relationQueryAlias,data[q.relation.relationName]",q.relation.relationQueryAlias,data[q.relation.relationName]);
            r=getWhereCondition(q.relation.relationQueryAlias,data[q.relation.relationName],"AND");
            console.log("r",r);
            if(r) whereClause.push(r); //where clause for relation
            if(data.hasOwnProperty("__RANGE__")){
                var relNodeRange=addRangeCondition(q.relation.relationQueryAlias,data.__RANGE__[q.relation.relationName]);
                relNodeRange?whereClause.push(relNodeRange):null;
            }
        }

        if(q.endNode && q.endNode.hasOwnProperty('nodeQueryAlias') && q.endNode.hasOwnProperty('nodeName')){
            e=getWhereCondition(q.endNode.nodeQueryAlias,data[q.endNode.nodeName],"AND");
            if(data.hasOwnProperty("__RANGE__")){
                var endNodeRange=addRangeCondition(q.endNode.nodeQueryAlias,data.__RANGE__[q.endNode.nodeName]);
                endNodeRange?whereClause.push(endNodeRange):null;
            }
        }
        if(e) whereClause.push(e); //where clause for end node
        if(whereClause.length>0)
            query+=' WHERE '+whereClause.join(' AND ');
        //query+=' RETURN '+ q.returnAliases.join(',');
    return query;
}
function addRangeCondition(alias,labelRange){
    console.log("addRangeCondition",alias,labelRange);
    if(labelRange && labelRange.hasOwnProperty('properties')){
        var whereClause=[];
        if(labelRange.properties.length>0){
            for(var i= 0,len=labelRange.properties.length;i<len;i++){

                var rangeObj=labelRange.properties[i];
                var conditionStr="";
                if(rangeObj.hasOwnProperty('rangeProperty') && !rangeObj.rangeProperty && rangeObj.hasOwnProperty('startData') && !rangeObj.startData){
                    var startCondition="";
                    if(rangeObj.hasOwnProperty('startCondition') && !rangeObj.startCondition){
                        startCondition=rangeObj.startCondition;
                    }else{
                        startCondition=">=";
                    }
                    conditionStr+=alias+startCondition+rangeObj.startData+" ";
                }
                if(rangeObj.hasOwnProperty('joinCondition') && !rangeObj.joinCondition){
                    conditionStr+=rangeObj.joinCondition;
                }else{
                    conditionStr+="AND";
                }
                if(rangeObj.hasOwnProperty('rangeProperty') && !rangeObj.rangeProperty && rangeObj.hasOwnProperty('endData') && !rangeObj.endData){
                    var endCondition="";
                    if(rangeObj.hasOwnProperty('endCondition') && !rangeObj.endCondition){
                        endCondition=rangeObj.endCondition;
                    }else{
                        endCondition="<=";
                    }
                    conditionStr+=alias+endCondition+rangeObj.endData+" ";
                }
                whereClause.push(conditionStr);
            }
            if(labelRange.hasOwnProperty('crossPropertyCondition') && labelRange.crossPropertyCondition){
                return whereClause.join(labelRange.crossPropertyCondition);
            }else{
                return whereClause.join("AND");
            }
        }
    }else{
        return "";
    }
}
function getWhereCondition(alias,data,condition){
    if(!data || (data && typeof data!='object') || (data && Object.keys(data).length==0)) return false;
    !condition?condition='AND':null;
    var whereClause=[];
    if(data.hasOwnProperty('_id')){
        whereClause.push(' id('+alias+')='+data._id)+' ';
    }else{
        for(var key in data){
            var value=data[key];
            if(typeof value=='string'){
                whereClause.push(alias+'.'+key+'="'+value+'"');
            }else{
                whereClause.push(alias+'.'+key+'='+value);
            }
        }
    }

    return whereClause.join(' '+condition+' ');
}

function prepareCreateQuery(q,data){
    if(!q ) return false;
    if(q && (!q.hasOwnProperty('startNode') || !q.hasOwnProperty('endNode')) || !q.hasOwnProperty('relation')) return false;
    if(!q.startNode || (q.startNode && !(q.startNode.hasOwnProperty('nodeQueryAlias') || !q.startNode.hasOwnProperty('nodeName')))) return false;
    var query=' ';

    if(q.startNode && q.startNode.hasOwnProperty('isNew') && !q.startNode.isNew){
        query+='CREATE ('+q.startNode.nodeQueryAlias+')';
        var relData=data[q.relation.relationName];
        if(q.endNode &&  q.endNode.hasOwnProperty('isNew') && q.endNode.isNew && q.relation){

            if(relData && Object.keys(relData).length>0){
                query+='<-['+q.relation.relationQueryAlias+':'+q.relation.relationName+Utils.querifyJSON(relData)+']-'
            }else{
                query+='<-['+q.relation.relationQueryAlias+':'+q.relation.relationName+']-'
            }
            var endData=data[q.endNode.nodeName];
            query+='('+q.endNode.nodeQueryAlias+':'+q.endNode.nodeName+Utils.querifyJSON(endData)+')';
        }else{

            query+='<-['+q.relation.relationQueryAlias+':'+q.relation.relationName+Utils.querifyJSON(relData)+']-';
            query+='('+q.endNode.nodeQueryAlias+')';
        }
    }
    var startData=data[q.startNode.nodeName];
    if(q.startNode && q.startNode.hasOwnProperty('isNew') && q.startNode.isNew && startData && Object.keys(startData).length>0){
        query+=' CREATE ('+q.startNode.nodeQueryAlias+':'+q.startNode.nodeName+Utils.querifyJSON(startData)+')';
    }

    return query;
}
function prepareUpdateQuery(q,data){
  var query='SET ';
  var arr=[];
  for(var i= 0,len= q.updates.length;i<len;i++){
      var item=q.updates[i];
      var itemData=data[item.nodeName];
      for(var key in itemData){
          if(key=='_id') continue;
          var value=itemData[key];
          if(typeof value=='string'){
              arr.push(item.nodeQueryAlias+'.'+key+'="'+itemData[key]+'"');
          }else{
              arr.push(item.nodeQueryAlias+'.'+key+'='+itemData[key]);
          }

      }
  }
  query+=arr.join(',');
  return query;
}
module.exports=Query;

//**********************************************************************************************************************
//Test of above method
//parent book
var parentSearchObj={ language: 'hindi',
    bookTitle: 'Alexander',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116 }
//child Book
var childBookSearchObj={ bookId: '1',
    bookStatus: 'Available',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116
}
var dataResolver={
//    "ParentBook":parentSearchObj,
//    "ChildBook":childBookSearchObj,
//    "School":{schoolId:"DAV"},
//    'User':{userName:'ravikantaryan',lastName:'Kant'},
//    'Library':{userName:'ravikantaryan',lastName:'Kant'}
		 "Category":{},
	        "School":{schoolId:'schoolID'},
	        'Library':{}
}
//var queryConfig=queryRepository.tempQ();
//var queryConfig=queryRepository.getBookCategories();
//console.log("query",Query(queryConfig,dataResolver));
//console.log("querifyJSON",querifyJSON({"name":"ravi",age:30,"isMale":true}));

var schoolDataResolver={
//		"School":{schoolId:"schoolId"}
    "School":{schoolId:"St. Paul Higher Secondary School"},
//    'User':{userBasicDetails : "basicdetails"},
    "Contact":{contact : "contact"},
    "PrimaryAddress":{primaryAddress: "primaryAddress"},
    "SecondaryAddress":{secondaryAddress:"secondaryAddress"},
    "SocialNetwork":{socialNetwork: "socail"},
    "Image":{imgObj:"img"}
}
//var queryConfig=mngSchoolRepository.adddNewSchool();
//var queryConfig=mngSchoolRepository.updateSchool();
//var queryConfig=mngSchoolRepository.adddNewSchool();
//console.log("query",Query(queryConfig,schoolDataResolver));
var libDataResolver={
//		"Library":{name:"puneet test library"}
		"School":{schoolId:"St. Paul Higher Secondary School"},
	    'User':{userBasicDetails : "basicdetails"},
	    "Contact":{contact : "contact"},
	    "PrimaryAddress":{primaryAddress: "primaryAddress"},
	    "SecondaryAddress":{secondaryAddress:"secondaryAddress"},
	    "SocialNetwork":{socialNetwork: "socail"},
	    "Image":{imgObj:"img"}

	}
//var queryConfig=mngLibConfigRepository.getSelectedLibraryDetails();
//var queryConfig=mngLibConfigRepository.createLibQueryConfig();
//var queryConfig=mngLibConfigRepository.updateLibQueryConfig();
//console.log("query",Query(queryConfig,libDataResolver));
var dataResolver={
    "Class":{},
    "School":{schoolId:"SPHSS:school:2014:452001"},
    'User':{},
    "ISSUED_TO":{},
    "__RANGE__":{
        "ISSUED_TO":[
           /* {
                crossPropertyCondition:"AND",
                properties:[
                    {rangeProperty:"dueDate","startData":requestobj.startDueDate,"endData":requestobj.endDueDate,startCondition:">=",endCondition:"<=",joinCondition:"AND"}
                ]
            },*/
            {
                crossPropertyCondition:"AND",
                properties:[
                    {rangeProperty:"returnDate","startData":"","endData":(new Date()).getTime(),startCondition:"=",endCondition:"<=",joinCondition:"OR"}
                ]
            }

        ]
    }
};
/*var userDataResolver={
		"School":{schoolId:"St. Paul Higher Secondary School"},
        'User':{userBasicDetails : "basicdetails"},
	    "Contact":{contact : "contact"},
	    "PrimaryAddress":{primaryAddress: "primaryAddress"},
	    "SecondaryAddress":{secondaryAddress:"secondaryAddress"},
	    "SocialNetwork":{socialNetwork: "socail"},
	    "Image":{imgObj:"img"}
    }
var queryConfig=userReg.adddNewSchool();
var queryConfig=userReg.addUser();*/
//console.log("query",Query(queryConfig,schoolDataResolver));

//console.log("query",Query(libReports.fineQueryConfig(),dataResolver));

/*var timetableDataResolver={
		
		"Class":{name : "classData"},
		"Event":{event : "eventData"}
}
var queryConfig=timetable.addNewTimeTable();
console.log("timetableDataResolver ---> ",Query(queryConfig,timetableDataResolver));*/
