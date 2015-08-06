/**
 * Created by ravikant on 12/10/14.
 */
function NodeConfig(){
    this.labelName="";
    this.metaDataArr=[];
}
//Parent Book
function getParentBookNodeConfig(){
    var node=new NodeConfig();
    node.labelName="ParentBook";
    node.metaDataArr=[
        {fieldName:"bindingType",dataType:"string",defaultValue:""},
        {fieldName:"bookTitle",dataType:"string",defaultValue:""},
        {fieldName:"categoryName",dataType:"string",defaultValue:""},
        {fieldName:"bibLevel",dataType:"string",defaultValue:""},
        {fieldName:"softDelete",dataType:"boolean",defaultValue:false},
        {fieldName:"edition",dataType:"number",defaultValue:1},
        {fieldName:"bookCopies",dataType:"number",defaultValue:0},
        {fieldName:"language",dataType:"string",defaultValue:"English"}, //to be discussed for default values
        {fieldName:"publisher",dataType:"string",defaultValue:""},
        {fieldName:"createdBy",dataType:"string",defaultValue:""},
        {fieldName:"updatedBy",dataType:"string",defaultValue:""},
        {fieldName:"isbn",dataType:"string",defaultValue:"DUM"+(new Date()).getTime()},
        {fieldName:"coverImagePath",dataType:"string",defaultValue:""},
        {fieldName:"authorName",dataType:"string",defaultValue:""},
        {fieldName:"docType",dataType:"string",defaultValue:""},
        {fieldName:"createdAt",dataType:"currentTimestamp",defaultValue:"none"},
        {fieldName:"UpdatedAt",dataType:"currentTimestamp",defaultValue:"none"}
    ]
    return node;
}
module.exports.getParentBookNodeConfig=getParentBookNodeConfig;
//Child Book
function getChildBookNodeConfig(){
    var node=new NodeConfig();
    node.labelName="ChildBook";
    node.metaDataArr=[
        {fieldName:"bookId",dataType:"string",defaultValue:""},
        {fieldName:"bookStatus",dataType:"string",defaultValue:""},
        {fieldName:"freqReminder",dataType:"string",defaultValue:""},
        {fieldName:"outletName",dataType:"string",defaultValue:""},
        {fieldName:"currencyType",dataType:"string",defaultValue:""},
        {fieldName:"softDelete",dataType:"boolean",defaultValue:false},
        {fieldName:"location",dataType:"string",defaultValue:""},
        {fieldName:"purchaseDate",dataType:"string",defaultValue:""},
        {fieldName:"publicationDate",dataType:"string",defaultValue:""},
        {fieldName:"materialAccompanied",dataType:"string",defaultValue:""},
        {fieldName:"createdBy",dataType:"string",defaultValue:""},
        {fieldName:"updatedBy",dataType:"string",defaultValue:""},
        {fieldName:"starRating",dataType:"number",defaultValue:3},
        {fieldName:"pricePaid",dataType:"number",defaultValue:-1},
        {fieldName:"tags",dataType:"array",defaultValue:[]},
        {fieldName:"createdAt",dataType:"currentTimestamp",defaultValue:"none"},
        {fieldName:"UpdatedAt",dataType:"currentTimestamp",defaultValue:"none"}
    ];
    return node;
}
module.exports.getChildBookNodeConfig=getChildBookNodeConfig;