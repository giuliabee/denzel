"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const mongoClient = require("mongodb").MongoClient;
const imdb = require("./imdb");
const graphqlHTTP = require('express-graphql');
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require('graphql');

const DENZEL_IMDB_ID = "nm0000243";
const CONNECTION_URL = "mongodb://localhost/test";
const DATABASE_NAME = "denzel";
const PORT = 9292;
const METASCORE = 70;

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

let database, collection;

// Functions
// Populate the database
async function populateMovies(callback) {
    console.log(`📽️  fetching filmography of ${DENZEL_IMDB_ID}...`);
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, callback);
}

// Fetch a random must-watch movie
async function randomMovie(callback) {
    console.log(`📽️  fetching random must-watch movie...`);
    database.collection("movies")
        .aggregate([
            {$match: {"metascore": {"$gt": METASCORE}}},
            {$sample: {size: 1}}
        ])
        .toArray(callback);
}

// Fetch a specific movie
async function specificMovie(callback, id) {
    console.log(`📽️  fetching movie ${id}...`);
    database.collection("movies")
        .aggregate([
            {$match: {"id": id}}
        ])
        .toArray(callback);
}

// Search for Denzel's movies
async function searchMovies(callback, metascore = 0, limit = 5) {
    console.log(`📽️  fetching Denzel"s movies...`);
    try {
        limit = parseInt(limit);
    } catch (e) {
        limit = 5;
    }
    try {
        metascore = parseInt(metascore);
    } catch (e) {
        metascore = 0;
    }
    database.collection("movies")
        .aggregate([
            {$match: {"metascore": {"$gt": metascore}}},
            {$limit: limit}
        ])
        .toArray(callback);
}

// Save a watched date and a review
async function reviewMovie(callback, id, date, review) {
    console.log(`📽️  saving review for ${id}...`);
    database.collection("movies").findOneAndUpdate(
        {"id": id},
        {$push: {"reviews": {"date": date, "review": review}}},
        callback
    );
}


// REST
// Populate the database
app.get("/movies/populate", (request, response) => {
    populateMovies((error, result) => {
        if (error) {
            throw error;
        }
        try {
            response.send(result.result);
        } catch
            (e) {
            console.error(e);
            process.exit(1);
        }
    })
});

// Fetch a random must-watch movie
app.get("/movies", (request, response) => {
    randomMovie((error, result) => {
        if (error) {
            throw error;
        }
        try {

            response.send(result);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
});

// Fetch a specific movie
app.get("/movies/:id(tt\\d+)", (request, response) => {
    specificMovie((error, result) => {
        if (error) {
            throw error;
        }
        try {
            response.send(result);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }, request.params.id);
});

// Search for Denzel"s movies
app.get("/movies/search", (request, response) => {
    searchMovies((error, result) => {
        if (error) {
            throw error;
        }
        try {
            response.send(result);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }, request.query.metascore, request.query.limit);
});


// Save a watched date and a review
app.post("/movies/:id", (request, response) => {
    console.log(request.params.id, request.body.date, request.body.review);
    reviewMovie((error, result) => {
        if (error) {
            throw error;
        }
        try {
            response.send({"ok": true});
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }, request.params.id, request.body.date, request.body.review);
});


//GraphQL
// Define Movie Type
const movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        link: {type: GraphQLString},
        metascore: {type: GraphQLInt},
        synopsis: {type: GraphQLString},
        title: {type: GraphQLString},
        year: {type: GraphQLInt}
    }
});

// Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        // Populate the database
        populate: {
            resolve: (source, args, context) => {
                return new Promise((resolve, reject) => {
                    populateMovies((error, result) => {
                        error ? reject(error) : resolve(result);
                    });
                });
            }
        },

        // Fetch a random must-watch movie
        random: {
            type: movieType,
            resolve: (source, args, context) => {
                return new Promise((resolve, reject) => {
                    randomMovie((error, result) => {
                        error ? reject(error) : resolve(result);
                    });
                });
            }
        },

        // Fetch a specific movie
        specific: {
            type: movieType,
            args: {
                id: {type: GraphQLString}
            },
            resolve: (source, args, context) => {
                return new Promise((resolve, reject) => {
                    specificMovie((error, result) => {
                        error ? reject(error) : resolve(result);
                    }, args.id);
                });
            }
        },

        // Search for Denzel's movies
        search: {
            type: movieType,
            args: {
                metascore: {type: GraphQLInt},
                limit: {type: GraphQLInt}
            },
            resolve: (source, args, context) => {
                return new Promise((resolve, reject) => {
                    searchMovies((error, result) => {
                        error ? reject(error) : resolve(result);
                    }, args.metascore, args.limit);
                });
            }
        },

        // Save a watched date and a review
        review: {
            type: movieType,
            args: {
                id: {type: GraphQLString},
                date: {type: GraphQLString},
                review: {type: GraphQLString}
            },
            resolve: (source, args, context) => {
                return new Promise((resolve, reject) => {
                    reviewMovie((error, result) => {
                        error ? reject(error) : resolve(result);
                    }, args.id, args.date, args.review);
                });
            }
        }
    }
});

// Define the Schema
const schema = new GraphQLSchema({
    query: queryType
});

mongoClient.connect(CONNECTION_URL, {useNewUrlParser: true}, (error, client) => {
    if (error) {
        throw error;
    }
    database = client.db(DATABASE_NAME);
    collection = database.collection("movies");
    console.log("Connected to `" + DATABASE_NAME + "`!");

    app.use('/graphql', graphqlHTTP({
        schema: schema,
        context: {collection},
        graphiql: true,
    }));

    app.listen(PORT);
});
