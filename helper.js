const unflatten = function(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    let result = {}, cur, prop, idx, last, temp;
    for(let p in data) {
        cur = result, prop = "", last = 0;
        do {
            idx = p.indexOf(".", last);
            temp = p.substring(last, idx !== -1 ? idx : undefined);
            cur = cur[prop] || (cur[prop] = (!isNaN(parseInt(temp)) ? [] : {}));
            prop = temp;
            last = idx + 1;
        } while(idx >= 0);
        cur[prop] = data[p];
    }
    return result[""];
};

const flatten = function(data) {
    let result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for(let i=0, l=cur.length; i<l; i++)
                recurse(cur[i], prop ? prop+"."+i : ""+i);
            if (l == 0)
                result[prop] = [];
        } else {
            let isEmpty = true;
            for (let p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
};

const flattenRemove = function(data,toRemove) {
    let temp=flatten(data);
    let result={};
    Object.entries(temp).forEach(function(m){
        result[m[0].replace(toRemove,"")]=m[1]
    });
    return result;
};

const createPropValueSpecFromString =(string)=>{
    let obj={};
    string=string.replace(/ =/g, '=');
    string=string.replace(/= /g, '=');
    let lastChar = string.charAt(string.length - 1);
    if(lastChar !== ' '){
        string=string+' ';
    }
    obj['@type']='PropertyValueSpecification';
    if((string.indexOf('required=false')===-1 && (string.indexOf('required') !==-1|| string.indexOf('required=true')!==-1))){
        obj.valueRequired=true;
    }else{
        obj.valueRequired=false;
    }
    if((string.indexOf('readOnly=false')===-1 && (string.indexOf('readOnly') !==-1|| string.indexOf('readOnly=true')!==-1))){
        obj.readOnlyValue=true;
    }
    if((string.indexOf('multiple=false')===-1 && (string.indexOf('multiple') !==-1|| string.indexOf('multiple=true')!==-1))){
        obj.multipleValues=true;
    }
    if(string.indexOf('min=')!==-1){
        let value=string.substring(string.indexOf('min')+1+('min').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.minValue=value;
    }
    if(string.indexOf('max=')!==-1){
        let value=string.substring(string.indexOf('max')+1+('max').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.maxValue=value;
    }
    if(string.indexOf('minLenght=')!==-1){
        let value=string.substring(string.indexOf("minLenght")+1+('minLenght').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.valueMinLength=value;
    }
    if(string.indexOf('maxLength=')!==-1){
        let value=string.substring(string.indexOf("maxLength")+1+('maxLength').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.valueMaxLength=value;
    }
    if(string.indexOf('name=')!==-1){
        let value=string.substring(string.indexOf("name")+1+('name').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.valueName=value;
    }
    if(string.indexOf('default=')!==-1){
        let value=string.substring(string.indexOf("default")+1+('default').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.defaultValue=value;
    }
    if(string.indexOf('step=')!==-1){
        let value=string.substring(string.indexOf("step")+1+('step').length,string.length);
        value=value.substring(0,value.indexOf(' '));
        obj.stepValue=value;
    }
    return obj;
};

const checkForValidity = function(path,value,action) {
    let pathArr=path.split('.');
    let error=false;
    //loop through obj to find propertyValueSpecification;
    pathArr.forEach(function(p){
        if(action[p]){
            action=action[p];
        }else if(action[p+"-input"]){
            action=action[p+"-input"]
        } else if(action[p+"-output"]){
        action=action[p+"-output"]
        }
        else{
            error=true;
        }
    });
    //return invalid if an error occured;
    if(error){
        console.log("checkForValidity: Could not find path "+ path);
        return true;
    }
    //getPropValueSpecification
    let propValSpec={};
    if(typeof action === "string"){
        propValSpec=createPropValueSpecFromString(action);
    }else{
        propValSpec=action;
    }

    //check if valueIsRequired
    //TODO: maxbe check length, regex and so on
    if(value===undefined && propValSpec.valueRequired===true){
        console.log("checkForValidity: "+path+" required but "+value);
        return false
    }else{
        return true;
    }
};


module.exports = {
    flatten, unflatten, flattenRemove, createPropValueSpecFromString,checkForValidity
};

