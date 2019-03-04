const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://<USERNAME>:<PASSWORD>@nraboy-sample-a22jr.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "example";
const PORT = 9292;

const app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));

let database, collection;

app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_URL, {useNewUrlParser: true}, (error, client) => {
        if (error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("people");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});
