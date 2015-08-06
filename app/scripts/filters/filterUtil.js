var FilterUtil=angular.module('FilterUtil',[]);
FilterUtil.filter('orderObjectBy', function() {
    return function(items, field, reverse,searchObj) {
        console.log("orderby--",items, field, reverse,searchObj);
        var searchContent=null;
        if(searchObj && searchObj.hasOwnProperty('$') ){
            searchContent=searchObj['$']
        }
        console.log("searchContent",searchContent);
        var filtered = [];
        angular.forEach(items, function(item) {

            if(searchContent){
                for(var key in item){
                    var value=item[key];
                    if(key=='children'){
                        for(var childKey in value){
                            var childValue=value[childKey];
                            if(childValue && typeof childValue=='string' && childValue.indexOf(searchContent)>-1){
                                filtered.push(item);
                                break;
                            }else if (childValue && typeof childValue=='number' && childValue==searchContent){
                                filtered.push(item);
                                break;
                            }
                        }
                    }else{
                        if(value && typeof value=='string' && value.indexOf(searchContent)>-1){
                            filtered.push(item);
                            break;
                        }else if (value && typeof value=='number' && value==searchContent){
                            filtered.push(item);
                            break;
                        }
                    }

                }
            }else{
                filtered.push(item);
            }

        });
        filtered.sort(function (a, b) {
            //console.log("a,b",a,b);
            return (a[field] > b[field]);
        });
        if(reverse) filtered.reverse();
        return filtered;
    };

});
