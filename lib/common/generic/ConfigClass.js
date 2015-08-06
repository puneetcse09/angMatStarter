/**
 * Created by ravikant on 12/10/14.
 */
var nodeConfig=require('./nodeConfigs.js')
var relationConfig=require('./relationConfigs.js')
function ConfigClass(labelName,metaDataArr){
    this.labelName=labelName;
    this.metaDataArr=metaDataArr;
    this.getPojo=function(){
        var obj={"_id":-9999};
        for(var i= 0,len=this.metaDataArr.length;i<len;i++){
            var tempObj=this.metaDataArr[i];
            if(tempObj.defaultValue!='none')
                obj[tempObj.fieldName]=tempObj.defaultValue;
            else{
                if(tempObj.dataType=='currentTimestamp'){
                    obj[tempObj.fieldName]=(new Date()).getTime();
                }
            }
        }
        return obj;
    }
    this.getBasicSearchQuery=function(searchObj,condition){
        var defaultCondition=condition || 'AND';
        var query='Match (n:'+this.labelName+') ';
        var tempArr=[];
        for(var i= 0,len=this.metaDataArr.length;i<len;i++){
            var tempObj=this.metaDataArr[i];
            if(tempObj.fieldName=='_id') continue; //skip _id in query
            if(searchObj.hasOwnProperty(tempObj.fieldName)){
                if(tempObj.dataType=='string')
                    tempArr.push('n.'+tempObj.fieldName+'="'+searchObj[tempObj.fieldName]+'"');
                else{
                    tempArr.push('n.'+tempObj.fieldName+'='+searchObj[tempObj.fieldName]);
                }
            }

        }
        if(tempArr.length>0){
            query+=' WHERE '+tempArr.join(' '+defaultCondition+' ');
        }
        query+=' RETURN n';
        return query;
    }

}
module.exports=ConfigClass;
//parent book
var parentBookConfig=nodeConfig.getParentBookNodeConfig();
var config=new ConfigClass(parentBookConfig.labelName,parentBookConfig.metaDataArr);
console.log('Parent----')
console.log(config.getPojo());
var searchObj={ language: 'hindi',
    bookTitle: 'Alexander',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116 }
console.log(config.getBasicSearchQuery(searchObj,"OR"));
//child book
console.log('Child----')
var childBookConfig=nodeConfig.getChildBookNodeConfig();
var config=new ConfigClass(childBookConfig.labelName,childBookConfig.metaDataArr);
console.log(config.getPojo());
var searchObj={ bookId: '1',
    bookStatus: 'Available',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116 }
console.log(config.getBasicSearchQuery(searchObj,"OR"));