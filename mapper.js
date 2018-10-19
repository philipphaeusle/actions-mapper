const helper = require('./helper.js');
const querystring = require('querystring');
const request = require('request');
const objectMapper = require('object-mapper');

function mapReverse(body, mapping,input) {
    if(typeof body !== "object"){
        try{
            body=JSON.parse(body)
        }catch(err){
            let errresponse=input;
            errresponse.actionStatus={"@type":"FailedActionStatus"};
            errresponse.error="The action failed because the target server responded wit malformed data";
            return errresponse;
        }
    }

    //TODO:make static insertions
    let staticValues=mapping["$staticOutput"];
    let out=mapping.output;

    out["[].name"]= [
        {
            "key": "[].name"
        },
        {
            "key": "[i]@type",
            transform: ()=> {return "Person"}
        }
    ];



let temp = objectMapper(body, out);
    return temp;

}

const map= (input, mapFile, cb) =>{
    let realtarget=mapFile.realTarget;
    let mapping=mapFile.mapping.input;
    let flatInput = helper.flatten(input);

    let requestType=realtarget.method;
    let requestURL=realtarget.url;
    let requestHeader=realtarget.header;

    let queryArray=[];
    let bodyArray=[];
    let headerArray=[];
    let isInvalid=false;

    Object.entries(mapping).forEach(function(m){
        //checks if required ones are not undefined.
        if(!isInvalid){
            if(!helper.checkForValidity(m[0],flatInput[m[0]],mapFile.generatedAction)){
                isInvalid=true;
            }
        }
        //if value undefined, skip this, if invalid skip all;
        if(flatInput[m[0]]===undefined || isInvalid){
            return;
        }
        switch(m[1].type){
            case "body":
                bodyArray.push({"path":m[1].path,"value":flatInput[m[0]]});
                break;
            case "query":
                //escape special characters
                queryArray.push(querystring.escape(m[1].path)+'='+querystring.escape(flatInput[m[0]]));
                break;
            case "header":
                headerArray.push({"path":m[1].path,"value":flatInput[m[0]]});
                break;
        }
    });

    if(isInvalid){
        let response=input;
        response.actionStatus={"@type":"FailedActionStatus"};
        response.error="The action failed because of a malformed request!";
        cb(response);
        return;
    }
    let body=null;
    let query=null;
    let header=requestHeader?requestHeader:null;
    //if body exists, create json body
    if(bodyArray.length!==0){
        body={};
        bodyArray.forEach(function (b){
            body[b.path]=b.value;
        });
    }

    //if query exists, create query string
    let qlength = queryArray.length;
    if(qlength!==0){
        query="?";
        let count=0;
        queryArray.forEach(function (q){
            count++;
            query+=q;
            if(count<qlength){
                query+="&";
            }
        });

    }

    //if header exists, create json header
    if(headerArray.length!==0){
        if(!header){
            header={};
        }
        headerArray.forEach(function (h){
            header[h.path]=h.value;
        });
    }
    //make request to the real target server

    if(query){
        requestURL+=query;
    }
    const options = {
        url: requestURL,
        method: requestType,
    };
    if(header){
        options.headers=header;
    }
    if(body){
        options.body=body;
    }

        request(options, function(err, res, body) {
            if(res && res.statusCode===200){
                let result=mapReverse(body,mapFile.mapping,input);
                input.result=result;
                delete input.entryPoint;
                input.actionStatus="CompletedActionStatus";
                cb(input);
            }else{
                let response=input;
                response.actionStatus={"@type":"FailedActionStatus"};
                if(res){
                    response.error="The action failed because the target server responded with HTTP status code: "+res.statusCode;
                }else{
                    response.error="The action failed because the target server did not respond";
                }

                cb(response);
            }

        });
};


module.exports = {
    map,
};


