/**
 * Created by ravikant on 13/10/14.
 */

//Library Management

//Search Issued Books for Students
function searchBooksIssuedStudent(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"CLASS_OF",relationQueryAlias:"sc_cl"},
            endNode:{nodeName:"Class",nodeQueryAlias:"cl"},
            returnAliases:["cl"]
        },
        {
            startNode:{nodeName:"Class",nodeQueryAlias:"cl"},
            relation:{relationName:"STUDENT_OF",relationQueryAlias:"cl_us"},
            endNode:{nodeName:"User",nodeQueryAlias:"us"},
            returnAliases:["us"]
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"CONTACT_OF",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"co",nodeName:"Contact"},
            returnAliases:["us"]
        },

        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["cb","us_cb","us"]
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["pb","cb","us_cb","us"],
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["pb","cb","cat","us_cb","us"],
            orderBy:["cat.id ASC","cb.catBookSeqId DESC"],
            limit:25
        }
    ]
    return queryConfig;
}
//Search Issued Books By any user
function searchBooksIssuedAnyUsers(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"USER_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"User",nodeQueryAlias:"us"},
            returnAliases:["us"]
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"CONTACT_OF",relationQueryAlias:"us_co"},
            endNode:{nodeQueryAlias:"co",nodeName:"Contact"},
            returnAliases:["us"]
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["cb","us_cb"]
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["pb","cb","us_cb"],
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["pb","cb","cat","us_cb"],
            orderBy:["cat.id ASC","cb.catBookSeqId DESC"],
            limit:25
        }
    ]
    return queryConfig;
}
function searchBooksIssuedByUser(userType){
    var query;
    if(!userType){
        query=searchBooksIssuedAnyUsers();
    }else{
        var tempArr=userType.split("||");
        if(tempArr.length==2 && tempArr[1]=="1"){
            query=searchBooksIssuedStudent()
        }else{
            query=searchBooksIssuedAnyUsers();
        }
    }
    return query;
}
module.exports.searchBooksIssuedByUser=searchBooksIssuedByUser;

function searchBooksByBookDetails(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            returnAliases:["lib"]
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_c"},
            endNode:{nodeName:"Category",nodeQueryAlias:"c"},
            returnAliases:["c"]
        },
        {
            startNode:{nodeName:"Category",nodeQueryAlias:"c"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_pb"},
            endNode:{nodeName:"ParentBook",nodeQueryAlias:"pb"},
            returnAliases:["pb","c"]
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["pb","cb","c"],
            limit:25,
            orderBy:["c.id ASC","cb.catBookSeqId DESC"]
        }
    ]
    return queryConfig;
}
module.exports.searchBooksByBookDetails=searchBooksByBookDetails;

