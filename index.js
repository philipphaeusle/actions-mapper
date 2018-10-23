const express = require('express');
const parser = require('body-parser');
const mapper = require('./mapper.js');
const mapper2 = require('./rmlMapper.js');
const fs = require('fs'); //remove later

const port=8082;

const app = express();
app.use(parser.json());

app.post('/mapping', (req, res) => {
    const reqbody = req.body;
    const mapId=req.query.mapId;

    if(!mapId || !Object.keys(reqbody).length){
        res.status(400);
        res.send('Need mapId and body');
    }
    let mapFile;

    /* CHANGE */
    //mapFile=getMapfile(mapId) TODO
   // let rawdata = fs.readFileSync('examples/semantifyJsonPath.json');
    let rawdata = fs.readFileSync('examples/semantify.json');
    mapFile = JSON.parse(rawdata);
    /* CHANGE */

    mapper.map(req.body,mapFile, function(resp){ res.send(resp)});
    //let response=mapper2.map(req.body,mapFile, (response) => res.send(response));

});


app.listen(port, () => console.log('Action mapper listening on port '+port+'!'));