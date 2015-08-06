/**
 * Created by ravikant on 12/10/14.
 */

var ConfigClass=require('./ConfigClass.js');
var nodeConfig=require('./nodeConfigs.js')
var relationConfig=require('./relationConfigs.js')

var nodes=["ParentBook","ChildBook"];
var relations=[{source:0,target:1,relationName:"CHILDBOOK_OF"}];
var queryPath='ParentBook<-[:CHILDBOOK_OF]-ChildBook';
funtion getNodes(){
    return nodes;
}
function getRelations(){
    return relations;
}
module.exports.getNodes=getNodes;
module.exports.getRelations=getRelations;

//parent book
var parentBookMetadata=nodeConfig.getParentBookNodeConfig();
var parentConfig=new ConfigClass(parentBookMetadata.labelName,parentBookMetadata.metaDataArr);
var parentSearchObj={ language: 'hindi',
    bookTitle: 'Alexander',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116 }
//child Book
var childBookConfig=nodeConfig.getChildBookNodeConfig();
var config=new ConfigClass(childBookConfig.labelName,childBookConfig.metaDataArr);
var childBookSearchObj={ bookId: '1',
    bookStatus: 'Available',
    softDelete: false,
    createdAt: 1413056371116,
    UpdatedAt: 1413056371116 }

function prepareQuery(){

}