function getBookCategories(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            returnAliases:["lib"]
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_pb"},
            endNode:{nodeName:"Category",nodeQueryAlias:"c"},
            returnAliases:["c"],
            orderBy:["c.name ASC"]
        }
    ]
    return queryConfig;
}
module.exports.getBookCategories=getBookCategories;
function getBookLocation(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            returnAliases:["lib"]
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_c"},
            endNode:{nodeName:"BookLocation",nodeQueryAlias:"c"},
            returnAliases:["c"],
            orderBy:["c.id ASC","c.name ASC"]
        }
    ]
    return queryConfig;
}
module.exports.getBookLocation=getBookLocation;
function getLibraryAndCategory(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            returnAliases:["lib"]
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_c"},
            endNode:{nodeName:"Category",nodeQueryAlias:"c"},
            returnAliases:["lib","c"]
        }
    ]
    return queryConfig;
}
module.exports.getLibraryAndCategory=getLibraryAndCategory;
function getAddCompleteBookQuery(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            returnAliases:["lib"],
            queryType:"search"
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_c"},
            endNode:{nodeName:"Category",nodeQueryAlias:"c"},
            returnAliases:["lib","c"],
            queryType:"search"
        },
        {
            startNode:{nodeName:"Category",nodeQueryAlias:"c",isNew:false},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"c_pb"},
            endNode:{nodeName:"ParentBook",nodeQueryAlias:"pb",isNew:true},
            returnAliases:["lib","c","pb"],
            queryType:'create'
        },
        {
            startNode:{nodeName:"ParentBook",nodeQueryAlias:"pb",isNew:false},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pa_cb"},
            endNode:{nodeName:"ChildBook",nodeQueryAlias:"cb",isNew:true},
            returnAliases:["lib","c","pb","cb"],
            queryType:'create'
        },
        {
            startNode:{nodeName:"ChildBook",nodeQueryAlias:"cb",isNew:false},
            relation:{relationName:"IMAGE_OF",relationQueryAlias:"pb_img"},
            endNode:{nodeName:"Image",nodeQueryAlias:"img",isNew:true},
            returnAliases:["lib","c","pb","cb","img"],
            queryType:'create'
        },
        {
            updates:[
                {nodeName:"Library",nodeQueryAlias:"lib"},
                {nodeName:"Category",nodeQueryAlias:"c"}
            ],
            returnAliases:["pb","cb","c","lib"],
            queryType:'update'
        }
    ];
    return queryConfig;
}
module.exports.getAddCompleteBookQuery=getAddCompleteBookQuery;
function reserveBookQuery(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"USER_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeQueryAlias:"us",nodeName:"User"},
            returnAliases:["us","sc"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_lib"},
            endNode:{nodeQueryAlias:"lib",nodeName:"Library"},
            returnAliases:["us","lib"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_cat"},
            endNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            returnAliases:["us","cat"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["us","pb"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["us","cb"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us",isNew:false},
            relation:{relationName:"RESERVED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook",isNew:false},
            returnAliases:["cb","us_cb"],
            queryType:'create'
        },
        {
            updates:[
                {nodeName:"ChildBook",nodeQueryAlias:"cb"}
            ],
            returnAliases:["us_cb","cb"],
            queryType:'update'
        }]
    return queryConfig;
}
module.exports.reserveBookQuery=reserveBookQuery;

function cancelReserveBookQuery(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"USER_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeQueryAlias:"us",nodeName:"User"},
            returnAliases:["us","sc"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_lib"},
            endNode:{nodeQueryAlias:"lib",nodeName:"Library"},
            returnAliases:["us","lib"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_cat"},
            endNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            returnAliases:["us","cat"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["us","pb"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["us","cb"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us",isNew:false},
            relation:{relationName:"RESERVED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook",isNew:false},
            returnAliases:["cb","us_cb"],
            queryType:'search'
        },
        {
            updates:[
                {nodeName:"ChildBook",nodeQueryAlias:"cb"},
                {nodeName:"RESERVED_TO",nodeQueryAlias:"us_cb"}
            ],
            returnAliases:["us_cb","cb"],
            queryType:'update'
        }]
    return queryConfig;
}
module.exports.cancelReserveBookQuery=cancelReserveBookQuery;

function issueBookQuery(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"USER_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeQueryAlias:"us",nodeName:"User"},
            returnAliases:["us","sc"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_lib"},
            endNode:{nodeQueryAlias:"lib",nodeName:"Library"},
            returnAliases:["us","lib"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"lib_cat"},
            endNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            returnAliases:["us","cat"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["us","pb"],
            queryType:'search'
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["us","cb"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us",isNew:false},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook",isNew:false},
            returnAliases:["cb","us_cb"],
            queryType:'create'
        },
        {
            updates:[
                {nodeName:"ChildBook",nodeQueryAlias:"cb"}
            ],
            returnAliases:["us_cb","cb"],
            queryType:'update'
        }]
    return queryConfig;
}
module.exports.issueBookQuery=issueBookQuery;
function returnBook(){
    var queryConfig=[{
        startNode:{nodeName:"User",nodeQueryAlias:"us"},
        relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
        endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
        returnAliases:["cb","us_cb"]
    },
    {
        updates:[
            {nodeName:"ISSUED_TO",nodeQueryAlias:"us_cb"},
            {nodeName:"ChildBook",nodeQueryAlias:"cb"}
        ],
            returnAliases:["us_cb","cb"],
        queryType:'update'
    }]
    return queryConfig;
}
module.exports.returnBook=returnBook;
function issueBook(){
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            queryType:'create',
            returnAliases:["cb","us_cb"]
        },
        {
            updates:[
                {nodeName:"ISSUED_TO",nodeQueryAlias:"us_cb"},
                {nodeName:"ChildBook",nodeQueryAlias:"cb"}
            ],
                returnAliases:["us_cb","cb"],
            queryType:'update'
        }
    ]
    return queryConfig;
}
module.exports.issueBook=issueBook;
function reIssue(){
    var queryConfig=[
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            queryType:'search',
            returnAliases:["us_cb"]
        },
        {
            updates:[
                {nodeName:"ISSUED_TO",nodeQueryAlias:"us_cb"}
            ],
            returnAliases:["us_cb"],
            queryType:'update'
        }
    ]
    return queryConfig;
}
module.exports.reIssue=reIssue;
module.exports.tempQ=function(){
    var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:null,
            endNode:null,
            returnAliases:["lib"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc",isNew:false},
            relation:{relationName:"LIBRARY_OF",relationQueryAlias:"sc_lib"},
            endNode:{nodeName:"Library",nodeQueryAlias:"lib",isNew:true},
            returnAliases:["lib"],
            queryType:'create'
        },
        {
            startNode:{nodeName:"Library",nodeQueryAlias:"lib",isNew:false},
            relation:{relationName:"PRIMARY_ADDRESS_OF",relationQueryAlias:"lib_pa"},
            endNode:{nodeName:"PrimaryAddress",nodeQueryAlias:"pa",isNew:true},
            returnAliases:["lib","pa"],
            queryType:'create'
        }
    ];
    /*var queryConfig=[
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:null,
            endNode:null,
            returnAliases:["sc"],
            queryType:'search'
        },
        {
            startNode:{nodeName:"School",nodeQueryAlias:"sc",isNew:false},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"sc_u"},
            endNode:{nodeName:"User",nodeQueryAlias:"u",isNew:true},
            returnAliases:["u"],
            queryType:'create'
        },
        {
            startNode:{nodeName:"ChildBook",nodeQueryAlias:"co",isNew:true},
            relation:null,
            endNode:null,
            returnAliases:["u","c"],
            queryType:'create'
        }
    ]*/
    return queryConfig;
};

function rateThisBookQuery(){
    var queryConfig=[
 {
            startNode:{nodeName:"School",nodeQueryAlias:"sc"},
            relation:{relationName:"USER_OF",relationQueryAlias:"sc_us"},
            endNode:{nodeName:"User",nodeQueryAlias:"us"},
            returnAliases:["us"]
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"CONTACT_OF",relationQueryAlias:"us_co"},
            endNode:{nodeQueryAlias:"co",nodeName:"Contact"},
            returnAliases:["us"]
        },
        {
            startNode:{nodeName:"User",nodeQueryAlias:"us"},
            relation:{relationName:"ISSUED_TO",relationQueryAlias:"us_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["cb","us_cb"]
        },
        {
            startNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            relation:{relationName:"CHILDBOOK_OF",relationQueryAlias:"pb_cb"},
            endNode:{nodeQueryAlias:"cb",nodeName:"ChildBook"},
            returnAliases:["pb","cb","us_cb"],
        },
        {
            startNode:{nodeQueryAlias:"cat",nodeName:"Category"},
            relation:{relationName:"BELONGS_TO",relationQueryAlias:"cat_pb"},
            endNode:{nodeQueryAlias:"pb",nodeName:"ParentBook"},
            returnAliases:["pb","cb","cat","us_cb"],
            orderBy:["cat.id ASC","cb.catBookSeqId DESC"],
            limit:25
        },
        {
            updates:[
                {nodeName:"ISSUED_TO",nodeQueryAlias:"us_cb"}
            ],
            returnAliases:["pb","cb","us_cb"],
            queryType:'update'
        }
        ]
    return queryConfig;
}
module.exports.rateThisBookQuery=rateThisBookQuery;