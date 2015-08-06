/**
 * Created by ravikant on 12/10/14.
 */

function RelationConfig(){
    this.relationShipName="",
    this.attributes=[];
}

function getChildBookOfRelation(){
    var rel=new RelationConfig();
    rel.relationShipName="CHILDBOOK_OF";
    rel.attributes=[];
    return rel;
}
module.exports.getChildBookOfRelation=getChildBookOfRelation;