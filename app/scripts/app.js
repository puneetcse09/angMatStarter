'use strict';
var angularTestApp=
	angular.module('angularTestApp', ['ui.router','DirectiveUtil','ui.bootstrap','ngMaterial'])
    .run(
        [          '$rootScope', '$state', '$stateParams',
            function ($rootScope,   $state,   $stateParams) {

                // It's very handy to add references to $state and $stateParams to the $rootScope
                // so that you can access them from any scope within your applications.For example,
                // <li ui-sref-active="active }"> will set the <li> // to active whenever
                // 'contacts.list' or one of its decendents is active.
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
            }
        ]
    )
    .config(function($mdThemingProvider, $mdIconProvider){

                  $mdIconProvider
                      .defaultIconSet("./assets/svg/avatars.svg", 128)
                      .icon("menu"       , "./assets/svg/menu.svg"        , 24)
                      .icon("share"      , "./assets/svg/share.svg"       , 24)
                      .icon("google_plus", "./assets/svg/google_plus.svg" , 512)
                      .icon("hangouts"   , "./assets/svg/hangouts.svg"    , 512)
                      .icon("twitter"    , "./assets/svg/twitter.svg"     , 512)
                      .icon("phone"      , "./assets/svg/phone.svg"       , 512);

                      $mdThemingProvider.theme('default')
                          .primaryPalette('green')
                          .accentPalette('red');

              });

$(document).ready(function(){
    //adding some helper methods or overriding with prototype in existing functionalities provided by Javascript
    /*
     * @param replaceThis:string
     * @param withThis: string
     * @desc:adding replace all method to string
     */
    String.prototype.replaceAll = function (replaceThis, withThis) {
        var re = new RegExp(replaceThis,"g");
        return this.replace(re, withThis);
    };
    /*
     * @param index:integer number
     * @param item: object/string
     * @desc:inserts item to given index in an array
     */
    Array.prototype.insert = function (index, item) {
        this.splice(index, 0, item);
    };
    /*
     * @desc:converts camecase string into string seperated with spaces
     */
    String.prototype.camelCaseToWord = function() {
        // Preceed Uppercase (or sets of) with commas then remove any leading comma
        var delimited = this.replace(/([A-Z]+)/g, ",$1").replace(/^,/, "");
        // Split the string on commas and return the array
        var str=delimited.split(",").join(" ");
        str=str.charAt(0).toUpperCase()+str.substr(1,str.length);
        return str;
    };
    /*
    $('#side-menu').metisMenu();
    if ($(this).width() < 768) {
        $('div.sidebar-collapse').addClass('collapse')
    } else {
        $('div.sidebar-collapse').removeClass('collapse')
    }
    $(document).on('click', '.dropdown-menu[role="menu"] li', function (event) {
        event.preventDefault();
        if ($(this).hasClass('dropdown-submenu')) {
            return;
        } else {
            if ($(this).parents('li').hasClass('dropdown-submenu')) {
                $(this).parents('.btn-group').find('.dropdownValuePlaceHolder')
                    .text($(this).parents('li.dropdown-submenu').children('a').text())
                    .data('url',
                        $(this).parents('li.dropdown-submenu').children('a').data('url') + ' , ' + $(this).find('a').data('url'));
                return;
            }
        }
        $(this).parents('.btn-group').find('.dropdownValuePlaceHolder')
            .html($(this).find('a').html())
            .data('url', $(this).find('a').data('url'));

    });
    window.ddmmyyyTommddyyyy=function(dateStr,delimiter){
        if(!dateStr)return null;
        var arr=dateStr.split(delimiter);
        console.log("ddmmyyyTommddyyyy",dateStr,delimiter,arr);
        if(arr.length==3){
            var retStr=arr[1]+delimiter+arr[0]+delimiter+arr[2];
            console.log("ddmmyyyTommddyyyy retStr",retStr);
            return retStr;
        }else{
            return null;
        }
    }
    */
});
/*
$(window ).resize(function() {
    if ($(this).width() < 768) {
        $('div.sidebar-collapse').addClass('collapse')
    } else {
        $('div.sidebar-collapse').removeClass('collapse')
    }
});

*/